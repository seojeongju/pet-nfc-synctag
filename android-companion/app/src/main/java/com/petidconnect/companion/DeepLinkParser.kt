package com.petidconnect.companion

import android.net.Uri
import java.util.Locale

/**
 * `petidconnect://ble/scan?...` — docs/BLE_APP_DEEPLINK_SPEC.md
 */
data class BleScanDeepLink(
    val kind: String,
    val petId: String,
    val tenantId: String?,
    val entry: String,
    val appBase: String?,
    val mac: String?,
    val tagId: String?,
)

object DeepLinkParser {
    fun parse(uri: Uri?): BleScanDeepLink? {
        if (uri == null) return null
        if (uri.scheme != "petidconnect") return null
        if (uri.host != "ble") return null
        val path = uri.path.orEmpty()
        if (path != "/scan" && !path.startsWith("/scan")) return null

        val kind = uri.getQueryParameter("kind")?.trim().orEmpty().ifEmpty { "pet" }
        val petId = uri.getQueryParameter("pet_id")?.trim().orEmpty()
        val macRaw = uri.getQueryParameter("mac")?.trim().orEmpty()
        val mac = normalizeMac(macRaw)
        return BleScanDeepLink(
            kind = kind,
            petId = petId,
            tenantId = uri.getQueryParameter("tenant")?.trim()?.takeIf { it.isNotEmpty() },
            entry = uri.getQueryParameter("entry")?.trim().orEmpty().ifEmpty { "dashboard_ble_companion" },
            appBase = uri.getQueryParameter("app_base")?.trim()?.takeIf { it.isNotEmpty() },
            mac = mac,
            tagId = uri.getQueryParameter("tag_id")?.trim()?.takeIf { it.isNotEmpty() },
        )
    }

    /** AA:BB:CC:DD:EE:FF uppercase, or null if invalid. */
    fun normalizeMac(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        val hex = raw.replace(Regex("[^0-9A-Fa-f]"), "").uppercase(Locale.US)
        if (hex.length != 12) return null
        return hex.chunked(2).joinToString(":")
    }
}
