package com.petidconnect.nfcwriter

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.Uri
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.nfc.NfcManager
import android.nfc.Tag
import android.nfc.tech.Ndef
import android.nfc.tech.NdefFormatable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.petidconnect.nfcwriter.ui.NfcOffDialogKind
import com.petidconnect.nfcwriter.ui.NfcUserBannerState
import com.petidconnect.nfcwriter.ui.PetIdNfcTheme
import com.petidconnect.nfcwriter.ui.WriterAppScreen
import com.petidconnect.nfcwriter.ui.WriterNfcUiProps
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
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
    private var statusText by mutableStateOf("")
    private var draftUid by mutableStateOf("")
    private var draftUrl by mutableStateOf("")
    private var draftHandoff by mutableStateOf("")
    /** 기록 시작 후 태그 쓰기에 사용하는 스냅샷 */
    private var pendingWrite: WritePayload? = null
    private var awaitingTag by mutableStateOf(false)
    /** 태그 대기 오버레이만 자동 해제(10초). 쓰기 진행 중이면 건드리지 않음. */
    private var awaitingTagDismissJob: Job? = null
    private var busy by mutableStateOf(false)
    /** NDEF 쓰기(태그 기록) 성공 직후 Primary 버튼에 완료 문구 표시 */
    private var tagWriteSuccess by mutableStateOf(false)

    private lateinit var serverSettings: NfcServerSettings
    private var showServerFields by mutableStateOf(false)
    private var serverBaseInput by mutableStateOf("")
    private var serverKeyInput by mutableStateOf("")
    private var profileSiteInput by mutableStateOf("")
    private var toolsTemplate by mutableStateOf("url")
    private var wifiSsid by mutableStateOf("")
    private var wifiPassword by mutableStateOf("")
    private var wifiSecurity by mutableStateOf("WPA")
    private var bluetoothMac by mutableStateOf("")
    private var readOnlyMode by mutableStateOf(false)
    private var nfcOffDialogKind by mutableStateOf(NfcOffDialogKind.Hidden)
    /**
     * 태그 대기 중에 NFC 꺼짐 → 켬 후 자동으로 다시 "태그에 대기"로 복귀
     * [onDismissNfcOffDialog] 시 false
     */
    private var resumeAwaitAfterNfcOn by mutableStateOf(false)
    private var nfcStateReceiverRegistered = false
    private var nfcUserBanner by mutableStateOf(NfcUserBannerState.On)
    /**
     * 태그 쓰기 성공 후 "일반 도구"로 돌아올 때 [WriterAppScreen]의 remember(템플릿 시트 등)를
     * 초기화해 **도구 격자 대시보드**에 남도록 함.
     */
    private var toolsScreenContentKey by mutableStateOf(0)
    /**
     * true면 `ACTION_ADAPTER_STATE_CHANGED`로 NFC 켜짐/꺼짐을 실시간 반영.
     * 일부 기기에서 수신기 등록/콜백만으로 런처 직후 크래시가 나는 사례가 있어 **기본은 false** (배너는 onResume·포커스로 갱신).
     */
    private val registerNfcAdapterStateBroadcast: Boolean = false
    private val nfcStateReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action != NfcAdapter.ACTION_ADAPTER_STATE_CHANGED) return
            val state = intent.getIntExtra(
                NfcAdapter.EXTRA_ADAPTER_STATE,
                NfcAdapter.STATE_OFF
            )
            runOnUiThread {
                if (isFinishing || isDestroyed) return@runOnUiThread
                runCatching {
                    when (state) {
                        NfcAdapter.STATE_ON -> onNfcAdapterBecameEnabled()
                        NfcAdapter.STATE_OFF -> onNfcAdapterBecameDisabled()
                        else -> {}
                    }
                    syncNfcUserBanner()
                }.onFailure { e -> Log.w(TAG, "NFC state broadcast 처리 실패", e) }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        serverSettings = NfcServerSettings(this)
        // onCreate에서 NfcAdapter·packageManager Nfc 터치는 기기에 따라 런처 직후 예외로 이어질 수 있어
        // 첫 sync는 onResume에서 수행
        loadServerFieldsFromPrefs()
        handleIntent(intent)
        runCatching { enableEdgeToEdge() }.onFailure { e ->
            Log.w(TAG, "enableEdgeToEdge 생략", e)
        }

        setContent {
            PetIdNfcTheme {
                key(toolsScreenContentKey) {
                WriterAppScreen(
                    appMode = appMode.name,
                    entryFromDeepLink = entryFromDeepLink,
                    onLandingOpenNfcSettings = {
                        startActivity(Intent(Settings.ACTION_NFC_SETTINGS))
                    },
                    onSelectTools = {
                        appMode = AppMode.Tools
                        // 랜딩에서 일반 쓰기: Link-U 자동 연동값을 끌고 가지 않도록 새로 시작
                        draftUid = ""
                        draftUrl = ""
                        draftHandoff = ""
                        pendingWrite = null
                        awaitingTag = false
                        busy = false
                        tagWriteSuccess = false
                        clearNfcOffDialogState()
                        statusText = ""
                    },
                    onBackToLanding = {
                        if (entryFromDeepLink) {
                            statusText = "웹에서 열었어요. 이어서 기록을 진행해 주세요."
                        } else {
                            appMode = AppMode.Landing
                            awaitingTag = false
                            busy = false
                            pendingWrite = null
                            tagWriteSuccess = false
                            clearNfcOffDialogState()
                            statusText = "NFC 켜기(설정) 또는 [NFC 쓰기]로 쓰기를 시작해 주세요."
                        }
                    },
                    onApplyToolTemplate = { applyToolsTemplate(it) },
                    toolsTemplate = toolsTemplate,
                    wifiSsid = wifiSsid,
                    wifiPassword = wifiPassword,
                    wifiSecurity = wifiSecurity,
                    bluetoothMac = bluetoothMac,
                    readOnlyMode = readOnlyMode,
                    onWifiSsid = {
                        wifiSsid = it
                        if (appMode == AppMode.Tools && toolsTemplate == "wifi") {
                            draftUrl = buildWifiPayload(wifiSsid, wifiPassword, wifiSecurity)
                        }
                    },
                    onWifiPassword = {
                        wifiPassword = it
                        if (appMode == AppMode.Tools && toolsTemplate == "wifi") {
                            draftUrl = buildWifiPayload(wifiSsid, wifiPassword, wifiSecurity)
                        }
                    },
                    onWifiSecurity = {
                        wifiSecurity = it
                        if (appMode == AppMode.Tools && toolsTemplate == "wifi") {
                            draftUrl = buildWifiPayload(wifiSsid, wifiPassword, wifiSecurity)
                        }
                    },
                    onBluetoothMac = {
                        bluetoothMac = it.uppercase(Locale.US)
                        if (appMode == AppMode.Tools && toolsTemplate == "bluetooth") {
                            draftUrl = buildBluetoothPayload(bluetoothMac)
                        }
                    },
                    onToggleReadOnly = {
                        readOnlyMode = it
                        if (it) {
                            pendingWrite = null
                            awaitingTag = false
                            tagWriteSuccess = false
                            clearNfcOffDialogState()
                            statusText = "읽기 전용 모드예요. 태그를 대면 읽기만 하고 쓰기는 하지 않습니다."
                        } else {
                            statusText = "읽기/쓰기 모드로 전환했어요. 입력값을 확인한 뒤 [태그에 쓰기]를 눌러 주세요."
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
                    nfcUi = WriterNfcUiProps(
                        nfcUserBanner = nfcUserBanner,
                        tagWriteSuccess = tagWriteSuccess,
                        onTagWriteSuccessGoToModeSelection = {
                            tagWriteSuccess = false
                            // 랜딩이 아니라 "일반 NFC 도구 모드" 대시보드(도구 격자)로 복귀
                            appMode = AppMode.Tools
                            entryFromDeepLink = false
                            draftUid = ""
                            draftUrl = ""
                            draftHandoff = ""
                            pendingWrite = null
                            awaitingTag = false
                            busy = false
                            clearNfcOffDialogState()
                            statusText = ""
                            // 템플릿 시트(모바일 웹 링크 등) remember 상태를 버리고 격자로 돌아가게 함
                            toolsScreenContentKey++
                        },
                        nfcOffDialogKind = nfcOffDialogKind,
                        onDismissNfcOffDialog = { clearNfcOffDialogState() },
                        onOpenNfcSettingsFromDialog = {
                            nfcOffDialogKind = NfcOffDialogKind.Hidden
                            startActivity(Intent(Settings.ACTION_NFC_SETTINGS))
                        },
                        onOpenNfcSettings = {
                            startActivity(Intent(Settings.ACTION_NFC_SETTINGS))
                        }
                    ),
                    onPrepareWrite = { overridePurl -> onUserStartWrite(overridePurl) },
                )
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()
        if (registerNfcAdapterStateBroadcast) {
            // 첫 레이아웃 이후에 수신기 등록 (Activity context 대신 applicationContext)
            Handler(Looper.getMainLooper()).post {
                if (!isFinishing && !isDestroyed) {
                    registerNfcStateReceiverIfNeeded()
                }
            }
        }
    }

    override fun onDestroy() {
        awaitingTagDismissJob?.cancel()
        awaitingTagDismissJob = null
        if (nfcStateReceiverRegistered) {
            try {
                applicationContext.unregisterReceiver(nfcStateReceiver)
            } catch (_: Exception) {
            }
            nfcStateReceiverRegistered = false
        }
        super.onDestroy()
    }

    /** [NfcAdapter.isEnabled]는 시스템이 반영한 값을 쓰도록 [NfcManager] / [getDefaultAdapter]로 조회. */
    private fun currentNfcAdapterForState(): NfcAdapter? {
        return runCatching {
            (getSystemService(Context.NFC_SERVICE) as? NfcManager)?.defaultAdapter
                ?: NfcAdapter.getDefaultAdapter(this)
        }.getOrElse { e ->
            Log.w(TAG, "NFC adapter 조회 실패", e)
            null
        }
    }

    private fun syncNfcUserBanner() {
        runCatching {
            val adapter = currentNfcAdapterForState()
            nfcUserBanner = when {
                !packageManager.hasSystemFeature(PackageManager.FEATURE_NFC) -> NfcUserBannerState.Unsupported
                adapter == null -> NfcUserBannerState.Unsupported
                !adapter.isEnabled -> NfcUserBannerState.TurnedOff
                else -> NfcUserBannerState.On
            }
        }.onFailure { e ->
            Log.w(TAG, "NFC 배너 상태 갱신 실패", e)
            nfcUserBanner = NfcUserBannerState.Unsupported
        }
    }

    private fun registerNfcStateReceiverIfNeeded() {
        if (!registerNfcAdapterStateBroadcast) return
        if (nfcStateReceiverRegistered) return
        val filter = IntentFilter(NfcAdapter.ACTION_ADAPTER_STATE_CHANGED)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                applicationContext.registerReceiver(
                    nfcStateReceiver,
                    filter,
                    Context.RECEIVER_NOT_EXPORTED
                )
            } else {
                @Suppress("DEPRECATION")
                applicationContext.registerReceiver(nfcStateReceiver, filter)
            }
            nfcStateReceiverRegistered = true
        } catch (e: Exception) {
            Log.w(TAG, "NFC state receiver 등록 실패(배너는 onResume·포커스로 동기화됩니다)", e)
        }
    }

    private fun onNfcAdapterBecameEnabled() {
        nfcOffDialogKind = NfcOffDialogKind.Hidden
        if (
            resumeAwaitAfterNfcOn && !busy && pendingWrite != null && !awaitingTag
        ) {
            awaitingTag = true
            scheduleAwaitingTagAutoDismiss()
            statusText = "휴대폰 뒤에 태그를 가깝게 대 주세요."
        }
        resumeAwaitAfterNfcOn = false
    }

    private fun onNfcAdapterBecameDisabled() {
        if (!awaitingTag || busy) return
        onTagWaitBlockedByNfcOff()
    }

    private fun onTagWaitBlockedByNfcOff() {
        awaitingTagDismissJob?.cancel()
        awaitingTag = false
        resumeAwaitAfterNfcOn = pendingWrite != null
        nfcOffDialogKind = NfcOffDialogKind.NfcOffWhileAwaitingTag
        statusText = "NFC(태그 쓰기)가 꺼졌어요. 팝업에서 [NFC 설정 열기]로 켤 수 있어요."
    }

    private fun clearNfcOffDialogState() {
        nfcOffDialogKind = NfcOffDialogKind.Hidden
        resumeAwaitAfterNfcOn = false
    }

    private fun scheduleAwaitingTagAutoDismiss() {
        awaitingTagDismissJob?.cancel()
        awaitingTagDismissJob = CoroutineScope(Dispatchers.Main).launch {
            delay(10_000L)
            if (awaitingTag && !busy) {
                awaitingTag = false
                pendingWrite = null
                statusText = "태그를 대지 않아 대기를 마쳤어요. 쓰려면 다시 [태그에 쓰기]를 눌러 주세요."
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

    private fun onUserStartWrite(overridePurl: String? = null) {
        if (busy) return
        if (!packageManager.hasSystemFeature(PackageManager.FEATURE_NFC)) {
            nfcOffDialogKind = NfcOffDialogKind.NoHardware
            statusText =
                "이 휴대폰은 NFC가 없어 태그 쓰기를 할 수 없어요. NFC가 있는 기기에서 이용해 주세요."
            return
        }
        val nfc = currentNfcAdapterForState()
        if (nfc == null) {
            nfcOffDialogKind = NfcOffDialogKind.NoHardware
            statusText =
                "NFC를 쓸 수 없어요. 태그 쓰기는 NFC가 켜진 휴대폰에서만 가능해요. 휴대폰을 다시 시작한 뒤 다시 시도해 주세요."
            return
        }
        if (!nfc.isEnabled) {
            nfcOffDialogKind = NfcOffDialogKind.NfcOffWhenTappingWrite
            resumeAwaitAfterNfcOn = false
            statusText = "NFC(태그 쓰기)를 켜 주세요. 팝업에서 [NFC 설정 열기]로 휴대폰 NFC 설정에 갈 수 있어요."
            return
        }
        if (appMode == AppMode.Tools && readOnlyMode) {
            statusText = "읽기 전용 모드에서는 태그를 읽기만 합니다. 쓰려면 읽기 전용을 꺼 주세요."
            return
        }
        val u = draftUid.trim()
        val purl = (overridePurl?.trim()?.takeIf { it.isNotEmpty() } ?: draftUrl).trim()
        val tok = draftHandoff.trim()
        // handoff(한번 쓰기)가 있으면 Link-U 서버 기록·웹과 합의된 세 값이 모두 있어야 함. 없으면 URL만으로 일반 쓰기
        val requireHandoff = tok.isNotEmpty()
        val missingRequired = if (requireHandoff) {
            u.isEmpty() || purl.isEmpty() || tok.isEmpty()
        } else {
            purl.isEmpty()
        }
        if (missingRequired) {
            statusText = if (requireHandoff) {
                "웹에서 보낸 ‘한번 쓰기(인증)’를 쓰는 중이에요. 태그·ID, 링크, 인증을 모두 채운 뒤 다시 시도해 주세요. 웹 ‘앱으로 기록’이면 대부분 자동으로 들어갑니다."
            } else {
                "URL/정보를 먼저 채워 주세요. 위에서 도구를 고르거나, 아래 ‘보호자 연동’에서 붙여 넣을 수 있어요."
            }
            return
        }
        if (appMode == AppMode.Tools && toolsTemplate == "bluetooth" && purl.startsWith("BT:", ignoreCase = true)) {
            val mac = bluetoothMac.trim()
            if (!isValidMacAddress(mac)) {
                statusText = "블루투스 MAC 형식이 올바르지 않아요. 예: AA:BB:CC:DD:EE:FF"
                return
            }
        }
        tagWriteSuccess = false
        val effectiveUid = if (u.isBlank()) "TOOLS-MANUAL" else u
        pendingWrite = WritePayload(uid = effectiveUid, url = purl, handoffToken = tok)
        awaitingTag = true
        scheduleAwaitingTagAutoDismiss()
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
        syncNfcUserBanner()
        try {
            val live = currentNfcAdapterForState() ?: return
            if (live.isEnabled) {
                onNfcAdapterBecameEnabled()
            } else {
                var didBlockAwaiting = false
                if (awaitingTag && !busy) {
                    onTagWaitBlockedByNfcOff()
                    didBlockAwaiting = true
                }
                if (!didBlockAwaiting) {
                    statusText =
                        "휴대폰의 NFC(태그 쓰기/읽기)가 꺼져 있어요. 켜지 않으면 앱에서 태그에 쓸 수 없어요. " +
                            "아래 [NFC 켜기(휴대폰 설정)]으로 설정을 열 수 있어요."
                }
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
            try {
                live.enableForegroundDispatch(this, pendingIntent, null, null)
            } catch (e: Exception) {
                Log.w(TAG, "enableForegroundDispatch 실패(태그/배너는 계속 사용 가능)", e)
            }
        } finally {
            // 복귀 직후 isEnabled 반영이 한 프레임 늦는 기기/설정 화면 복귀에 대비(지연 1회만, 예외는 sync 내부에서 삼킴)
            val v = window?.decorView
            v?.post { syncNfcUserBanner() }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            syncNfcUserBanner()
        }
    }

    override fun onPause() {
        super.onPause()
        try {
            currentNfcAdapterForState()?.disableForegroundDispatch(this)
        } catch (e: Exception) {
            Log.w(TAG, "disableForegroundDispatch 실패", e)
        }
    }

    private fun handleIntent(intent: Intent?) {
        // 런처에서 일반 실행 시(딥링크 아님) 이전 Link-U 상태가 남지 않도록 랜딩으로 복귀
        if (intent?.action == Intent.ACTION_MAIN && intent.data == null) {
            entryFromDeepLink = false
            if (!busy && !awaitingTag) {
                appMode = AppMode.Landing
                statusText = "NFC 켜기(설정) 또는 [NFC 쓰기]로 쓰기를 시작해 주세요."
            }
            return
        }

        val data = intent?.data ?: return
        if (data.scheme != "petidconnect" || data.host != "nfc") {
            return
        }
        val path = data.path.orEmpty()
        when {
            path == "/write" || path.startsWith("/write/") -> applyNfcWriteDeepLink(data)
            path == "/pet" || path.startsWith("/pet/") -> openPetDashboardFromDeepLink(data)
            else -> { }
        }
    }

    /**
     * [petidconnect://nfc/write?uid=&url=&handoffToken=]
     * 세 쿼리가 **모두 비어 있지 않을 때만** 필드를 덮어쓴다. 하나라도 비면 상태는 유지하고 안내만 한다.
     */
    private fun applyNfcWriteDeepLink(data: Uri) {
        val uid = data.getQueryParameter("uid")?.trim().orEmpty()
        val profileUrl = data.getQueryParameter("url")?.trim().orEmpty()
        val handoffToken = data.getQueryParameter("handoffToken")?.trim().orEmpty()

        if (uid.isBlank() || profileUrl.isBlank() || handoffToken.isBlank()) {
            statusText = "자동으로 못 가져왔어요. 웹에서 다시 열어 주시거나 아래에 직접 넣어 주세요. (딥링크에 uid·url·handoffToken이 모두 있어야 덮어씁니다)"
            return
        }

        draftUid = uid
        draftUrl = profileUrl
        draftHandoff = handoffToken
        appMode = AppMode.Tools
        toolsTemplate = "linku"
        entryFromDeepLink = true
        pendingWrite = null
        awaitingTag = false
        tagWriteSuccess = false
        statusText = "웹에서 불러왔어요. [태그에 쓰기]를 누른 뒤, 휴대폰 뒤에 태그를 대 주세요."
    }

    /** [BuildConfig]·저장된 API/프로필 주소 → 웹 루트(대시보드 URL용) */
    private fun siteOriginForDashboard(): String {
        val fromInput = profileSiteInput.trim().trimEnd('/')
        if (fromInput.isNotEmpty()) return fromInput
        val fromPrefs = serverSettings.getApiBaseOrEmpty()
        if (fromPrefs.isNotEmpty()) return fromPrefs
        return BuildConfig.NATIVE_API_BASE_URL.trim().trimEnd('/')
    }

    /**
     * [petidconnect://nfc/pet?kind=dog&pet_id=...&tenant=...]
     * 기기 브라우저에서 `…/dashboard/{kind}/pets/{id}?tenant#nfc` 를 연다(관리·태그 UI는 웹).
     */
    private fun openPetDashboardFromDeepLink(data: Uri) {
        val kind = data.getQueryParameter("kind")?.trim().orEmpty()
        val petId = data.getQueryParameter("pet_id")?.trim().orEmpty()
        val tenant = data.getQueryParameter("tenant")?.trim()?.takeIf { it.isNotEmpty() }
        if (kind.isBlank() || petId.isBlank()) {
            statusText = "반려 상세(웹)를 열려면 kind·pet_id 쿼리가 필요해요. 예: …/nfc/pet?kind=dog&pet_id=…"
            return
        }
        val origin = siteOriginForDashboard()
        if (origin.isEmpty()) {
            statusText = "웹 주소(Link-U 서비스/프로필 사이트)를 [Link-U 서비스에 기록]에 넣은 뒤 다시 시도해 주세요."
            return
        }
        val tenantQs = if (tenant != null) {
            "?tenant=" + URLEncoder.encode(tenant, Charsets.UTF_8.name())
        } else {
            ""
        }
        val url = "$origin/dashboard/$kind/pets/$petId$tenantQs#nfc"
        val view = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        if (view.resolveActivity(packageManager) == null) {
            statusText = "이 링크를 열 앱(브라우저)이 없어요."
            return
        }
        startActivity(view)
        statusText = "브라우저에서 이 반려의 NFC 태그 섹션을 열었어요. 앱으로 돌아올 수 있어요."
    }

    private fun applyToolsTemplate(template: String) {
        if (appMode != AppMode.Tools || busy) return
        tagWriteSuccess = false
        toolsTemplate = template
        when (template) {
            "url" -> {
                draftUrl = "https://"
                statusText = "웹 링크 템플릿을 불러왔어요. 주소를 완성한 뒤 [태그에 쓰기]를 눌러 주세요."
            }
            "phone" -> {
                draftUrl = "tel:010"
                statusText = "전화번호 템플릿(tel:)을 불러왔어요. 번호를 이어서 입력해 주세요."
            }
            "sms" -> {
                draftUrl = "sms:010"
                statusText = "문자 템플릿(sms:)을 불러왔어요. 번호를 이어서 입력해 주세요."
            }
            "video" -> {
                draftUrl = "https://www.youtube.com/watch?v="
                statusText = "영상 공유 템플릿을 불러왔어요. YouTube 등 영상 URL을 입력해 주세요."
            }
            // 과거 키와의 호환(기존 설치본 상태 복원 대비)
            "mail" -> {
                draftUrl = "https://www.youtube.com/watch?v="
                statusText = "영상 공유 템플릿을 불러왔어요. YouTube 등 영상 URL을 입력해 주세요."
            }
            "wifi" -> {
                draftUrl = buildWifiPayload(wifiSsid, wifiPassword, wifiSecurity)
                statusText = "Wi-Fi 템플릿을 불러왔어요. S(이름), P(비밀번호)를 채운 뒤 [태그에 쓰기]를 눌러 주세요."
            }
            "bluetooth" -> {
                if (bluetoothMac.isBlank()) {
                    bluetoothMac = "AA:BB:CC:DD:EE:FF"
                }
                draftUrl = buildBluetoothPayload(bluetoothMac)
                statusText = "블루투스 템플릿을 불러왔어요. MAC 주소를 채운 뒤 [태그에 쓰기]를 눌러 주세요."
            }
            "linku" -> {
                // 도구 격자에서만 ‘연동’을 택한 경우 — 별도 안내 없이 아래 폼·상태로 충분
                statusText = ""
            }
        }
    }

    private fun buildWifiPayload(ssid: String, password: String, security: String): String {
        val sec = security.trim().ifEmpty { "WPA" }
        return "WIFI:T:$sec;S:${ssid.trim()};P:${password.trim()};;"
    }

    private fun buildBluetoothPayload(mac: String): String {
        return "BT:MAC:${mac.trim()};"
    }

    private fun onTagDetected(tag: Tag) {
        val current = pendingWrite
        if (!awaitingTag || busy || current == null) {
            // 일반 모드에서는 "태그를 대면 UID(및 가능하면 링크)를 미리 채우는" 읽기 동작 제공
            if (appMode == AppMode.Tools && !busy) {
                val detectedUid = tag.id?.toHexUid()
                if (!detectedUid.isNullOrBlank()) {
                    draftUid = detectedUid
                }
                if (draftUrl.isBlank()) {
                    readFirstNdefTextOrUri(tag)?.let { found ->
                        draftUrl = found
                    }
                }
                statusText = if (draftUrl.isNotBlank()) {
                    "태그를 읽어 ID와 링크를 채웠어요. 필요하면 수정 후 [태그에 쓰기]를 눌러 주세요."
                } else {
                    "태그 ID를 읽었어요. 링크/정보를 입력한 뒤 [태그에 쓰기]를 눌러 주세요."
                }
            }
            return
        }

        busy = true
        statusText = "태그에 쓰는 중…"

        CoroutineScope(Dispatchers.IO).launch {
            val writeResult = writeNdefUrl(tag, current.url)
            val report = if (current.handoffToken.isNotBlank()) {
                postNativeWriteResult(
                    payload = current,
                    success = writeResult.isSuccess,
                    clientError = writeResult.exceptionOrNull()?.message
                )
            } else {
                ServerReport.SkippedNoConfig("한번 쓰기(인증)가 없는 기록이에요. 서버에 ‘쓰기 완료’를 남기지 않았어요.")
            }

            launch(Dispatchers.Main) {
                busy = false
                awaitingTag = false
                pendingWrite = null

                if (writeResult.isSuccess) {
                    tagWriteSuccess = true
                    statusText = when (report) {
                        is ServerReport.Ok -> "태그에 담았고, 서비스에도 기록됐어요. 감사합니다."
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
            val record = createBestEffortRecord(profileUrl)
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

    private fun createBestEffortRecord(rawInput: String): NdefRecord {
        val input = rawInput.trim()
        val shouldWriteTextRecord =
            input.startsWith("WIFI:", ignoreCase = true) ||
            input.startsWith("BT:", ignoreCase = true) ||
            input.startsWith("MECARD:", ignoreCase = true) ||
            input.startsWith("BEGIN:VCARD", ignoreCase = true)

        return if (shouldWriteTextRecord) {
            NdefRecord.createTextRecord("en", input)
        } else {
            NdefRecord.createUri(input)
        }
    }

    private fun readFirstNdefTextOrUri(tag: Tag): String? {
        val ndef = Ndef.get(tag) ?: return null
        return runCatching {
            ndef.connect()
            try {
                val msg = ndef.cachedNdefMessage ?: return@runCatching null
                msg.records.firstNotNullOfOrNull { rec ->
                    rec.toUri()?.toString() ?: rec.toTextRecordOrNull()
                }
            } finally {
                runCatching { ndef.close() }
            }
        }.getOrNull()
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
                put("platform", "android")
                put("mode", if (payload.handoffToken.isNotBlank()) "linku" else "tools")
                put("appVersion", BuildConfig.VERSION_NAME.ifBlank { "unknown" })
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

    private companion object {
        const val TAG = "PetIdNfcWriter"
    }
}

private fun ByteArray.toHexUid(): String =
    joinToString(":") { b -> String.format(Locale.US, "%02X", b) }

private fun isValidMacAddress(value: String): Boolean {
    val v = value.trim()
    return Regex("^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$").matches(v)
}

private fun NdefRecord.toTextRecordOrNull(): String? {
    if (tnf != NdefRecord.TNF_WELL_KNOWN) return null
    if (!type.contentEquals(NdefRecord.RTD_TEXT)) return null
    val p = payload
    if (p.isEmpty()) return null
    val status = p[0].toInt()
    val langLen = status and 0x3F
    if (p.size <= 1 + langLen) return null
    val textBytes = p.copyOfRange(1 + langLen, p.size)
    return textBytes.toString(Charsets.UTF_8)
}
