## NFC/BLE web URL write (policy, matrix, BLE contract)

### 1) Policy (canonical path)

- Official URL write path: **Android Chrome + HTTPS + Web NFC** (`NDEFWriter`).
- Users do not type URLs manually. The app writes `https://{app-host}/t/{tagId}`.
- `prepareNfcTagWrite` only returns URL for registered tag IDs.
- Guardian dashboard can fall back to native app handoff when Web NFC write is unavailable.

### 2) Native fallback switch

- Enable native handoff UI in web:
  - `NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED=true`
- Optional install CTA:
  - `NEXT_PUBLIC_NFC_NATIVE_APP_STORE_URL=https://play.google.com/store/apps/details?id=com.petidconnect.nfcwriter`

Server secrets:

- `NFC_NATIVE_HANDOFF_SECRET`
- `NFC_NATIVE_APP_API_KEY`
- optional HMAC keys (`NFC_NATIVE_APP_HMAC_SECRET_CURRENT`, `_NEXT`)

### 3) Browser matrix (summary)

- Android Chrome (HTTPS): Web NFC read/write supported on compatible devices.
- Samsung Internet / in-app browsers: read may work, write may fail by policy/API availability.
- iOS Safari: Web NFC write unavailable.

### 4) Code map

- Guardian handoff action: `src/app/actions/tag.ts`
- Admin handoff action: `src/app/actions/admin.ts`
- Guardian UI: `src/components/dashboard/modes/PetDashboard.tsx`
- Admin UI: `src/components/admin/tags/AdminNfcWriteCard.tsx`
- Android app project: `android-native-writer`