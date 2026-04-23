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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.petidconnect.nfcwriter.ui.PetIdNfcTheme
import com.petidconnect.nfcwriter.ui.WriterAppScreen
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.BufferedWriter
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL
import java.util.Locale
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

data class WritePayload(
    val uid: String,
    val url: String,
    val handoffToken: String,
)

private enum class AppMode {
    Landing,
    LinkU,
    Tools,
}

private sealed class ServerReport {
    data object Ok : ServerReport()
    data class SkippedNoConfig(val hint: String) : ServerReport()
    data class Fail(val message: String) : ServerReport()
}

class MainActivity : ComponentActivity() {
    private var appMode by mutableStateOf(AppMode.Landing)
    private var entryFromDeepLink by mutableStateOf(false)
    private var statusText by mutableStateOf("Link-U 웹에서 기록 흐름을 쓰면 자동으로 불러옵니다. 직접 쓸 땐 아래에 입력하세요.")
    private var draftUid by mutableStateOf("")
    private var draftUrl by mutableStateOf("")
    private var draftHandoff by mutableStateOf("")
    /** 기록 시작 후 태그 쓰기에 사용하는 스냅샷 */
    private var pendingWrite: WritePayload? = null
    private var awaitingTag by mutableStateOf(false)
    private var busy by mutableStateOf(false)
    /** NDEF 쓰기(태그 기록) 성공 직후 Primary 버튼에 완료 문구 표시 */
    private var tagWriteSuccess by mutableStateOf(false)

    private var nfcAdapter: NfcAdapter? = null
    private lateinit var serverSettings: NfcServerSettings
    private var showServerFields by mutableStateOf(false)
    private var serverBaseInput by mutableStateOf("")
    private var serverKeyInput by mutableStateOf("")
    private var profileSiteInput by mutableStateOf("")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        serverSettings = NfcServerSettings(this)
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        loadServerFieldsFromPrefs()
        handleIntent(intent)
        enableEdgeToEdge()

