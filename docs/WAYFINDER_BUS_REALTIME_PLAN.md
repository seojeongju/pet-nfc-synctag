# 링크유-동행 — 공공버스 실시간 도착 안내 (추후 적용)

**상태:** 추후 적용 (백로그) · **우선순위:** 지하철 Wayfinder C3·D·E 및 운영 안정화 **이후**  
**작성:** 2026-05  
**관련:** [`WAYFINDER_SUBWAY_NAV.md`](./WAYFINDER_SUBWAY_NAV.md) · [`WAYFINDER_HANDOFF.md`](./WAYFINDER_HANDOFF.md) · [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)

---

## 1. 목표·범위

### 제품 목표

교통약자·동반 보호자가 **GPS(또는 NFC)** 로 **가장 가까운 버스 정류장**을 찾고, **실시간 도착 예정 정보**를 확인한 뒤 카카오맵으로 이동할 수 있게 한다.

### 1차 범위 (파일럿)

| 포함 | 제외 (추후) |
|------|-------------|
| 서울시 버스 도착정보 API (또는 합의된 단일 지자체) | 전국·전 지자체 일괄 |
| GPS → 근처 정류장 1~5개 | 정류장 즐겨찾기·알림 |
| 노선별 도착 예정(분·정류장 전) | 실내 경로·승차 예약 |
| 저상버스 등 교통약자 표시 (API 제공 시) | 앱 푸시 도착 알림 |
| 카카오맵 길찾기 링크 | 지하철 환승 경로 API |

### 지하철 Wayfinder와의 관계

- **메인:** 지하철역 GPS · 역 상세 · 교통약자 시설 (현행 `/wayfinder`)
- **보조·확장:** 버스 정류장 · 실시간 도착 (`/wayfinder` 탭 또는 섹션, 또는 `/wayfinder/bus`)
- 지하철 **역 상세** 하단 「이 역 근처 버스」는 Phase 2 이후 검토

---

## 2. 전제 조건 (착수 전)

- [ ] 공공데이터포털(또는 지자체) **버스 도착정보 API** 활용 신청·승인
- [ ] Cloudflare Pages에 API 키 등록 (지역별 분리 권장)
- [ ] 약관: 상업·재배포·호출 한도 확인
- [ ] 지하철 Wayfinder **수도권 시설 동기화** 운영 안정화 (참고 데이터 품질)
- [ ] 제품 합의: Play 스토어 전 단계에서는 웹 중심 ([`app-distribution.mdc`](../.cursor/rules/app-distribution.mdc))

### 환경 변수 (안)

| 변수 | 용도 |
|------|------|
| `PUBLIC_DATA_API_KEY` | 공공데이터포털 공통 (일부 API) |
| `SEOUL_BUS_API_KEY` | 서울 버스 도착 (필요 시 별도) |
| `GYEONGGI_BUS_API_KEY` | 경기 확장 시 (Phase 2) |

---

## 3. 기술 방침 (지하철과의 차이)

| 항목 | 지하철 시설 (현행) | 버스 도착 (본 계획) |
|------|-------------------|---------------------|
| 데이터 성격 | 준정적(시설 목록) | **실시간** |
| D1 저장 | `wayfinder_station_facilities` 전체 동기화 | 정류장 **마스터만** D1, 도착은 **캐시** |
| 캐시 | 거의 불필요 | **30~60초** TTL (KV 또는 D1 `bus_arrival_cache`) |
| 식별자 | `station_id` | **정류장 ARS·nodeId** (API별 상이) |
| GPS | 역 좌표 DB | **좌표 → 근처 정류장** 검색 API |
| 관리자 UI | `/admin/wayfinder` 동기화 | 정류장 마스터 배치(선택) + **실시간 조회는 서버 프록시** |

**원칙:** 클라이언트에 공공 API 키 노출 금지. Edge Route Handler에서 프록시·캐시.

---

## 4. 데이터 모델 (안)

### D1 — 정류장 마스터 (배치·선택)

```text
wayfinder_bus_stops
  id              TEXT PK          -- 내부 ID
  external_source TEXT NOT NULL    -- seoul_bus | tago | ...
  external_ref    TEXT NOT NULL    -- ARS·nodeId 등
  name            TEXT NOT NULL
  latitude        REAL NOT NULL
  longitude       REAL NOT NULL
  region          TEXT             -- seoul | gyeonggi | ...
  low_floor       INTEGER          -- 저상 여부(알 수 있을 때)
  synced_at       TEXT
```

