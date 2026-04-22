# NFC Hybrid Implementation Plan

## Goal
- Keep the existing admin web flow for inventory and audit.
- Add an Android native app fallback path for NFC writing.
- Keep all attempts and outcomes traceable in `admin_action_logs`.

## Step-by-step rollout

### Phase 1 (done)
- Add a native app handoff button in the admin URL write card (shown only when **`NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED=true`**; default Web NFC only).
- Validate UID/URL server-side, then issue a deep link.
- Log handoff events as `nfc_native_handoff`.

### Phase 2 (done)
- Added callback API endpoint: `POST /api/admin/nfc/native-write`.
- Header: `Authorization: Bearer <NFC_NATIVE_APP_API_KEY>`.
- Request body: `tagId`, `url`, `deviceId`, `success`, `clientError`, `writtenAt`.
- Callback results are saved as `nfc_native_write`.
- Admin history action filter now includes:
  - `nfc_native_handoff`
  - `nfc_native_write`

### Phase 3 (done)
- Admin history action filter support is complete for:
  - `nfc_native_handoff`
  - `nfc_native_write`
- Added funnel metric from web write fail to native write success:
  - `webWriteFailures7d`
  - `nativeWriteSuccessFromWebFail7d`
  - `nativeRecoveryRate7d`
- KPI is now visible in:
  - NFC hub KPI cards
  - Admin dashboard summary cards

### Phase 4 (in progress)
- Added short-lived handoff token issuance in admin handoff:
  - env: `NFC_NATIVE_HANDOFF_SECRET`
  - token payload: `uid`, `url`, `exp`
- Added callback-side handoff token verification:
  - `/api/admin/nfc/native-write` now requires `handoffToken`
- Added optional HMAC callback verification:
  - env: `NFC_NATIVE_APP_HMAC_SECRET`
  - headers: `x-native-timestamp`, `x-native-signature`
  - signature source: `${timestamp}.${rawBody}`

## Admin operation flow
1. Register UID in the inventory.
2. Try web NFC write in the URL write page.
3. If unsupported or failed, use `Open in native app`.
4. Check success/failure in history and audit panels.

## Native callback API example

### Request
- Method: `POST`
- URL: `/api/admin/nfc/native-write`
- Header: `Authorization: Bearer <NFC_NATIVE_APP_API_KEY>`
- Header: `Content-Type: application/json`
- Header (optional but recommended): `x-native-timestamp`
- Header (optional but recommended): `x-native-signature`

```json
{
  "tagId": "AA:BB:CC:DD:EE:FF",
  "url": "https://example.com/t/AA%3ABB%3ACC%3ADD%3AEE%3AFF",
  "handoffToken": "<token-from-handoff-link>",
  "deviceId": "android-admin-01",
  "success": true,
  "writtenAt": "2026-04-20T08:30:00.000Z"
}
```

### Error cases
- `401`: invalid/missing bearer token, invalid handoff token, or invalid HMAC signature
- `400`: required fields missing or invalid UID format
- `404`: unknown tagId (not registered in inventory)
- `503`: server secret (`NFC_NATIVE_APP_API_KEY` or `NFC_NATIVE_HANDOFF_SECRET`) not configured

## Android (Kotlin/OkHttp) HMAC example

```kotlin
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

fun toBase64Url(bytes: ByteArray): String =
    Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)

fun hmacSha256Base64Url(secret: String, message: String): String {
    val mac = Mac.getInstance("HmacSHA256")
    val key = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256")
    mac.init(key)
    return toBase64Url(mac.doFinal(message.toByteArray(Charsets.UTF_8)))
}

fun postNativeWrite(
    apiBase: String,
    apiKey: String,
    hmacSecret: String,
    jsonBody: String
) {
    val ts = System.currentTimeMillis().toString()
    val signature = hmacSha256Base64Url(hmacSecret, "$ts.$jsonBody")

    val req = Request.Builder()
        .url("$apiBase/api/admin/nfc/native-write")
        .addHeader("Authorization", "Bearer $apiKey")
        .addHeader("Content-Type", "application/json")
        .addHeader("x-native-timestamp", ts)
        .addHeader("x-native-signature", signature)
        .post(jsonBody.toRequestBody("application/json".toMediaType()))
        .build()

    OkHttpClient().newCall(req).execute().use { res ->
        check(res.isSuccessful) { "native-write failed: ${res.code} ${res.body?.string()}" }
    }
}
```

## Secrets required
- `NFC_NATIVE_APP_API_KEY`: bearer auth for native callback API.
- `NFC_NATIVE_HANDOFF_SECRET`: handoff token signing/verification.
- `NFC_NATIVE_APP_HMAC_SECRET`: callback HMAC signing/verification.
