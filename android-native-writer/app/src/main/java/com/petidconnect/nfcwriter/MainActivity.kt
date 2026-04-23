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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
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

private sealed class ServerReport {
    data object Ok : ServerReport()
    data class SkippedNoConfig(val hint: String) : ServerReport()
    data class Fail(val message: String) : ServerReport()
}

class MainActivity : ComponentActivity() {
    private var statusText by mutableStateOf("딥링크를 기다리거나 아래에 값을 입력하세요.")
    private var draftUid by mutableStateOf("")
    private var draftUrl by mutableStateOf("")
    private var draftHandoff by mutableStateOf("")
    /** 기록 시작 후 태그 쓰기에 사용하는 스냅샷 */
    private var pendingWrite: WritePayload? = null
    private var awaitingTag by mutableStateOf(false)
    private var busy by mutableStateOf(false)

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

        setContent {
            MaterialTheme {
                WriterScreen(
                    status = statusText,
                    draftUid = draftUid,
                    draftUrl = draftUrl,
                    draftHandoff = draftHandoff,
                    onDraftUid = { draftUid = it },
                    onDraftUrl = { draftUrl = it },
                    onDraftHandoff = { draftHandoff = it },
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
        statusText = "서버 보고 설정이 저장되었습니다. 기록을 다시 시도해 주세요."
    }

    private fun fillProfileUrlFromUid() {
        val u = draftUid.trim()
        if (u.isEmpty()) {
            statusText = "UID를 먼저 입력하세요."
            return
        }
        val site = profileSiteInput.trim().trimEnd('/').ifEmpty {
            serverSettings.getApiBaseOrEmpty().ifEmpty { BuildConfig.NATIVE_API_BASE_URL.trim().trimEnd('/') }
        }
        if (site.isEmpty()) {
            statusText = "프로필 사이트 URL(또는 API 기본 주소)을 서버 보고 설정에 입력하세요."
            return
        }
        val encoded = URLEncoder.encode(u, Charsets.UTF_8.name())
        draftUrl = "$site/t/$encoded"
        statusText = "URL을 $site 기준으로 채웠습니다. 필요하면 수정하세요."
    }

    private fun onUserStartWrite() {
        if (busy) return
        val u = draftUid.trim()
        val purl = draftUrl.trim()
        val tok = draftHandoff.trim()
        if (u.isEmpty() || purl.isEmpty() || tok.isEmpty()) {
            statusText = "UID, URL, 핸드오프 토큰을 모두 입력하세요."
            return
        }
        pendingWrite = WritePayload(uid = u, url = purl, handoffToken = tok)
        awaitingTag = true
        statusText = "태그를 휴대폰 뒷면에 대주세요."
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
            return
        }

        draftUid = uid
        draftUrl = profileUrl
        draftHandoff = handoffToken
        pendingWrite = null
        awaitingTag = false
        statusText = "딥링크로 값이 채워졌습니다. '기록 시작'을 누른 뒤 태그에 대주세요."
    }

    private fun onTagDetected(tag: Tag) {
        val current = pendingWrite
        if (!awaitingTag || busy || current == null) {
            return
        }

        busy = true
        statusText = "태그에 URL을 기록 중입니다..."

        CoroutineScope(Dispatchers.IO).launch {
            val writeResult = writeNdefUrl(tag, current.url)
            val report = postNativeWriteResult(
                payload = current,
                success = writeResult.isSuccess,
                clientError = writeResult.exceptionOrNull()?.message
            )

            launch(Dispatchers.Main) {
                busy = false
                awaitingTag = false
                pendingWrite = null

                if (writeResult.isSuccess) {
                    statusText = when (report) {
                        is ServerReport.Ok -> "기록 완료: 태그 URL 쓰기와 서버 보고가 모두 성공했습니다."
                        is ServerReport.SkippedNoConfig ->
                            "태그 URL 기록은 완료되었습니다. ${report.hint}"
                        is ServerReport.Fail ->
                            "태그 URL 기록은 성공했지만 서버 보고에 실패했습니다: ${report.message}"
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
                "서버 보고는 건너뜀(API 주소/키 없음). 아래 '서버 보고 설정'에 배포 URL과 " +
                    "NFC_NATIVE_APP_API_KEY(서버와 동일)를 저장하세요."
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

@Composable
private fun WriterScreen(
    status: String,
    draftUid: String,
    draftUrl: String,
    draftHandoff: String,
    onDraftUid: (String) -> Unit,
    onDraftUrl: (String) -> Unit,
    onDraftHandoff: (String) -> Unit,
    onFillProfileUrl: () -> Unit,
    awaitingTag: Boolean,
    busy: Boolean,
    showServerFields: Boolean,
    onToggleServerFields: (Boolean) -> Unit,
    serverBaseInput: String,
    serverKeyInput: String,
    profileSiteInput: String,
    onServerBase: (String) -> Unit,
    onServerKey: (String) -> Unit,
    onProfileSite: (String) -> Unit,
    onSaveServer: () -> Unit,
    onPrepareWrite: () -> Unit,
    onOpenNfcSettings: () -> Unit,
) {
    val scroll = rememberScrollState()
    val statusError =
        status.contains("실패") && !status.contains("서버 보고는 건너뜀", ignoreCase = true)
    val statusOkPartial = status.contains("완료되었습니다. 서버 보고", ignoreCase = true) ||
        status.contains("서버 보고는 건너뜀", ignoreCase = true)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scroll)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Pet-ID NFC Writer", style = MaterialTheme.typography.headlineSmall)
        Text("웹에서 전달하거나, 아래에 직접 입력한 URL을 태그에 기록합니다.")

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = draftUid,
                    onValueChange = onDraftUid,
                    label = { Text("태그 UID") },
                    singleLine = true,
                    enabled = !busy,
                    keyboardOptions = KeyboardOptions.Default,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = draftUrl,
                    onValueChange = onDraftUrl,
                    label = { Text("기록할 프로필 URL") },
                    minLines = 2,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedButton(
                    onClick = onFillProfileUrl,
                    enabled = !busy
                ) {
                    Text("URL 자동(UID+사이트)")
                }
                OutlinedTextField(
                    value = draftHandoff,
                    onValueChange = onDraftHandoff,
                    label = { Text("핸드오프 토큰(웹 발급)") },
                    minLines = 2,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        OutlinedButton(
            onClick = { onToggleServerFields(!showServerFields) }
        ) {
            Text(if (showServerFields) "서버 보고 설정 닫기" else "서버 보고 설정(API·키·프로필 사이트)")
        }

        if (showServerFields) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("서버에 쓰기 완료를 보고하려면 배포 URL과 서버에 설정한 NFC_NATIVE_APP_API_KEY(동일 값)이 필요합니다.")
                    OutlinedTextField(
                        value = serverBaseInput,
                        onValueChange = onServerBase,
                        label = { Text("API 기본 URL(예: https://xxx.pages.dev)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = serverKeyInput,
                        onValueChange = onServerKey,
                        label = { Text("NATIVE 앱 API 키(서버와 동일)") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = profileSiteInput,
                        onValueChange = onProfileSite,
                        label = { Text("프로필 사이트(자동 URL용, 비어 있으면 API URL 사용)") },
                        minLines = 1,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Button(
                        onClick = onSaveServer,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("설정 저장")
                    }
                }
            }
        }

        Text(
            text = status,
            style = MaterialTheme.typography.bodyLarge,
            color = when {
                statusError -> MaterialTheme.colorScheme.error
                statusOkPartial -> MaterialTheme.colorScheme.primary
                else -> MaterialTheme.colorScheme.onSurface
            }
        )

        Button(
            onClick = onPrepareWrite,
            modifier = Modifier.fillMaxWidth(),
            enabled = !busy
        ) {
            Text(
                if (awaitingTag) "태그 대기 중(태그에 대기)…"
                else if (busy) "처리 중…"
                else "기록 시작"
            )
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
