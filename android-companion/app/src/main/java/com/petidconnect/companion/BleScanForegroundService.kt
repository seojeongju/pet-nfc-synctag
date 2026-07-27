package com.petidconnect.companion

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.bluetooth.BluetoothManager
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import java.util.Locale
import java.util.concurrent.Executors

/**
 * 포그라운드 BLE 스캔 + RSSI 히스테리시스 → ble_scan / ble_lost.
 * 기본값: 근접 ≥ -75 (2회), 이탈 30초 미검출 또는 RSSI &lt; -90.
 */
class BleScanForegroundService : Service() {

    private val mainHandler = Handler(Looper.getMainLooper())
    private val uploadExecutor = Executors.newSingleThreadExecutor()
    private var scanner: BluetoothLeScanner? = null
    private var uploader: BleEventUploader? = null

    private var petId: String = ""
    private var targetMac: String? = null
    private var tagId: String? = null

    private var nearHits = 0
    private var lastSeenElapsed = 0L
    private var inProximity = false
    private var lastRssi: Int? = null

    private val lostCheck = object : Runnable {
        override fun run() {
            if (petId.isBlank()) return
            val elapsed = android.os.SystemClock.elapsedRealtime()
            if (inProximity && elapsed - lastSeenElapsed >= LOST_MS) {
                inProximity = false
                nearHits = 0
                emit("ble_lost", lastRssi)
                updateNotification("이탈 — 재탐색 중")
            }
            mainHandler.postDelayed(this, 5_000L)
        }
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult?) {
            if (result == null) return
            val addr = DeepLinkParser.normalizeMac(result.device?.address) ?: return
            val filter = targetMac
            if (filter != null && !addr.equals(filter, ignoreCase = true)) return

            val rssi = result.rssi
            lastRssi = rssi
            lastSeenElapsed = android.os.SystemClock.elapsedRealtime()

            if (rssi < LOST_RSSI) {
                if (inProximity) {
                    inProximity = false
                    nearHits = 0
                    emit("ble_lost", rssi)
                    updateNotification("약신호 — 이탈")
                }
                return
            }

            if (rssi >= NEAR_RSSI) {
                nearHits += 1
                if (!inProximity && nearHits >= NEAR_HITS) {
                    inProximity = true
                    emit("ble_scan", rssi)
                    updateNotification("근처 감지 ($rssi dBm)")
                } else if (inProximity && nearHits % 8 == 0) {
                    // periodic heartbeat while near
                    emit("ble_scan", rssi)
                }
            } else {
                nearHits = 0
            }
        }

        override fun onScanFailed(errorCode: Int) {
            Log.w(TAG, "scan failed: $errorCode")
            updateNotification("스캔 실패 ($errorCode)")
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        ensureChannel()
        val base = CompanionPrefs.apiBase(this).ifBlank { BuildConfig.NATIVE_API_BASE_URL }
        uploader = BleEventUploader(base)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopScanInternal()
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                petId = intent?.getStringExtra(EXTRA_PET_ID).orEmpty()
                targetMac = DeepLinkParser.normalizeMac(intent?.getStringExtra(EXTRA_MAC))
                tagId = intent?.getStringExtra(EXTRA_TAG_ID)?.trim()?.takeIf { it.isNotEmpty() }
                if (petId.isBlank()) {
                    stopSelf()
                    return START_NOT_STICKY
                }
                startAsForeground()
                startScanInternal()
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        mainHandler.removeCallbacks(lostCheck)
        stopScanInternal()
        uploadExecutor.shutdownNow()
        super.onDestroy()
    }

    private fun startAsForeground() {
        val notif = buildNotification(getString(R.string.scan_notification_text))
        if (Build.VERSION.SDK_INT >= 29) {
            ServiceCompat.startForeground(
                this,
                NOTIF_ID,
                notif,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE,
            )
        } else {
            startForeground(NOTIF_ID, notif)
        }
    }

