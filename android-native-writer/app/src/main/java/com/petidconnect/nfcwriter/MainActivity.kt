package com.petidconnect.nfcwriter

import android.app.PendingIntent
import android.content.Intent
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.Ndef
import android.nfc.tech.NdefFormatable
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.BufferedWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

data class WritePayload(
    val uid: String,
    val url: String,
    val handoffToken: String,
)

class MainActivity : ComponentActivity() {
    private var statusText by mutableStateOf("딥링크를 기다리는 중입니다.")
    private var payload by mutableStateOf<WritePayload?>(null)
    private var awaitingTag by mutableStateOf(false)
    private var busy by mutableStateOf(false)

    private var nfcAdapter: NfcAdapter? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        handleIntent(intent)

        setContent {
            MaterialTheme {
                WriterScreen(
                    status = statusText,
                    payload = payload,
                    awaitingTag = awaitingTag,
                    busy = busy,
                    onPrepareWrite = {
                        val currentPayload = payload
                        if (currentPayload == null) {
                            statusText = "딥링크 값(uid/url/handoffToken)이 없어 기록을 시작할 수 없습니다."
                        } else {
                            awaitingTag = true
                            statusText = "태그를 휴대폰 뒷면에 대주세요."
                        }
                    },
                    onOpenNfcSettings = {
                        startActivity(Intent(Settings.ACTION_NFC_SETTINGS))
                    }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)

        if (NfcAdapter.ACTION_TAG_DISCOVERED == intent.action ||
            NfcAdapter.ACTION_NDEF_DISCOVERED == intent.action ||
            NfcAdapter.ACTION_TECH_DISCOVERED == intent.action
        ) {
            val tag = intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG)
            if (tag != null) {
                onTagDetected(tag)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        val adapter = nfcAdapter ?: return
        if (!adapter.isEnabled) {
            statusText = "NFC가 꺼져 있습니다. 설정에서 NFC를 켠 뒤 다시 시도하세요."
            return
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.FLAG_MUTABLE
        } else {
            0
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, javaClass).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            flags
        )
        adapter.enableForegroundDispatch(this, pendingIntent, null, null)
    }

    override fun onPause() {
        super.onPause()
        nfcAdapter?.disableForegroundDispatch(this)
    }

    private fun handleIntent(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme != "petidconnect" || data.host != "nfc" || data.path != "/write") {
            return
        }
        val uid = data.getQueryParameter("uid")?.trim().orEmpty()
        val profileUrl = data.getQueryParameter("url")?.trim().orEmpty()
        val handoffToken = data.getQueryParameter("handoffToken")?.trim().orEmpty()

        if (uid.isBlank() || profileUrl.isBlank() || handoffToken.isBlank()) {
            statusText = "딥링크 파라미터가 누락되었습니다(uid/url/handoffToken)."
            payload = null
            awaitingTag = false
            return
        }

        payload = WritePayload(uid = uid, url = profileUrl, handoffToken = handoffToken)
        awaitingTag = true
        statusText = "작업을 받았습니다. 태그를 휴대폰 뒷면에 대주세요."
    }

    private fun onTagDetected(tag: Tag) {
        val current = payload
        if (!awaitingTag || busy || current == null) {
            return
        }

        busy = true
        statusText = "태그에 URL을 기록 중입니다..."

        CoroutineScope(Dispatchers.IO).launch {
            val writeResult = writeNdefUrl(tag, current.url)
            val callbackResult = postNativeWriteResult(
                payload = current,
                success = writeResult.isSuccess,
                clientError = writeResult.exceptionOrNull()?.message
            )

            launch(Dispatchers.Main) {
                busy = false
                awaitingTag = false

                if (writeResult.isSuccess) {
                    statusText = if (callbackResult.isSuccess) {
                        "기록 완료: 태그 URL 쓰기와 서버 보고가 모두 성공했습니다."
                    } else {
                        "태그 URL 기록은 성공했지만 서버 보고에 실패했습니다: ${callbackResult.exceptionOrNull()?.message}"
                    }
                } else {
                    statusText = "태그 URL 기록 실패: ${writeResult.exceptionOrNull()?.message ?: "알 수 없는 오류"}"
                }
            }
        }
    }

