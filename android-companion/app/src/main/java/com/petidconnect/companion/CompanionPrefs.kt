package com.petidconnect.companion

import android.content.Context
import android.content.SharedPreferences

object CompanionPrefs {
    private const val PREF = "ble_companion"
    private const val KEY_API_BASE = "api_base"
    private const val KEY_LOGS = "event_logs"

    private fun prefs(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE)

    fun apiBase(ctx: Context): String =
        prefs(ctx).getString(KEY_API_BASE, "")?.trim().orEmpty()

    fun setApiBase(ctx: Context, value: String) {
        prefs(ctx).edit().putString(KEY_API_BASE, value.trim().trimEnd('/')).apply()
    }

    fun appendLog(ctx: Context, line: String) {
        val stamp = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.KOREA)
            .format(java.util.Date())
        val next = "$stamp  $line"
        val prev = prefs(ctx).getString(KEY_LOGS, "").orEmpty()
        val merged = (listOf(next) + prev.lines().filter { it.isNotBlank() }).take(40)
        prefs(ctx).edit().putString(KEY_LOGS, merged.joinToString("\n")).apply()
    }

    fun logs(ctx: Context): List<String> =
        prefs(ctx).getString(KEY_LOGS, "").orEmpty().lines().filter { it.isNotBlank() }

    fun clearLogs(ctx: Context) {
        prefs(ctx).edit().remove(KEY_LOGS).apply()
    }
}
