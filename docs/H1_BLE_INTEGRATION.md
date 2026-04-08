# H1 BLE 연동 (소프트웨어 계약)

nRF52·동행 앱에서 Cloudflare Workers(Next) POST /api/ble/events로 보내는 JSON과 event_type 규칙을 정리합니다.

## 엔드포인트

- URL: /api/ble/events (동일 오리진, 세션 쿠키 필요)
- Method: POST
- Headers: Content-Type: application/json
- 성공 응답 헤더: X-Pet-ID-Ble-Contract: 2 (계약 버전; v2부터 raw_meta 응답)

## 요청 본문

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| pet_id | string | 예 | 등록된 반려 대상 ID |
| event_type | string | 예 | 아래 권장 키 또는 별칭(서버에서 정규화). 최대 64자 |
| latitude | number | 아니오 | WGS84 |
| longitude | number | 아니오 | WGS84 |
| rssi | number | 아니오 | 정수 선호 |
| raw_payload | string 또는 객체 | 아니오 | 추가 메타(8192자 제한). 권장 키는 아래 |

### raw_payload 권장 JSON

| 키 | 별칭 | 최대 길이 | 설명 |
|----|------|-----------|------|
| fw | firmware_version | 32 | 펌웨어 버전 |
| device_nonce | nonce | 128 | 일회성 등 |
| tag_id | - | 64 | NFC/태그 식별자 |

그 외 키는 raw_payload에 그대로 저장됩니다. 서버는 위 키만 파싱해 응답 raw_meta에 넣습니다.

### 예시 JSON

pet_id, event_type disconnect, raw_payload 객체에 fw/device_nonce/tag_id 포함.

disconnect는 서버에서 ble_lost로 저장됩니다.

## 권장 event_type

코드: BLE_CANONICAL_EVENT_TYPES in src/lib/ble-event-contract.ts.

ble_scan, ble_connect, ble_lost, phone_gps, geofence_exit, battery_low, button_press

## 성공 응답

ok, id, event_type, raw_meta { firmware_version, device_nonce, tag_id }.

event_type은 정규화된 값. raw_meta는 raw_payload가 JSON일 때만 채움.

## 향후

디바이스 인증(HMAC 등)은 별도 설계.