    private fun writeNdefUrl(tag: Tag, profileUrl: String): Result<Unit> {
        return runCatching {
            val record = NdefRecord.createUri(profileUrl)
            val message = NdefMessage(arrayOf(record))

            val ndef = Ndef.get(tag)
            if (ndef != null) {
                ndef.connect()
                try {
                    if (!ndef.isWritable) error("이 태그는 쓰기 불가 상태입니다.")
                    if (ndef.maxSize < message.toByteArray().size) {
                        error("태그 용량이 부족합니다.")
                    }
                    ndef.writeNdefMessage(message)
                } finally {
                    ndef.close()
                }
                return@runCatching
            }

            val formatable = NdefFormatable.get(tag)
            if (formatable != null) {
                formatable.connect()
                try {
                    formatable.format(message)
                } finally {
                    formatable.close()
                }
                return@runCatching
            }

            error("NDEF를 지원하지 않는 태그입니다.")
        }
    }

    private fun postNativeWriteResult(
        payload: WritePayload,
        success: Boolean,
        clientError: String?
    ): Result<Unit> {
        val baseUrl = BuildConfig.NATIVE_API_BASE_URL.trim().trimEnd('/')
        val apiKey = BuildConfig.NATIVE_APP_API_KEY.trim()
        if (baseUrl.isBlank() || apiKey.isBlank()) {
            return Result.failure(IllegalStateException("앱 설정(NATIVE_API_BASE_URL / NATIVE_APP_API_KEY)이 비어 있습니다."))
        }

        return runCatching {
            val endpoint = URL("$baseUrl/api/admin/nfc/native-write")
            val body = JSONObject().apply {
                put("tagId", payload.uid)
                put("url", payload.url)
                put("handoffToken", payload.handoffToken)
                put("deviceId", Build.MODEL ?: "unknown-device")
                put("success", success)
                put("clientError", clientError ?: JSONObject.NULL)
                put("writtenAt", java.time.Instant.now().toString())
            }.toString()

            val connection = (endpoint.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10_000
                readTimeout = 10_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Authorization", "Bearer $apiKey")
            }

            attachOptionalHmacHeaders(connection, body)

            connection.outputStream.use { out ->
                BufferedWriter(out.writer()).use { writer ->
                    writer.write(body)
                }
            }

            val code = connection.responseCode
            if (code !in 200..299) {
                val errText = runCatching {
                    connection.errorStream?.bufferedReader()?.readText().orEmpty()
                }.getOrDefault("")
                error("서버 응답 실패($code) ${errText.take(300)}")
            }
        }
    }

    private fun attachOptionalHmacHeaders(connection: HttpURLConnection, body: String) {
        val current = BuildConfig.NATIVE_HMAC_SECRET_CURRENT.trim()
        val next = BuildConfig.NATIVE_HMAC_SECRET_NEXT.trim()
        val secret = when {
            next.isNotEmpty() -> next to "next"
            current.isNotEmpty() -> current to "current"
            else -> null
        } ?: return

        val timestamp = (System.currentTimeMillis() / 1000L).toString()
        val signed = "$timestamp.$body"
        val signature = hmacSha256Hex(secret.first, signed)

        connection.setRequestProperty("x-native-timestamp", timestamp)
        connection.setRequestProperty("x-native-key-id", secret.second)
        connection.setRequestProperty("x-native-signature", signature)
    }

    private fun hmacSha256Hex(secret: String, payload: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        val key = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256")
        mac.init(key)
        return mac.doFinal(payload.toByteArray(Charsets.UTF_8)).joinToString("") {
            String.format(Locale.US, "%02x", it)
        }
    }
}

@Composable
private fun WriterScreen(
    status: String,
    payload: WritePayload?,
    awaitingTag: Boolean,
    busy: Boolean,
    onPrepareWrite: () -> Unit,
    onOpenNfcSettings: () -> Unit,
) {

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Pet-ID NFC Writer", style = MaterialTheme.typography.headlineSmall)
        Text("웹에서 전달된 URL을 태그에 기록하는 안드로이드 전용 앱입니다.")

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("UID: ${payload?.uid ?: "(없음)"}")
                Text("URL: ${payload?.url ?: "(없음)"}")
                Text("토큰: ${if (payload == null) "(없음)" else "수신됨"}")
            }
        }

        Text(
            text = status,
            style = MaterialTheme.typography.bodyLarge,
            color = if (status.contains("실패")) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
        )

        Button(
            onClick = onPrepareWrite,
            modifier = Modifier.fillMaxWidth(),
            enabled = payload != null && !busy
        ) {
            Text(if (awaitingTag) "태그 대기 중..." else "기록 시작")
        }

        OutlinedButton(onClick = onOpenNfcSettings, modifier = Modifier.fillMaxWidth()) {
            Text("NFC 설정 열기")
        }

        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "딥링크 예시: petidconnect://nfc/write?uid=04:A1:...&url=https://example.com/t/uid&handoffToken=...",
            style = MaterialTheme.typography.bodySmall
        )
    }
}


