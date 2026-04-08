# Pet-ID Connect — 확장 개발 계획서

> 버전: 1.0 · 갱신: 2026-04-08

## 1. 비전 및 범위

**NFC**로 즉시 신원·긴급 연락, **BLE**로 보호자 앱 연결·이탈 단서·마지막 위치 힌트를 제공하는 웨어러블 + 앱 + 클라우드.

### 페르소나(앱 모드)

| 코드 | 설명 |
|------|------|
| pet | 반려동물 (기존) |
| elder | 기억 동행 서비스 |
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

- [x] migrations/0003_subject_kind_ble_events.sql
- [x] src/db/schema.sql (subject_kind, ble_location_events 참고 반영)
- [x] src/lib/subject-kind.ts
- [x] getPets / createPet / getScanLogs + subject_kind
- [x] /hub, 로그인·랜딩 콜백 /hub
- [x] 대시보드·네비·펫 목록·스캔·등록에 ?kind= 연동
- [x] npm run build 통과 (소스 UTF-8 유지)


## 5. M1 구현 체크리스트

- [x] updatePet에서 subject_kind 정규화 및 빈 업데이트 방지
- [x] /dashboard/pets/[pet_id]/edit — 소유자만, DB 기준 모드로 PetForm 수정
- [x] 공개 프로필: subjectKind 반영, 네비·발견 안내 카피, 하단 수정 → 편집 페이지
- [x] 대시보드·관리 목록에서 프로필 링크에 ?kind= 유지
- [x] 관리자 대시보드: 모드별 등록 건수(getPetsSubjectKindCounts)



## 6. S1 구현 체크리스트

- [x] ble_location_events INSERT/SELECT 공통 모듈 (src/lib/ble-location-events-db.ts)
- [x] 요청 본문 검증 (src/lib/ble-events-input.ts; event_type: ble-event-contract.ts; raw_meta: ble-raw-payload.ts)
- [x] Server Actions: recordBleLocationEvent, getBleLocationEvents (src/app/actions/ble-events.ts)
- [x] REST: POST/GET /api/ble/events (세션 쿠키, pet 소유권 검증)
- [x] 스캔 페이지에 BLE 이벤트 목록 (?kind= 모드 필터)


## 7. S2 구현 체크리스트

- [x] migrations/0004_geofences.sql
- [x] Haversine/geo API/dashboard UI

## 8. 의사결정

- 1차 위치: 보호자 스마트폰 GPS.
- B2B 연동: 후순위.

## 8. S3 구현 체크리스트

- [x] /t/[tag_id] 리다이렉트에 subject_kind 기반 kind 쿼리
- [x] subjectKindNfcPublic 메타(역할 문구·CTA·공개 시 메모 비노출)
- [x] 비소유자: 민감 메모 카드 대신 안내, 하단 네비 랜딩/전화/로그인 분기
- [x] NFC 진입 배너(nfcEntry), 연락처 없을 때 버튼 비활성


### S3 보완 (프라이버시·UX)

- 공개 방문자: 기억 동행·어린이 모드 이름·비고 필드 마스킹, 모드별 안내 문구·긴급 뱃지
- 로그인 링크에 callbackUrl(프로필 복귀 + kind/tag)
- 공개 하단 네비 한글 라벨, NFC 없을 때 위치 공유 안내 문구
- generateMetadata: 브라우저 탭 제목·설명

## 9. 다음 단계 (H1 하드웨어·펌웨어)

- nRF52 기반 프로토타입 보드, 코인셀 전원, NFC 패시브 유지
- BLE 페어링·광고 UUID와 `/api/ble/events` 페이로드 매핑
- `event_type` 권장 키·별칭 정규화: `src/lib/ble-event-contract.ts` (상세: `docs/H1_BLE_INTEGRATION.md`)
- `raw_payload` 권장 키 추출·응답 `raw_meta`: `src/lib/ble-raw-payload.ts`
- 현장 테스트 후 태그 인벤토리·펌웨어 버전 관리(관리자 태그 화면 연동 검토)
