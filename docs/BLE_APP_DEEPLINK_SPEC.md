# Link-U BLE 동행 앱 딥링크 스펙 (웹 ↔ 앱)

웹 대시보드 **「동행 앱으로 BLE 연결」** 과 Android Companion 앱을 연동하는 파라미터 계약입니다.  
NFC 딥링크는 [NFC_APP_DEEPLINK_SPEC.md](./NFC_APP_DEEPLINK_SPEC.md)를 따릅니다.

## 1) 스킴·호스트

```
petidconnect://ble/scan?...
```

Android `AndroidManifest.xml` intent-filter:

- scheme: `petidconnect`
- host: `ble`
- pathPrefix: `/scan`

## 2) `ble/scan` 파라미터

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `kind` | 예 | `pet \| elder \| child \| luggage \| gold` |
| `pet_id` | 예 | 스캔·이벤트 대상 관리 ID |
| `tenant` | 아니오 | B2B 조직 ID |
| `entry` | 아니오 | `dashboard_ble_companion` (기본) |
| `app_base` | 아니오 | 웹 base URL (API·복귀 링크) |
| `mac` | 아니오 | 단일 BLE MAC (`AA:BB:CC:DD:EE:FF`) — 있으면 우선 스캔 |
| `tag_id` | 아니오 | NFC UID — MAC 없을 때 서버 조회 힌트 |

### 예시

```
petidconnect://ble/scan?kind=pet&pet_id=abc123&mac=AA%3ABB%3ACC%3ADD%3AEE%3AFF&entry=dashboard_ble_companion
```

## 3) 앱 동작 권장

1. 파라미터 파싱 → 대상 `pet_id` 고정
2. `mac` 있으면 해당 MAC만 스캔 필터
3. 없으면 웹이 전달한 목록 또는 `GET /api/device/mode` (공개, MAC·모드만) — **pet_id는 세션으로만 확정**
4. 동행 모드 UI 표시 + 포그라운드 서비스 시작
5. 이벤트는 `POST /api/ble/events` (보호자 세션)

## 4) 설치 fallback

NFC와 동일:

- 앱 미설치: `/install?next=<urlencoded 딥링크>`
- `NEXT_PUBLIC_BLE_COMPANION_APP_STORE_URL` 설정 시 스토어 우선 (개발 단계는 비어 있음)

## 5) 웹 이벤트 로그

`admin_action_logs` — `action='guardian_ble_app_event'`

| event | 설명 |
|-------|------|
| `app_open_attempt` | 딥링크 시도 |
| `app_opened` | 앱 전환 성공(가능 시) |
| `store_fallback` | 스토어 이동 |
| `install_page_fallback` | `/install` 이동 |

payload: `event`, `subjectKind`, `petId`, `tenantId`, `userId`, `tagId?`, `bleMac?`

코드: `logGuardianBleAppEvent` in `src/app/actions/tag.ts`

## 6) 웹 UI 연동

- `DashboardBleCompanionCard` — `NEXT_PUBLIC_BLE_COMPANION_ENABLED=true` 일 때 표시
- 경로: `/dashboard/[kind]/ble`

## 7) 앱 구현 체크리스트

- [x] intent-filter `petidconnect` / `ble` / `/scan`
- [x] 파라미터 파싱 실패 시 수동 MAC 입력 허용
- [x] `pet_id` 없으면 대상 선택 화면 (수동 입력)
- [ ] 완료 후 웹 복귀 링크 (`app_base` + `/dashboard/{kind}/scans`)