    private fun startScanInternal() {
        val bt = (getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
        if (bt == null || !bt.isEnabled) {
            updateNotification("블루투스를 켜 주세요")
            return
        }
        scanner = bt.bluetoothLeScanner
        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()
        val filters = mutableListOf<ScanFilter>()
        targetMac?.let { mac ->
            try {
                filters.add(
                    ScanFilter.Builder()
                        .setDeviceAddress(mac.uppercase(Locale.US))
                        .build()
                )
            } catch (e: IllegalArgumentException) {
                Log.w(TAG, "invalid MAC filter: $mac", e)
            }
        }
        try {
            if (filters.isEmpty()) {
                scanner?.startScan(scanCallback)
            } else {
                scanner?.startScan(filters, settings, scanCallback)
            }
            lastSeenElapsed = android.os.SystemClock.elapsedRealtime()
            mainHandler.removeCallbacks(lostCheck)
            mainHandler.postDelayed(lostCheck, 5_000L)
            updateNotification(
                if (targetMac != null) "스캔 중 · $targetMac" else "스캔 중 (전체)"
            )
        } catch (e: SecurityException) {
            Log.e(TAG, "permission", e)
            updateNotification("블루투스 권한 필요")
        }
    }

    private fun stopScanInternal() {
        try {
            scanner?.stopScan(scanCallback)
        } catch (_: Exception) {
        }
        scanner = null
        inProximity = false
        nearHits = 0
    }

    private fun emit(eventType: String, rssi: Int?) {
        val p = petId
        if (p.isBlank()) return
        val u = uploader ?: return
        val mac = targetMac
        val tid = tagId
        uploadExecutor.execute {
            val result = u.postEvent(
                petId = p,
                eventType = eventType,
                rssi = rssi,
                latitude = null,
                longitude = null,
                tagId = tid,
                mac = mac,
            )
            Log.i(TAG, "$eventType → ${result.httpCode} ${result.message}")
            CompanionPrefs.appendLog(
                this,
                "${eventType} rssi=$rssi → ${if (result.ok) "OK" else result.message}",
            )
            if (result.httpCode == 401) {
                mainHandler.post { updateNotification("로그인 필요 (401)") }
            }
        }
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT < 26) return
        val mgr = getSystemService(NotificationManager::class.java) ?: return
        val ch = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.scan_channel_name),
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = getString(R.string.scan_channel_desc)
        }
        mgr.createNotificationChannel(ch)
    }

    private fun updateNotification(text: String) {
        val mgr = getSystemService(NotificationManager::class.java) ?: return
        mgr.notify(NOTIF_ID, buildNotification(text))
    }

    private fun buildNotification(text: String): Notification {
        val open = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val stop = PendingIntent.getService(
            this,
            1,
            Intent(this, BleScanForegroundService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setContentTitle(getString(R.string.scan_notification_title))
            .setContentText(text)
            .setContentIntent(open)
            .setOngoing(true)
            .addAction(0, "중지", stop)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    companion object {
        private const val TAG = "BleScanFgs"
        private const val CHANNEL_ID = "ble_companion_scan"
        private const val NOTIF_ID = 42
        const val ACTION_STOP = "com.petidconnect.companion.STOP_SCAN"
        const val EXTRA_PET_ID = "pet_id"
        const val EXTRA_MAC = "mac"
        const val EXTRA_TAG_ID = "tag_id"

        const val NEAR_RSSI = -75
        const val LOST_RSSI = -90
        const val NEAR_HITS = 2
        const val LOST_MS = 30_000L

        fun start(context: Context, petId: String, mac: String?, tagId: String?) {
            val i = Intent(context, BleScanForegroundService::class.java).apply {
                putExtra(EXTRA_PET_ID, petId)
                putExtra(EXTRA_MAC, mac)
                putExtra(EXTRA_TAG_ID, tagId)
            }
            if (Build.VERSION.SDK_INT >= 26) {
                context.startForegroundService(i)
            } else {
                context.startService(i)
            }
        }

        fun stop(context: Context) {
            context.startService(
                Intent(context, BleScanForegroundService::class.java).setAction(ACTION_STOP)
            )
        }
    }
}
