package com.petidconnect.nfcwriter

import android.content.Context

/**
 * 런타임에 API 주소/키(개발·테스트용) 및 프로필 URL의 사이트 기준이 저장됩니다.
 * [BuildConfig]는 빌드 시 기본값으로 사용하고, 앱에 저장한 값이 있으면 우선합니다.
 */
class NfcServerSettings(context: Context) {
    private val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun getApiBaseOrEmpty(): String =
        p.getString(KEY_API_BASE, null).orEmpty().trim().trimEnd('/')

    fun getApiKeyOrEmpty(): String =
        p.getString(KEY_API_KEY, null).orEmpty().trim()

    /**
     * 프로필 URL 자동 완성용 (예: https://xxx.pages.dev)
     * 비어 있으면 [getApiBaseForProfileOrNull]이 API 베이스로 대체할 수 있음
     */
    fun getProfileSiteBaseOrEmpty(): String =
        p.getString(KEY_PROFILE_SITE_BASE, null).orEmpty().trim().trimEnd('/')

    fun setApiBase(value: String) {
        p.edit().putString(KEY_API_BASE, value.trim()).apply()
    }

    fun setApiKey(value: String) {
        p.edit().putString(KEY_API_KEY, value.trim()).apply()
    }

    fun setProfileSiteBase(value: String) {
        p.edit().putString(KEY_PROFILE_SITE_BASE, value.trim()).apply()
    }

    companion object {
        private const val PREFS = "pet_id_nfc_writer_v1"
        private const val KEY_API_BASE = "api_base"
        private const val KEY_API_KEY = "api_key"
        private const val KEY_PROFILE_SITE_BASE = "profile_site_base"
    }
}
