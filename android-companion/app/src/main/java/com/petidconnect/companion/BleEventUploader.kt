package com.petidconnect.companion

import android.webkit.CookieManager
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.TimeUnit

data class BleUploadResult(
    val ok: Boolean,
    val httpCode: Int,
    val message: String,
)

/**
 * 보호자 웹 세션 쿠키로 `POST /api/ble/events` 호출.
 * 쿠키는 WebView [CookieManager]와 공유 (LoginWebViewActivity).
 */
class BleEventUploader(
    apiBaseUrl: String,
) {
    private val base = apiBaseUrl.trim().trimEnd('/')
    private val client = OkHttpClient.Builder()
        .cookieJar(WebViewCookieJar())
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    fun hasSessionCookie(): Boolean {
        val url = base.toHttpUrlOrNull() ?: return false
        val jar = CookieManager.getInstance().getCookie(base).orEmpty()
        return jar.isNotBlank() && url.host.isNotBlank()
    }

    fun postEvent(
        petId: String,
        eventType: String,
        rssi: Int?,
        latitude: Double?,
        longitude: Double?,
        tagId: String?,
        mac: String?,
    ): BleUploadResult {
        if (base.isEmpty()) {
            return BleUploadResult(false, 0, "NATIVE_API_BASE_URL 미설정")
        }
        val url = "$base/api/ble/events"
        val raw = JSONObject().apply {
            put("fw", "companion-${BuildConfig.VERSION_NAME}")
            put("device_nonce", UUID.randomUUID().toString())
            if (!tagId.isNullOrBlank()) put("tag_id", tagId)
            if (!mac.isNullOrBlank()) put("ble_mac", mac)
        }
        val bodyJson = JSONObject().apply {
            put("pet_id", petId)
            put("event_type", eventType)
            if (rssi != null) put("rssi", rssi)
            if (latitude != null) put("latitude", latitude)
            if (longitude != null) put("longitude", longitude)
            put("raw_payload", raw)
        }
        val req = Request.Builder()
            .url(url)
            .post(bodyJson.toString().toRequestBody(JSON_MEDIA))
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
            .build()
        return try {
            client.newCall(req).execute().use { resp ->
                val text = resp.body?.string().orEmpty()
                if (resp.isSuccessful) {
                    BleUploadResult(true, resp.code, "ok")
                } else {
                    val err = runCatching {
                        JSONObject(text).optString("error").ifBlank { text.take(120) }
                    }.getOrDefault(text.take(120))
                    BleUploadResult(false, resp.code, err.ifBlank { "HTTP ${resp.code}" })
                }
            }
        } catch (e: Exception) {
            BleUploadResult(false, 0, e.message ?: "network error")
        }
    }

    private class WebViewCookieJar : CookieJar {
        override fun loadForRequest(url: HttpUrl): List<Cookie> {
            val raw = CookieManager.getInstance().getCookie(url.toString()).orEmpty()
            if (raw.isBlank()) return emptyList()
            return raw.split(';')
                .mapNotNull { part ->
                    val trimmed = part.trim()
                    if (trimmed.isEmpty()) return@mapNotNull null
                    Cookie.parse(url, trimmed)
                }
        }

        override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
            val cm = CookieManager.getInstance()
            for (c in cookies) {
                cm.setCookie(url.toString(), c.toString())
            }
            cm.flush()
        }
    }

    companion object {
        private val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()
    }
}
