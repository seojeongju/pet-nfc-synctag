package com.petidconnect.companion

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import com.petidconnect.companion.ui.CompanionAppScreen
import com.petidconnect.companion.ui.PetIdCompanionTheme

class MainActivity : ComponentActivity() {

    private var apiBase by mutableStateOf("")
    private var kind by mutableStateOf("pet")
    private var petId by mutableStateOf("")
    private var mac by mutableStateOf("")
    private var tagId by mutableStateOf("")
    private var sessionOk by mutableStateOf(false)
    private var scanning by mutableStateOf(false)
    private var statusText by mutableStateOf("")
    private var logs by mutableStateOf<List<String>>(emptyList())

    private val loginLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) {
        refreshSession()
        refreshLogs()
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { granted ->
        val ok = granted.values.all { it }
        if (ok) {
            startScanAfterPermission()
        } else {
            statusText = "권한이 거부되었습니다"
            Toast.makeText(this, "블루투스·위치·알림 권한을 허용해 주세요", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        apiBase = CompanionPrefs.apiBase(this).ifBlank { BuildConfig.NATIVE_API_BASE_URL }
        if (CompanionPrefs.apiBase(this).isBlank() && apiBase.isNotBlank()) {
            CompanionPrefs.setApiBase(this, apiBase)
        }
        petId = BuildConfig.COMPANION_DEBUG_PET_ID.trim()
        applyDeepLink(intent?.data)
        refreshSession()
        refreshLogs()

        setContent {
            PetIdCompanionTheme {
                CompanionAppScreen(
                    apiBase = apiBase,
                    onApiBaseChange = {
                        apiBase = it
                        CompanionPrefs.setApiBase(this, it)
                        refreshSession()
                    },
                    kind = kind,
                    petId = petId,
                    onPetIdChange = { petId = it },
                    mac = mac,
                    onMacChange = { mac = it },
                    tagId = tagId,
                    onTagIdChange = { tagId = it },
                    sessionOk = sessionOk,
                    scanning = scanning,
                    statusText = statusText,
                    logs = logs,
                    onLogin = {
                        if (apiBase.isBlank()) {
                            Toast.makeText(this, "API base를 입력하세요", Toast.LENGTH_SHORT).show()
                            return@CompanionAppScreen
                        }
                        CompanionPrefs.setApiBase(this, apiBase)
                        loginLauncher.launch(Intent(this, LoginWebViewActivity::class.java))
                    },
                    onToggleScan = { toggleScan() },
                    onClearLogs = {
                        CompanionPrefs.clearLogs(this)
                        refreshLogs()
                    },
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        applyDeepLink(intent.data)
    }

    override fun onResume() {
        super.onResume()
        refreshSession()
        refreshLogs()
    }

    private fun applyDeepLink(uri: Uri?) {
        val parsed = DeepLinkParser.parse(uri) ?: return
        kind = parsed.kind
        if (parsed.petId.isNotBlank()) petId = parsed.petId
        parsed.mac?.let { mac = it }
        parsed.tagId?.let { tagId = it }
        parsed.appBase?.let {
            apiBase = it.trimEnd('/')
            CompanionPrefs.setApiBase(this, apiBase)
        }
        statusText = "딥링크 · ${parsed.entry}"
    }

    private fun refreshSession() {
        val base = CompanionPrefs.apiBase(this).ifBlank { apiBase }
        sessionOk = BleEventUploader(base).hasSessionCookie()
    }

    private fun refreshLogs() {
        logs = CompanionPrefs.logs(this)
    }

    private fun toggleScan() {
        if (scanning) {
            BleScanForegroundService.stop(this)
            scanning = false
            statusText = "스캔 중지"
            return
        }
        if (petId.isBlank()) {
            Toast.makeText(this, "pet_id가 필요합니다", Toast.LENGTH_SHORT).show()
            return
        }
        if (!sessionOk) {
            Toast.makeText(this, "먼저 웹 로그인해 주세요", Toast.LENGTH_SHORT).show()
            return
        }
        val bt = (getSystemService(BLUETOOTH_SERVICE) as BluetoothManager).adapter
        if (bt == null) {
            Toast.makeText(this, "BLE를 지원하지 않는 기기입니다", Toast.LENGTH_LONG).show()
            return
        }
        if (!bt.isEnabled) {
            startActivity(Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE))
            return
        }
        requestScanPermissionsThenStart()
    }

    private fun requestScanPermissionsThenStart() {
        val need = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= 31) {
            if (!has(Manifest.permission.BLUETOOTH_SCAN)) need += Manifest.permission.BLUETOOTH_SCAN
            if (!has(Manifest.permission.BLUETOOTH_CONNECT)) need += Manifest.permission.BLUETOOTH_CONNECT
        }
        if (!has(Manifest.permission.ACCESS_FINE_LOCATION)) need += Manifest.permission.ACCESS_FINE_LOCATION
        if (Build.VERSION.SDK_INT >= 33 && !has(Manifest.permission.POST_NOTIFICATIONS)) {
            need += Manifest.permission.POST_NOTIFICATIONS
        }
        if (need.isEmpty()) {
            startScanAfterPermission()
        } else {
            permissionLauncher.launch(need.toTypedArray())
        }
    }

    private fun startScanAfterPermission() {
        val normalized = DeepLinkParser.normalizeMac(mac)
        if (mac.isNotBlank() && normalized == null) {
            Toast.makeText(this, "MAC 형식이 올바르지 않습니다", Toast.LENGTH_SHORT).show()
            return
        }
        if (normalized != null) mac = normalized
        CompanionPrefs.setApiBase(this, apiBase)
        BleScanForegroundService.start(
            this,
            petId = petId.trim(),
            mac = normalized,
            tagId = tagId.trim().takeIf { it.isNotEmpty() },
        )
        scanning = true
        statusText = if (normalized != null) "스캔 중 · $normalized" else "스캔 중"
    }

    private fun has(permission: String): Boolean =
        ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
}