유니크: `(external_source, external_ref)`

### 캐시 — 도착정보 (실시간)

```text
wayfinder_bus_arrival_cache
  stop_id         TEXT PK
  payload_json    TEXT NOT NULL
  fetched_at      TEXT NOT NULL
  expires_at      TEXT NOT NULL
```

또는 Cloudflare **KV** `bus-arrival:{stopId}` TTL 60s.

### NFC 앵커 (Phase 3, 선택)

`tags` 확장 또는 별도 테이블:

- `wayfinder_bus_stop_id` — 정류장 앵커

---

## 5. API·화면 (구현 대상)

### 공개 API (Edge)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/wayfinder/nearby-bus-stops?lat=&lng=&limit=` | GPS 근처 정류장 |
| GET | `/api/wayfinder/bus-stops/[id]/arrivals` | 정류장 실시간 도착 (캐시) |
| GET | `/api/wayfinder/bus-stops/[id]` | 정류장 상세(이름·좌표·저상) |

### UI

| 화면 | 경로 (안) | 설명 |
|------|-----------|------|
| 동행 메인 확장 | `/wayfinder` 탭 「버스」 | 근처 정류장 + 도착 |
| 정류장 상세 | `/wayfinder/bus-stops/[id]` | 도착 목록·길찾기·TTS |
| 역 연동 (선택) | `/wayfinder/stations/[id]` 하단 | 「근처 버스 정류장」 |

### 서버 라이브러리 (안)

- `src/lib/wayfinder/bus/seoul-bus-client.ts` — 도착·정류장 검색
- `src/lib/wayfinder/bus/nearby-bus-stops.ts` — GPS 거리 정렬
- `src/lib/wayfinder/bus/arrival-cache.ts` — TTL 캐시
- `src/lib/wayfinder/bus/build-bus-speech.ts` — TTS 문구

### 컴포넌트 (안)

- `WayfinderNearbyBusStops.tsx`
- `WayfinderBusStopArrivals.tsx`
- `WayfinderBusStopDetail.tsx`
- `WayfinderMainExperience` — 지하철/버스 탭 또는 섹션 분기

### 관리자 (선택)

- `/admin/wayfinder/bus` — 정류장 마스터 동기화·API 상태 (지하철 동기화 카드 패턴)

---

## 6. 단계별 구현 체크리스트

### Phase B0 — 조사·스펙 (코드 최소)

- [ ] **B0-1** 공공데이터포털 API 목록 확정 (서울 도착·정류장, 경기 후보)
- [ ] **B0-2** 샘플 호출 스크립트·응답 필드 매핑 문서화
- [ ] **B0-3** 일일 트래픽·지연·에러율 POC (정류장 10곳)
- [ ] **B0-4** `external_ref`·ARS 매핑 규칙 확정

**완료 기준:** 서울 정류장 1곳에서 도착 JSON → 화면에 넣을 필드 목록 확정

---

### Phase B1 — 서울 파일럿 (MVP)

- [ ] **B1-1** D1 마이그레이션 `wayfinder_bus_stops` (+ 선택 캐시 테이블)
- [ ] **B1-2** `seoul-bus-client` — 정류장 검색·도착 조회
- [ ] **B1-3** `GET /api/wayfinder/nearby-bus-stops`
- [ ] **B1-4** `GET /api/wayfinder/bus-stops/[id]/arrivals` + 60초 캐시
- [ ] **B1-5** UI: `/wayfinder` 「근처 버스」섹션 (지하철 카드와 동일 패턴)
- [ ] **B1-6** UI: 정류장 상세 — 도착 목록·새로고침·카카오맵 길찾기
- [ ] **B1-7** 교통약자: 저상버스 뱃지 (데이터 있을 때)
- [ ] **B1-8** `WayfinderSpeechAnnouncer` — 정류장·도착 TTS
- [ ] **B1-9** 빈 상태·API 오류·한도 초과 UX
- [ ] **B1-10** `.env.example` · `env.d.ts` 버스 키 주석

**완료 기준:** 실기기 GPS → 근처 정류장 → 도착 1노선 이상 표시 → 카카오맵 길찾기

---

### Phase B2 — 수도권·품질

