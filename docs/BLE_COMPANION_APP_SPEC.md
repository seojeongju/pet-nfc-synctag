# BLE 동행 앱 스펙 (Android Companion)

보호자(또는 동행인) 스마트폰이 **등록된 태그의 BLE MAC**을 스캔하고, 근접·이탈 이벤트를 `POST /api/ble/events`로 전송하는 Android 앱입니다.

> **프로젝트 위치:** `android-companion/` (NFC Writer `android-native-writer/`와 분리)  
> **개발 단계 배포:** APK 직접 설치. Play 스토어 URL은 비워 둘 수 있음 (`.cursor/rules/app-distribution.mdc`).

## 1) 역할·범위

| 포함 | 제외 |
|------|------|
| BLE 스캔·RSSI 근접/이탈 판단 | NFC NDEF 쓰기 (Writer 앱 담당) |
| 보호자 세션으로 이벤트 업로드 | Web Bluetooth |
| 포그라운드 서비스·알림 채널 | 발견자용 공개 프로필 |
| 딥링크 `petidconnect://ble/scan` | iOS (Phase 5) |

## 2) 기술 스택 (권장)

- Kotlin, minSdk 26, targetSdk 34+
- Jetpack Compose
- `BluetoothLeScanner` (Android 12+ 권한 분기)
- OkHttp 또는 Ktor — `POST /api/ble/events`
- 포그라운드 서비스 (`foregroundServiceType="connectedDevice"` 또는 `location` — GPS 동반 시)

패키지명 제안: `com.petidconnect.companion`

## 3) 권한

| 권한 | 용도 |
|------|------|
| `BLUETOOTH_SCAN` (API 31+) | BLE 스캔 |
| `BLUETOOTH_CONNECT` (API 31+) | 연결형 태그(선택) |
| `ACCESS_FINE_LOCATION` | BLE 스캔 + `phone_gps` 이벤트 |
| `POST_NOTIFICATIONS` (API 33+) | 포그라운드 서비스 알림 |
| `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_CONNECTED_DEVICE` | 백그라운드 스캔 |

앱 내 **명시적 동의** 화면: 위치·블루투스·백그라운드 동작 목적 설명 (`TRACKING_PRODUCT_GOALS.md`).

## 4) 인증

Phase 1: **보호자 웹과 동일 세션 쿠키**.

1. Custom Tabs 또는 WebView로 `/login` 완료
2. 쿠키를 앱 HTTP 클라이언트에 주입
3. `POST /api/ble/events` — 401 시 재로그인 유도

Phase 4: 태그 직접 업링크용 HMAC — 별도 엔드포인트 예정.

## 5) 스캔 대상 MAC 목록

앱은 다음 순서로 스캔 필터를 구성합니다.

1. 딥링크 `mac` 파라미터 (단일)
2. 딥링크 `pet_id` → 서버 `GET /api/device/mode?ble=` 또는 웹이 전달한 `macs` JSON
3. (권장) 딥링크 `tag_ids` + 웹에서 조회한 `ble_mac` 목록 — [BLE_APP_DEEPLINK_SPEC](./BLE_APP_DEEPLINK_SPEC.md)

웹 대시보드 `listGuardianBleCompanionTargets`가 반환하는 행:

- `pet_id`, `pet_name`, `tag_id`, `ble_mac`

`ble_mac`이 null이면 해당 태그는 스캔 대상에서 제외하고 UI에 "MAC 미등록" 표시.

## 6) RSSI·이벤트 정책

| 상태 | 조건 (기본값, 기기별 튜닝 가능) | event_type |
|------|--------------------------------|------------|
| 근접 검출 | RSSI ≥ -75 dBm, 2회 연속 | `ble_scan` |
| 이탈 | 30초 연속 미검출 또는 RSSI < -90 | `ble_lost` |
| GPS 동반 | 스캔 시점 위치 획득 성공 | `phone_gps` (좌표 필드 + 선택 `ble_scan`) |

`disconnect` / `lost` 별칭은 서버에서 `ble_lost`로 정규화 (`ble-event-contract.ts`).

### POST 본문 예시

```json
{
  "pet_id": "pet_abc",
  "event_type": "ble_scan",
  "latitude": 37.5665,
  "longitude": 126.9780,
  "rssi": -68,
  "raw_payload": {
    "tag_id": "04A1B2C3D4E5F6",
    "fw": "companion-1.0.0",
    "device_nonce": "uuid-v4"
  }
}
```

성공 응답 헤더: `X-Pet-ID-Ble-Contract: 2`

## 7) UI 화면 (MVP)

1. **온보딩** — 권한·목적 설명
2. **대상 선택** — 딥링크로 prefill된 `pet_id` / 수동 선택
3. **동행 모드** — ON/OFF 토글, 포그라운드 알림 "○○ 근처 감지 중"
4. **이벤트 로그** — 최근 전송 성공/실패 (로컬만, 선택)

## 8) 딥링크

[BLE_APP_DEEPLINK_SPEC.md](./BLE_APP_DEEPLINK_SPEC.md) — `petidconnect://ble/scan?...`

## 9) 설치 fallback

웹 `DashboardBleCompanionCard`는 앱 미설치 시 `/install?next=<딥링크>`로 이동 (NFC와 동일 패턴).

## 10) 빌드·로컬 설정

`android-companion/README.md` 참고.

| local.properties | 설명 |
|----------------|------|
| `NATIVE_API_BASE_URL` | `https://wow-linku.co.kr` 등 |
| (선택) `COMPANION_DEBUG_PET_ID` | 개발용 |

## 11) 구현 체크리스트

- [x] `AndroidManifest.xml` — BLE 권한·포그라운드 서비스·딥링크 intent-filter
- [x] 딥링크 파서 `ble/scan`
- [x] 세션 쿠키 로그인 (WebView `/login`)
- [x] MAC 필터 스캔 + RSSI 디바운스
- [x] `POST /api/ble/events` (+ 401 알림)
- [x] `logGuardianBleAppEvent` 대응 웹 이벤트 (`guardian_ble_app_event`) — 웹 카드
- [ ] E2E: [BLE_E2E_CHECKLIST.md](./BLE_E2E_CHECKLIST.md) §E (실기기)
- [ ] phone_gps 동반 업로드 (Phase 2)

