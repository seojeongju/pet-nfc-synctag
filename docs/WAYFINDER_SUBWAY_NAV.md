# 링크유-동행 — 지하철·교통약자 이동 안내 개발 방향

**상태:** 진행 중 · **순서대로** 단계별 구현  
**맵:** 카카오맵(프로젝트 기존 연동) · **위치:** 모바일 GPS · **데이터:** 파일럿 역 → 추후 공공데이터 API

---

## 1. 제품 목표 (합의)

**대상:** 휠체어 이용자, 시각장애인, 유모차 동반 보호자 등 **교통약자**

**장면:** **지하철역·역사** 인근·역내

**진입:**

1. **GPS**로 현재 위치 근처 **지하철역** 식별 (1차)
2. (선택) **NFC 태그**로 “지금 이 지점” 보정·세밀 안내
3. **카카오맵**으로 역·시설 위치·**이동 방향** 표시
4. (추후) **공공데이터 API**로 역·승강시설(엘리베이터·에스컬레이터 등) 정확도·갱신

**핵심 플로우:**

```text
[모바일 GPS] → 근처 지하철역
      ↓
[역 선택] → 역 중심 카카오맵 + (단계적으로) 시설 POI
      ↓
[NFC 태그] → 앵커 지점 안내 (기존 /wayfinder/s/{slug} · 인벤토리 연동)
      ↓
(추후) 목적지·경로·공공데이터 시설 레이어
```

**현재 구현과의 관계**

| 이미 있음 (운영·인프라) | 본 제품 (순차 구현) |
|-------------------------|---------------------|
| 동행 스팟 CRUD, NFC 인벤토리 ↔ 스팟 URL | GPS → **근처 역** (1단계) |
| **방문자 스팟 UX** (`/wayfinder/s/{slug}`) | 역 단위 **시설 POI** (2단계) |
| 카카오맵 SDK·`/api/kakao-map-config` | 역·스팟 **맵·길찾기** 강화 |
| | 공공데이터 API 연동 (4단계) |

**두 갈래 진입**

- **NFC·QR** → 발행된 스팟 URL → **0단계 방문자 UX** (지점 고정 안내)
- **GPS** → 근처 역 → **1~4단계** (역·시설·공공데이터)

---

## 2. 단계별 로드맵

### 0단계 — 방문자 스팟 UX (NFC·QR 공개 페이지)

**목표:** 태그를 스캔한 교통약자·동반자가 **읽기·듣기·연락·지도**로 즉시 도움을 받도록 한다.

**URL:** `/wayfinder/s/{slug}` (발행된 스팟만 전체 안내 · 미발행은 안내 화면)

| 기능 | 설명 |
|------|------|
| 음성 안내 | Web Speech API (`WayfinderSpeechAnnouncer`) — 제목·층·요약·상세·연락처 TTS |
| 이용 단계 | `guide_text`에서 `1. …` / `2. …` 또는 `①②③` 줄 → 단계 카드 (2개 이상) |
| 연락처 | `contact_phone` → 전화·문자 CTA (`tel:` / `sms:`) |
| 지도 | 좌표 있으면 카카오맵 **임베드** + 「지도 열기」「길찾기」 링크 |
| 미발행 | slug는 있으나 `is_published=0` → `WayfinderSpotUnpublished` |
| 보호자 입력 | 대시보드 스팟 등록·수정 폼 — 연락처·단계 형식 placeholder |

**데이터·API**

- DB: `wayfinder_spots.contact_phone` — `migrations/0035_wayfinder_spot_contact_phone.sql`
- 공개 API: `GET /api/wayfinder/public/spot/[slug]` — `contactPhone` 포함
- 서버 액션: 생성·수정 시 `revalidatePath(/wayfinder/s/{slug})`

**완료 기준:** 발행 스팟 1개 — TTS·단계 2개 이상·전화 버튼·좌표 시 지도·미발행 분기 확인

**관련 코드**

- `src/components/wayfinder/WayfinderPublicSpotView.tsx`
- `src/lib/wayfinder/parse-guide-steps.ts`, `build-public-speech.ts`, `normalize-contact-phone.ts`

---

### 1단계 — GPS + 근처 지하철역

**목표:** 공공 API 없이 파일럿 역 좌표로 “가까운 역” UX 검증

