# BLE 태그 펌웨어 스펙 (nRF52)

NFC+BLE 하이브리드 태그 또는 BLE 전용 태그의 **광고·이벤트** 계약입니다.  
Phase 3에서 펌웨어 팀·하드웨어와 공유하는 기준 문서입니다.

## 1) 식별자 연결

| 식별자 | 저장 위치 | 용도 |
|--------|-----------|------|
| NFC UID | `tags.id` (D1) | 발견자 `/t/{UID}` |
| BLE MAC | `tags.ble_mac` | 동행 앱 스캔 필터 |
| `tag_id` in raw_payload | BLE 이벤트 | NFC 인벤토리 교차 참조 |

**출고 시 UID와 MAC을 쌍으로 등록** (`registerBulkTags` + `ble_mac` 또는 관리자 인벤토리).

## 2) BLE 광고 (Phase 3 MVP)

| 항목 | 권장 값 |
|------|---------|
| 장치 이름 | `LinkU-` + UID 마지막 4자 (선택) |
| Advertising interval | 100–500 ms (배터리 vs 반응성 트레이드오프) |
| Connectable | 비연결(비콘) 우선 — 앱은 스캔만 |
| Manufacturer Data | 회사 ID + `tag_id` ASCII (최대 64자) |

동행 앱은 **MAC 주소**로 1차 필터, Manufacturer Data의 `tag_id`로 2차 검증.

## 3) GATT (선택, Phase 3+)

웹 Web Bluetooth URL 쓰기는 **하지 않음** (`NFC_BLE_WEB_WRITING.md`).  
공장·동행 앱 전용 프로비저닝만 허용할 경우:

| 서비스 UUID | 특성 | 용도 |
|-------------|------|------|
| (벤더 정의) | `tag_id` read-only | NFC UID 확인 |
| | `pet_id` read-only | 연결 후 서버 동기화 값 (선택) |
| | `fw_version` | `raw_payload.fw` |

UUID는 펌웨어 확정 후 본 문서에 고정 기입.

## 4) 이벤트 (버튼·배터리)

태그가 직접 서버에 붙지 않고, **동행 앱 또는 게이트웨이**가 이벤트를 전달하는 모델을 기본으로 합니다.

| 하드웨어 이벤트 | 앱이 전송하는 event_type | 비고 |
|-----------------|--------------------------|------|
| SOS 버튼 2초 | `button_press` | 즉시 알림 대상 |
| 배터리 < 15% | `battery_low` | 주기 리포트 |
| (없음) | `ble_scan` / `ble_lost` | 앱 RSSI 판단 |

태그가 셀룰러/GPS 내장 시 `phone_gps` 직접 업링크는 Phase 4+ (디바이스 인증 필수).

## 5) raw_payload 계약

[H1_BLE_INTEGRATION.md](./H1_BLE_INTEGRATION.md) 준수:

```json
{
  "tag_id": "04A1B2C3D4E5F6",
  "fw": "nrf-1.2.0",
  "device_nonce": "optional-uuid",
  "battery_pct": 42
}
```

`battery_pct` 등 추가 키는 DB `raw_payload`에 그대로 저장.

## 6) 전력·배터리

- CR2032 등: 광고 주기·연결 비활성화로 수개월 목표 (하드웨어 팀 산정)
- `battery_low` 임계값: 펌웨어 설정 가능, 기본 15%

## 7) 제조·출고 플로우

1. 공장: NFC UID 읽기 + BLE MAC 기록
2. 관리자: `TagBulkRegisterCard` — UID 목록 + 동일 순서 BLE MAC (또는 `UID,MAC` 한 줄)
3. NFC URL 기록: 기존 Web NFC / Writer 앱
4. QA: [BLE_E2E_CHECKLIST.md](./BLE_E2E_CHECKLIST.md) §출고

## 8) 변경 이력

- 2026-07-09: 초안 — 광고·식별자·이벤트 매핑
