# BLE 연동 구현 계획 (마스터 인덱스)

NFC 축(발견자 즉시 연락)은 운영 중이며, BLE는 **보호자·동행인 근접·이탈 조기 경고** 옵션 레이어로 확장합니다.  
서버 계약(`POST /api/ble/events`, `tags.ble_mac`)은 이미 구현되어 있고, 본 계획은 **클라이언트·펌웨어·운영** 착수를 위한 로드맵입니다.

## 관련 문서

| 문서 | 내용 |
|------|------|
| [H1_BLE_INTEGRATION.md](./H1_BLE_INTEGRATION.md) | 서버 API·event_type·raw_payload 계약 (기존) |
| [BLE_COMPANION_APP_SPEC.md](./BLE_COMPANION_APP_SPEC.md) | Android 동행 앱 스펙 |
| [BLE_FIRMWARE_SPEC.md](./BLE_FIRMWARE_SPEC.md) | nRF52 태그 펌웨어 스펙 |
| [BLE_APP_DEEPLINK_SPEC.md](./BLE_APP_DEEPLINK_SPEC.md) | 웹 ↔ 동행 앱 딥링크 |
| [BLE_E2E_CHECKLIST.md](./BLE_E2E_CHECKLIST.md) | E2E 검증 체크리스트 |
| [TRACKING_PRODUCT_GOALS.md](./TRACKING_PRODUCT_GOALS.md) | 제품 포지셔닝·대외 문구 |
| [NFC_BLE_WEB_WRITING.md](./NFC_BLE_WEB_WRITING.md) | Web Bluetooth 비권장 정책 |

## 아키텍처 요약

```
[NFC 태그] ──발견자──▶ /t/{UID} ──▶ 즉시 연락 (메인 축)
[BLE 태그] ──보호자폰/동행앱──▶ POST /api/ble/events ──▶ 근접·이탈·GPS (옵션)
         └─ tags.ble_mac + raw_payload.tag_id 로 NFC 인벤토리와 연결
```

## Phase 0 — 계약 확정 (완료·유지)

- [x] `ble_location_events` 테이블·`ble-event-contract.ts`
- [x] `POST/GET /api/ble/events`
- [x] `tags.ble_mac`·`findTagByDeviceHint()`
- [x] 관리자 인벤토리 `ble_mac` 편집
- [x] 보호자 스캔 화면 NFC+BLE 통합 표시
- [x] 본 문서 세트 + 환경 변수·대시보드 BLE 온보딩 카드(플래그 뒤)

## Phase 1 — Android 동행 앱 MVP

**목표:** 보호자 폰이 등록된 태그 MAC을 스캔하고 `ble_scan` / `ble_lost` 전송.

| 작업 | 산출물 | 상태 |
|------|--------|------|
| 프로젝트 스캐폴드 | `android-companion/` | 완료 |
| 로그인·세션 | WebView `/login` → CookieManager | 완료 |
| 포그라운드 BLE 스캔 | `BleScanForegroundService` + RSSI | 완료 |
| 이벤트 업로드 | `BleEventUploader` → `POST /api/ble/events` | 완료 |
| 딥링크 | `DeepLinkParser` + intent-filter | 완료 |
| 웹 온보딩 | `DashboardBleCompanionCard` | 완료 (플래그) |
| 실기기 E2E | [BLE_E2E_CHECKLIST](./BLE_E2E_CHECKLIST.md) §E | 미완 |

**E2E:** 하드웨어 없이 테스트 BLE 비콘 MAC을 `tags.ble_mac`에 등록 후 앱 스캔 검증.

## Phase 2 — 이탈 알림·지오펜스

| 작업 | 비고 |
|------|------|
| `ble_lost` → 보호자 알림 | `GUARDIAN_REALTIME_ALERTS.md` 확장 |
| `phone_gps` + `/api/geofence/check` | 앱에서 연동 |
| 실종 모드 민감도 상향 | 정책 문서화 후 구현 |
| 대시보드 BLE 타임라인 강화 | `scans/page.tsx` |

## Phase 3 — nRF52 펌웨어

[BLE_FIRMWARE_SPEC.md](./BLE_FIRMWARE_SPEC.md) 참고.  
광고 패킷에 `tag_id`(NFC UID) 포함, 버튼·배터리 이벤트.

## Phase 4 — 디바이스 인증

nRF 직접 업링크용 HMAC/API Key (`NFC_NATIVE_*` 패턴 참고).  
`POST /api/ble/events/device` (세션 없음) — 별도 설계.

## Phase 5 — iOS·B2B (후순위)

- iOS Core Bluetooth 백그라운드 제약 → 포그라운드 동행 또는 Find My 별도 트랙
- B2B 크라우드 BLE → `TRACKING_PRODUCT_GOALS.md` B2B 모드

## 환경 변수

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_BLE_COMPANION_ENABLED` | `"true"`일 때 보호자 BLE 온보딩 UI |
| `NEXT_PUBLIC_BLE_COMPANION_APP_STORE_URL` | Play 스토어(개발 단계는 비워 둠, APK 직접 설치) |
| `NEXT_PUBLIC_APP_URL` | 딥링크·API base 일관성 |

서버 전용 디바이스 인증 키는 Phase 4에서 `.env.example`에 추가 예정.

## 코드 맵 (웹)

| 경로 | 역할 |
|------|------|
| `src/lib/ble-companion-feature.ts` | 기능 플래그 |
| `src/lib/ble-mac-format.ts` | MAC 정규화·검증 |
| `src/lib/ble-bulk-register-parse.ts` | UID+MAC 대량 등록 파싱 |
| `src/components/dashboard/DashboardBleCompanionCard.tsx` | 보호자 온보딩 |
| `src/app/dashboard/[kind]/ble/page.tsx` | BLE 전용 페이지 |
| `src/app/actions/tag.ts` | `logGuardianBleAppEvent`, `listGuardianBleCompanionTargets` |
| `src/app/actions/admin.ts` | `registerBulkTags` + `ble_mac` |
| `android-companion/README.md` | 네이티브 앱 착수 가이드 |

## 변경 이력

- 2026-07-09: 초안 — Phase 0~5, 문서 인덱스, 웹 준비 작업 반영
- 2026-07-27: 관리자 UX — 통합 인벤토리 카피, `UID,MAC` 한 줄 등록, BLE MAC 유무 필터
- 2026-07-27: Phase 1 MVP 코드 — `android-companion` 스캔·업로드·딥링크·WebView 로그인