- DB: `wayfinder_stations` (역 ID, 이름, 노선, 위·경도, `external_ref` 예약)
- API: `GET /api/wayfinder/nearby-stations?lat=&lng=&limit=`
- UI: `/wayfinder` — 위치 허용 → 근처 역 목록(거리 m) → 역 상세 `/wayfinder/stations/[id]`
- 역 상세: 카카오맵(단일 마커) + 카카오맵 앱/웹 길찾기 링크

**완료 기준:** 실제 기기 GPS로 파일럿 역 3~5개 중 가장 가까운 역 표시·지도 확인 가능

**마이그레이션:** `0036_wayfinder_stations.sql`, `0037_wayfinder_stations_pilot_seed.sql`

---

### 2단계 — 카카오맵 역·시설·목적지

**목표:** 선택 역 기준 맵 UX 강화

- `wayfinder_station_facilities` — elevator / escalator / stairs / platform / exit 등
- 역 상세 맵에 **시설 마커** 다중 표시
- 목적지(출구·환승·승강장) 선택 → 카카오 **길찾기** 링크 또는 SDK 경로
- 접근성: 휠체어·시각 장애 친화는 “참고 경로” 문구와 음성(TTS) 병행

**완료 기준:** 1개 파일럿 역에서 시설 5개 이상 지도 표시 + 목적지 1곳 길찾기

---

### 3단계 — NFC 앵커

**목표:** 태그 = 역·구역 앵커

- `nfc_anchors` 또는 `tags` 확장: UID ↔ `station_id` / `facility_id`
- NFC 스캔 시 GPS 대신·보완하여 “엘리베이터 앞” 등 고정 안내
- 인벤토리·NDEF URL과 역/POI ID 정합

**완료 기준:** 특정 UID 태그 → 해당 앵커 안내 + 맵 중심 이동

---

### 4단계 — 공공데이터 API

**목표:** 전국 역·장애인 편의 시설 동기화

- `external_ref`에 공공데이터 키 저장
- 배치/관리자 동기화 job (역·시설 upsert)
- 1~3단계 스키마 유지, **데이터 소스만 교체**

**완료 기준:** 파일럿 역을 공공데이터로 대체해도 UX 동일

---

## 3. 데이터 모델 (목표)

```text
wayfinder_stations          — 역 (이름, 노선, lat/lng, external_ref)
wayfinder_station_facilities — 역 소속 POI (종류, lat/lng, 층, 접근성)
tags / nfc_anchors          — UID ↔ station 또는 facility (3단계)
wayfinder_spots             — 기존 스팟(콘텐츠·NFC URL) — 점진 흡수 또는 병행
```

---

## 4. 기술 전제

| 항목 | 방침 |
|------|------|
| 위치 | 브라우저 `navigator.geolocation` (HTTPS) |
| 맵 | 카카오맵 JS SDK — `/api/kakao-map-config`, 기존 `GeofenceMapPicker` 패턴 |
| 서버 | Cloudflare D1, Edge API |
| 공공데이터 | **4단계** — API 키·스펙 확정 후 `external_ref` 매핑 |

---

## 5. 파일럿 역 (초기 시드)

| ID | 역명 | 비고 |
|----|------|------|
| `seoul-station` | 서울역 | 1·4호선 등 |
| `gangnam-station` | 강남역 | 2·신분당 |
| `jamsil-station` | 잠실역 | 2·8호선 |
| `hongdae-station` | 홍대입구 | 2·공항철도·경의중앙 |

좌표는 시드 SQL 참고. 운영 시 D1에 마이그레이션 적용 필요.

---

## 6. 진행 체크리스트

- [x] 본 문서 작성
- [x] **0단계** 방문자 스팟 UX (코드 · D1 `0035` 적용)
- [x] **1단계** DB·API·`/wayfinder`·`/wayfinder/stations/[id]` (D1 `0036`·`0037` 적용)
- [ ] **2단계** 시설 POI·맵 마커·길찾기
- [ ] **3단계** NFC 앵커
- [ ] **4단계** 공공데이터 연동

---

## 7. 관련 코드·문서

- `src/lib/wayfinder/` — 기능 플래그·지오·카피
- `src/lib/wayfinder-stations-db.ts` — 역 조회
- `src/app/wayfinder/` — 공개 진입
- `docs/WAYFINDER_SUBWAY_NAV.md` — **본 문서 (마스터)**
- 기존 스팟: `wayfinder_spots`, `/wayfinder/s/[slug]`, `migrations/0033_*`, `0035_*`
