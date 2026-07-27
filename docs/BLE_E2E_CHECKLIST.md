# BLE 연동 E2E 체크리스트

[NFC_NATIVE_E2E_CHECKLIST.md](./NFC_NATIVE_E2E_CHECKLIST.md) 형식을 따릅니다.  
Phase 1(동행 앱) 착수 전·후 QA에 사용합니다.

## 사전 조건

- [ ] D1 마이그레이션 적용 (`tags.ble_mac`, `ble_location_events`)
- [ ] `NEXT_PUBLIC_BLE_COMPANION_ENABLED=true` (웹 BLE 온보딩 UI)
- [ ] `NEXT_PUBLIC_APP_URL` 운영 URL과 일치
- [ ] 테스트용 보호자 계정 + 관리 대상 1개 이상
- [ ] NFC 태그 1개 이상 **보호자에게 연결**됨

## A. 관리자 — 출고·MAC 등록

- [ ] `TagBulkRegisterCard` — UID + BLE MAC 동일 줄 수로 등록
- [ ] 또는 `UID,MAC` 한 줄 형식으로 파싱 성공
- [ ] 인벤토리 `TagProductRow`에서 `ble_mac` 수동 편집 가능
- [ ] 잘못된 MAC 형식 시 등록 거부·건수 표시
- [ ] 동일 MAC 중복 등록 시 오류 또는 건너뛰기 정책 확인

## B. 보호자 웹 — 온보딩

- [ ] `/dashboard/{kind}/ble` 페이지 로드 (플래그 ON)
- [ ] 연결된 태그 중 `ble_mac` 있는 항목 표시
- [ ] `ble_mac` 없는 태그 — "MAC 미등록" 안내
- [ ] 「동행 앱 열기」→ `petidconnect://ble/scan?...` 생성
- [ ] 앱 미설치 시 `/install?next=...` fallback
- [ ] `guardian_ble_app_event` 감사 로그 기록

## C. API — 이벤트 기록 (curl 또는 앱)

로그인 세션 쿠키로:

```bash
curl -X POST "$APP_URL/api/ble/events" \
  -H "Content-Type: application/json" \
  -H "Cookie: <session>" \
  -d '{
    "pet_id": "<pet_id>",
    "event_type": "ble_scan",
    "rssi": -65,
    "raw_payload": { "tag_id": "<uid>", "fw": "test-1.0" }
  }'
```

- [ ] 200 + `X-Pet-ID-Ble-Contract: 2`
- [ ] `event_type` 정규화 (`disconnect` → `ble_lost`)
- [ ] 타인 `pet_id` → 403
- [ ] 미로그인 → 401

## D. 보호자 웹 — 소비

- [ ] `/dashboard/{kind}/scans` — BLE 이벤트 타임라인 표시
- [ ] `emptyBleHint` 문구 노출 (이벤트 없을 때)
- [ ] (Phase 2) `ble_lost` → 웹훅/Web Push

## E. 동행 앱 (Phase 1 완료 후)

- [ ] 딥링크로 진입 → `pet_id`·`mac` prefill
- [ ] BLE 스캔 권한 플로우
- [ ] 테스트 비콘/태그 근접 → `ble_scan` 전송
- [ ] 30초 이탈 → `ble_lost` 전송
- [ ] 포그라운드 알림 채널 표시

## F. 지오펜스 (Phase 2)

- [ ] 앱 `phone_gps` + `POST /api/geofence/check` → `geofence_exit` 기록

## G. 회귀 — NFC 축

- [ ] NFC 태그 연결·스캔·발견자 프로필 — 기존과 동일 동작
- [ ] BLE 작업이 NFC UID·URL 기록을 깨뜨리지 않음

## 서명

| 항목 | 날짜 | 담당 |
|------|------|------|
| A 관리자 | | |
| B~D 웹 | | |
| E 앱 | | |
