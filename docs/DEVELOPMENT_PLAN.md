# Pet-ID Connect — 확장 개발 계획서

> 버전: 1.0 · 갱신: 2026-04-08

## 1. 비전 및 범위

**NFC**로 즉시 신원·긴급 연락, **BLE**로 보호자 앱 연결·이탈 단서·마지막 위치 힌트를 제공하는 웨어러블 + 앱 + 클라우드.

### 페르소나(앱 모드)

| 코드 | 설명 |
|------|------|
| pet | 반려동물 (기존) |
| elder | 노인·치매 케어 |
| child | 어린이 |
| luggage | 수화물·가방 |

### 하드웨어(로드맵)

nRF52 BLE+NFC 통합, 코인셀 6~12개월 목표, 방전 시 NFC 패시브 유지, IP68 하우징.

### 소프트웨어(로드맵)

BLE 페어링, 지오펜스, NFC 모드별 랜딩, BLE 단절 시 폰 기준 위치 기록.

## 2. 아키텍처

- 관리 대상: pets.subject_kind 로 유형 구분 (추후 테이블 분리 가능).
- 태그·스캔 로직 공유, 프로필만 모드별 분기.
- Cloudflare Edge + Server Action 페이지는 서버 page.tsx 래퍼 유지.

## 3. 단계

| Phase | 내용 |
|-------|------|
| M0 | 계획서, 마이그레이션, /hub, ?kind= 대시보드 연동 |
| M1 | 모드별 카피·수정 UI, 관리자 요약 |
| S1 | BLE 이벤트 API, ble_location_events 기록 |
| S2 | 지오펜스 v1 |
| S3 | NFC 공개 프로필 분기 |
| H1 | nRF52 프로토타입 |

## 4. M0 구현 체크리스트

- migrations/0003_subject_kind_ble_events.sql
- src/lib/subject-kind.ts
- getPets / createPet + subject_kind
- /hub, 로그인 콜백 /hub
- 대시보드·펫 목록·등록에 kind 쿼리

## 5. 의사결정

- 1차 위치: 보호자 스마트폰 GPS.
- B2B 연동: 후순위.