- [ ] **B2-1** 경기(·인천) API 클라이언트·지역 분기
- [ ] **B2-2** 정류장 마스터 배치 동기화 (관리자 또는 Cron)
- [ ] **B2-3** 「다른 정류장 선택」UI (GPS 오차 보정)
- [ ] **B2-4** 역 상세 「이 역 근처 버스」 (역 좌표 반경 검색)
- [ ] **B2-5** 동기화·호출 리포트 (`/admin/wayfinder` 통합 또는 bus 전용)
- [ ] **B2-6** 접근성: 고대비·큰 글자·포커스 (Phase E와 통합)

**완료 기준:** 서울·경기 각 1정류장에서 도착 표시 · 역 1곳 근처 버스 링크

---

### Phase B3 — NFC·운영 (선택)

- [ ] **B3-1** `tags.wayfinder_bus_stop_id` 마이그레이션
- [ ] **B3-2** `/t/[tag_id]` → 정류장 상세 리다이렉트
- [ ] **B3-3** 관리자 인벤토리 — 정류장 앵커 지정 UI
- [ ] **B3-4** Cron/KV 캐시 워밍(혼잡 정류장, 선택)

---

### Phase B4 — 심화 (장기)

- [ ] **B4-1** 지하철역 ↔ 버스 정류장 환승 힌트 (수동·공공 데이터)
- [ ] **B4-2** Web Push 도착 임박 (보호자 푸시 인프라 검토)
- [ ] **B4-3** TAGO 등 통합 정류장 검색으로 API 단순화 검토

---

## 7. 공공 API 후보 (신청 시 참고)

| 구분 | 출처(예) | 비고 |
|------|----------|------|
| 서울 버스 도착 | data.go.kr · 서울시/서울교통 | 파일럿 1순위 |
| 경기 버스 | 경기도 버스정보 | Phase B2 |
| 정류장 좌표 | TAGO · 지자체 정류장 API | 근처 검색 보조 |
| 전국 통합 | 국토부 TAGO | 스펙·필드 확인 후 |

※ 정확한 데이터셋 ID·엔드포인트는 **B0 조사** 때 확정하고 본 문서 §8에 기록.

---

## 8. API 확정 기록 (B0 이후 채움)

| 항목 | 값 |
|------|-----|
| 데이터셋명 | _(미정)_ |
| 활용 신청 URL | _(미정)_ |
| Base URL | _(미정)_ |
| 정류장 ID 필드 | _(미정)_ |
| 도착 응답 필드 | _(미정)_ |
| 일일 호출 한도 | _(미정)_ |

---

## 9. 리스크·제약

1. **지역 분산** — API·키·스펙이 지자체마다 다름  
2. **실시간 한도** — 사용자 증가 시 캐시·배치 필수  
3. **GPS 오차** — 잘못된 정류장 선택 가능 → 수동 변경 UI  
4. **지하철 로드맵과 리소스** — C3·역내 안내 미완 시 버스 착수 지연 권장  
5. **카카오맵** — 버스 실시간 노선도 미제공, **도착만 자체 UI**

---

## 10. 착수 순서 (권장)

```text
[현재] 지하철 C3 NFC 앵커 · B3 승강기 · D 역내 안내
    ↓
[B0] API 조사·POC (1주)
    ↓
[B1] 서울 파일럿 (2~3주)
    ↓
[B2] 수도권·역 연동 (2주)
    ↓
[B3~B4] NFC·푸시·환승 (선택)
```

---

## 11. 구현 항목 요약표 (백로그 ID)

| ID | 항목 | Phase |
|----|------|-------|
| B0-1~4 | API 조사·스펙 | B0 |
| B1-1 | D1 `wayfinder_bus_stops` | B1 |
| B1-2 | 서울 bus client | B1 |
| B1-3~4 | nearby-bus-stops · arrivals API | B1 |
| B1-5~6 | wayfinder UI · 정류장 상세 | B1 |
| B1-7~9 | 저상·TTS·에러 UX | B1 |
| B1-10 | env 문서 | B1 |
| B2-1~6 | 수도권·역 연동·운영 | B2 |
| B3-1~4 | NFC 앵커·Cron | B3 |
| B4-1~3 | 환승·푸시·TAGO | B4 |

---

## 12. 문서 갱신

버스 착수 시:

- [ ] 본 문서 §8 API 확정 기록 채우기  
- [ ] [`WAYFINDER_SUBWAY_NAV.md`](./WAYFINDER_SUBWAY_NAV.md) — 「5단계 버스」절 추가  
- [ ] [`WAYFINDER_HANDOFF.md`](./WAYFINDER_HANDOFF.md) — 백로그 링크  
- [ ] [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) — 동행 표에 버스 행 추가  