        setContent {
            PetIdNfcTheme {
                WriterAppScreen(
                    appMode = appMode.name,
                    entryFromDeepLink = entryFromDeepLink,
                    onSelectLinkU = {
                        appMode = AppMode.LinkU
                        if (statusText.isBlank()) {
                            statusText = "Link-U 모드입니다. 웹에서 자동 입력되거나 아래에 직접 입력해 태그를 기록할 수 있어요."
                        }
                    },
                    onSelectTools = {
                        appMode = AppMode.Tools
                        if (statusText.isBlank() || statusText.contains("웹에서 불러왔어요")) {
                            statusText = "일반 NFC 도구 모드입니다. URL/텍스트 태그 기록을 바로 시작할 수 있어요."
                        }
                    },
                    onBackToLanding = {
                        if (entryFromDeepLink) {
                            statusText = "태그/웹에서 들어온 Link-U 세션입니다. 아래에서 바로 기록을 진행해 주세요."
                        } else {
                            appMode = AppMode.Landing
                            awaitingTag = false
                            busy = false
                            pendingWrite = null
                            tagWriteSuccess = false
                            statusText = "모드를 선택해 시작해 주세요."
                        }
                    },
                    status = statusText,
                    draftUid = draftUid,
                    draftUrl = draftUrl,
                    draftHandoff = draftHandoff,
                    onDraftUid = {
                        draftUid = it
                        tagWriteSuccess = false
                    },
                    onDraftUrl = {
                        draftUrl = it
                        tagWriteSuccess = false
                    },
                    onDraftHandoff = {
                        draftHandoff = it
                        tagWriteSuccess = false
                    },
                    onFillProfileUrl = { fillProfileUrlFromUid() },
                    awaitingTag = awaitingTag,
                    busy = busy,
                    showServerFields = showServerFields,
                    onToggleServerFields = { showServerFields = it },
                    serverBaseInput = serverBaseInput,
                    serverKeyInput = serverKeyInput,
                    profileSiteInput = profileSiteInput,
                    onServerBase = { serverBaseInput = it },
                    onServerKey = { serverKeyInput = it },
                    onProfileSite = { profileSiteInput = it },
                    onSaveServer = { saveServerSettings() },
                    tagWriteSuccess = tagWriteSuccess,
                    onPrepareWrite = { onUserStartWrite() },
                    onOpenNfcSettings = {
                        startActivity(Intent(Settings.ACTION_NFC_SETTINGS))
                    },
                )
            }
        }
    }

    private fun loadServerFieldsFromPrefs() {
        serverBaseInput = serverSettings.getApiBaseOrEmpty()
        serverKeyInput = serverSettings.getApiKeyOrEmpty()
        val ps = serverSettings.getProfileSiteBaseOrEmpty()
        profileSiteInput = if (ps.isNotEmpty()) ps else serverBaseInput
    }

    private fun saveServerSettings() {
        serverSettings.setApiBase(serverBaseInput)
        serverSettings.setApiKey(serverKeyInput)
        serverSettings.setProfileSiteBase(profileSiteInput)
        statusText = "저장했어요. 다시 [태그에 쓰기]를 눌러 주세요."
    }

    private fun fillProfileUrlFromUid() {
        val u = draftUid.trim()
        if (u.isEmpty()) {
            statusText = "태그·제품 ID를 먼저 넣어 주세요."
            return
        }
        val site = profileSiteInput.trim().trimEnd('/').ifEmpty {
            serverSettings.getApiBaseOrEmpty().ifEmpty { BuildConfig.NATIVE_API_BASE_URL.trim().trimEnd('/') }
        }
        if (site.isEmpty()) {
            statusText = "아래 [Link-U 서비스에 기록]에 주소를 넣거나, 앱을 처음 빌드할 때 기본 주소를 넣어 주세요."
            return
        }
        val encoded = URLEncoder.encode(u, Charsets.UTF_8.name())
        draftUrl = "$site/t/$encoded"
        statusText = "주소를 맞게 채웠어요. 확인한 뒤 [태그에 쓰기]를 눌러 주세요."
    }

    private fun onUserStartWrite() {
        if (busy) return
        val u = draftUid.trim()
        val purl = draftUrl.trim()
        val tok = draftHandoff.trim()
        val requireHandoff = appMode == AppMode.LinkU
        if (u.isEmpty() || purl.isEmpty() || (requireHandoff && tok.isEmpty())) {
            statusText = if (requireHandoff) {
                "Link-U 모드에서는 세 칸을 모두 채워 주세요. 웹에서 복사해 붙여 넣을 수 있어요."
            } else {
                "일반 도구 모드에서는 태그·제품 ID와 URL을 먼저 채워 주세요."
            }
            return
        }
        tagWriteSuccess = false
        pendingWrite = WritePayload(uid = u, url = purl, handoffToken = tok)
        awaitingTag = true
        statusText = "휴대폰 뒤에 태그를 가깝게 대 주세요."
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)

        if (NfcAdapter.ACTION_TAG_DISCOVERED == intent.action ||
            NfcAdapter.ACTION_NDEF_DISCOVERED == intent.action ||
            NfcAdapter.ACTION_TECH_DISCOVERED == intent.action
        ) {
            val tag: Tag? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(NfcAdapter.EXTRA_TAG, Tag::class.java)
            } else {
                @Suppress("DEPRECATION")
                intent.getParcelableExtra(NfcAdapter.EXTRA_TAG)
            }
            if (tag != null) {
                onTagDetected(tag)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        val adapter = nfcAdapter ?: return
        if (!adapter.isEnabled) {
            statusText = "NFC가 꺼져 있어요. 위 버튼으로 설정을 연 뒤 켜 주세요."
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
            statusText = "자동으로 못 가져왔어요. 웹에서 다시 열어 주시거나 아래에 직접 넣어 주세요."
            return
        }

        draftUid = uid
        draftUrl = profileUrl
        draftHandoff = handoffToken
        appMode = AppMode.LinkU
        entryFromDeepLink = true
        pendingWrite = null
        awaitingTag = false
        tagWriteSuccess = false
        statusText = "웹에서 불러왔어요. [태그에 쓰기]를 누른 뒤, 휴대폰 뒤에 태그를 대 주세요."
    }

    private fun onTagDetected(tag: Tag) {
        val current = pendingWrite
        if (!awaitingTag || busy || current == null) {
            return
        }

        busy = true
        statusText = "태그에 쓰는 중…"

        CoroutineScope(Dispatchers.IO).launch {
            val writeResult = writeNdefUrl(tag, current.url)
            val report = if (appMode == AppMode.LinkU && current.handoffToken.isNotBlank()) {
                postNativeWriteResult(
                    payload = current,
                    success = writeResult.isSuccess,
                    clientError = writeResult.exceptionOrNull()?.message
                )
            } else {
                ServerReport.SkippedNoConfig("일반 NFC 도구 모드에서는 Link-U 서버 기록을 생략했어요.")
            }

            launch(Dispatchers.Main) {
                busy = false
                awaitingTag = false
                pendingWrite = null

                if (writeResult.isSuccess) {
                    tagWriteSuccess = true
                    statusText = when (report) {
                        is ServerReport.Ok -> "태그에 담았고, Link-U 서비스에도 기록됐어요. 감사합니다."
                        is ServerReport.SkippedNoConfig ->
                            "태그에는 잘 담았어요. ${report.hint}"
                        is ServerReport.Fail ->
                            "태그 쓰기는 됐는데 서비스 기록에 실패했어요: ${report.message}"
                    }
                } else {
                    tagWriteSuccess = false
                    statusText = "태그에 쓰지 못했어요: ${writeResult.exceptionOrNull()?.message ?: "잠시 후 다시 시도해 주세요."}"
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
                    if (!ndef.isWritable) error("이 태그에는 지금 쓸 수 없어요.")
                    if (ndef.maxSize < message.toByteArray().size) {
                        error("쓰려는 내용이 태그 용량보다 커요. 링크를 짧게 하거나 관리자에게 문의해 주세요.")
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

            error("이 태그(제품)는 이런 방식 쓰기를 지원하지 않아요.")
        }
    }

    private fun getEffectiveApiBase(): String {
        val fromPrefs = serverSettings.getApiBaseOrEmpty()
        if (fromPrefs.isNotEmpty()) return fromPrefs
        return BuildConfig.NATIVE_API_BASE_URL.trim().trimEnd('/')
    }

    private fun getEffectiveApiKey(): String {
        val fromPrefs = serverSettings.getApiKeyOrEmpty()
        if (fromPrefs.isNotEmpty()) return fromPrefs
        return BuildConfig.NATIVE_APP_API_KEY.trim()
    }

    private fun postNativeWriteResult(
        payload: WritePayload,
        success: Boolean,
        clientError: String?
    ): ServerReport {
        val baseUrl = getEffectiveApiBase()
        val apiKey = getEffectiveApiKey()
        if (baseUrl.isBlank() || apiKey.isBlank()) {
            return ServerReport.SkippedNoConfig(
                "Link-U에 ‘쓰기 끝’을 남기려면, 아래 [Link-U 서비스에 기록]에 주소·암호를 넣고 저장하세요. (태그 쓰기는 이미 끝났어요.)"
            )
        }

        return runCatching<ServerReport> {
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
            ServerReport.Ok
        }.getOrElse { e: Throwable ->
            ServerReport.Fail(e.message ?: "알 수 없는 오류")
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
