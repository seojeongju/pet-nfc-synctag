# Link-U BLE Companion (Android)

보호자 폰에서 등록된 태그의 **BLE MAC**을 스캔하고 `POST /api/ble/events`로 근접·이탈 이벤트를 전송하는 Android 앱입니다.

NFC URL 기록은 **`android-native-writer/`** 가 담당합니다. 역할을 분리해 유지하세요.

## 문서

| 문서 | 내용 |
|------|------|
| [docs/BLE_COMPANION_APP_SPEC.md](../docs/BLE_COMPANION_APP_SPEC.md) | 앱 기능·권한·RSSI 정책 |
| [docs/BLE_APP_DEEPLINK_SPEC.md](../docs/BLE_APP_DEEPLINK_SPEC.md) | `petidconnect://ble/scan` |
| [docs/H1_BLE_INTEGRATION.md](../docs/H1_BLE_INTEGRATION.md) | 서버 API 계약 |
| [docs/BLE_E2E_CHECKLIST.md](../docs/BLE_E2E_CHECKLIST.md) | QA 체크리스트 |

## 프로젝트 구조

```
android-companion/
  app/src/main/
    AndroidManifest.xml
    java/com/petidconnect/companion/
      MainActivity.kt
      LoginWebViewActivity.kt
      BleScanForegroundService.kt
      BleEventUploader.kt
      DeepLinkParser.kt
      CompanionPrefs.kt
      ui/CompanionAppScreen.kt
  local.properties.example
```

- **applicationId:** `com.petidconnect.companion`
- **minSdk:** 26 · **targetSdk:** 34

## 빌드

1. Android Studio에서 `android-companion/` 열기  
2. `local.properties.example` → `local.properties` 복사 후 `NATIVE_API_BASE_URL` 설정  
   (`sdk.dir`은 Studio가 자동 추가)
3. Run `app` 또는:

```bat
cd android-companion
gradlew.bat assembleDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk` (Play 미등록 — 직접 설치)

## 사용 흐름 (MVP)

1. 앱에서 **API base** 확인 → **웹 로그인** (Better Auth 쿠키)
2. 대시보드 `/dashboard/{kind}/ble`에서 동행 앱 실행  
   또는 수동으로 `pet_id` · `BLE MAC` 입력
3. **동행 모드 ON** → 포그라운드 스캔  
   - RSSI ≥ -75 (2회) → `ble_scan`  
   - 30초 미검출 또는 RSSI &lt; -90 → `ble_lost`

## 딥링크

```
petidconnect://ble/scan?kind=pet&pet_id=...&mac=AA:BB:CC:DD:EE:FF&entry=dashboard_ble_companion
```

미설치 시 웹은 `/install?next=<encoded>` 로 fallback (`NEXT_PUBLIC_BLE_COMPANION_APP_STORE_URL`은 개발 단계 비움).

## Phase 1 상태

| 항목 | 상태 |
|------|------|
| Manifest · BLE 권한 · FGS · 딥링크 | 완료 |
| 딥링크 파서 | 완료 |
| WebView 로그인 → 세션 쿠키 | 완료 |
| MAC 필터 스캔 + RSSI | 완료 |
| `POST /api/ble/events` | 완료 |
| phone_gps / 지오펜스 | Phase 2 |
| Play 배포 | 앱 완료 후 |

## NFC Writer와 공존

| 앱 | 패키지 | 스킴 |
|----|--------|------|
| NFC Writer | `com.petidconnect.nfcwriter` | `petidconnect://nfc/...` |
| BLE Companion | `com.petidconnect.companion` | `petidconnect://ble/...` |
