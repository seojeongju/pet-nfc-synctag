# 링크유-동행 — 자주 가는 장소 (스팟 CRUD 대체) 고도화 계획

**상태:** 백로그 (구현 보류) · **우선순위:** 동행 독립 레인 안정화 · 역 시설·서울동행맵 연동 고도화 **이후**  
**작성:** 2026-05  
**관련:** [`WAYFINDER_SUBWAY_NAV.md`](./WAYFINDER_SUBWAY_NAV.md) · [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) · [`WAYFINDER_HANDOFF.md`](./WAYFINDER_HANDOFF.md)

---

## 0. 배경·합의

### 제품 방향 (합의)

- **보호자 대시보드**(`/dashboard/companion`)에서 **스팟 직접 생성·slug·발행 UI는 제거**하는 방향이 타당하다.
- 대신 이용자가 **자주 가는 장소**(집, 병원, 단골 역 등)를 등록·빠르게 열 수 있는 **「즐겨찾기」** 를 동행의 개인 설정으로 둔다.
- 동행의 **메인 가치**는 변하지 않음: **GPS → 근처 지하철역 → 역 안 시설·경로** (+ 서울동행맵 아웃바운드).

### 현행(2026-05)과의 관계

| 항목 | 현재 구현 | 본 계획 이후(목표) |
|------|-----------|-------------------|
| 대시보드 경로 | `/dashboard/companion/wayfinder` | 유지. 스팟 섹션 → **즐겨찾기** 로 교체 |
| `wayfinder_spots` | 보호자 CRUD + `/wayfinder/s/{slug}` | **개인 CRUD 중단**. 시설·조직용은 Phase 2~3에서 정책 결정 |
| NFC 기본 | `/wayfinder?from=nfc` (GPS) | 유지·강화 |
| 역 앵커 | `tags.wayfinder_station_id` | 유지 |
| `subject_kind` | `companion` (D1 `0041`) | 즐겨찾기는 **별 테이블** — 스팟과 합치지 않음 |

**구현 시점:** 본 문서는 **개발 계획만** 보관. 착수는 제품·운영 합의 후 별도 이슈/스프린트에서 연다.

---

## 1. 목표·범위

### 1차 목표 (MVP)

| 포함 | 제외 (추후) |
|------|-------------|
| 로그인 사용자 **자주 가는 장소** 최대 N개(예: 5) | 조직 공유 즐겨찾기 |
| 별칭(집, 병원), **좌표** 또는 **역 ID** 연결 | 주소 자동완성 API |
| `/wayfinder` 상단 「자주 가는 곳」 칩 → 역 상세·길찾기 | 푸시·도착 알림 |
| 대시보드 companion에서 추가·수정·삭제·순서 | 스팟 slug 공개 페이지 신규 생성 |

### 스팟(wayfinder_spots) 처리 원칙

| 레이어 | Phase 1 | Phase 2~3 |
|--------|---------|-----------|
| **보호자 UI** | 스팟 등록·목록·편집 **숨김/삭제** | — |
| **공개 `/wayfinder/s/{slug}`** | **유지** (기존 URL·태그 깨짐 방지) | 미사용 데이터 정리·리다이렉트 검토 |
| **어드민·조직** | 변경 없음(필요 시만) | B2B 전용 스팟·역 POI만 남길지 결정 |
| **NFC 인벤토리** | 동행 태그 기본 URL = `/wayfinder` | 스팟 연결은 **관리자·시설** 워크플로만 |

---

## 2. 전제 조건 (착수 전)

- [ ] 동행 **독립 레인**(`/dashboard/companion`) 배포·운영 1~2주 안정화
- [ ] `/wayfinder` GPS·근처 역·역 상세 Sprint 안정화 (빈 상태·오류 UX)
- [ ] 기존 **스팟·NFC** 사용량 조사 (DB `wayfinder_spots` 건수, `tags.wayfinder_spot_id` 연결 수)
- [ ] 법·운영: 즐겨찾기 좌표 저장 = 개인정보 처리 방침 문구 ([`WAYFINDER_ACCESSIBLE_ROUTING_LINKS.md`](./WAYFINDER_ACCESSIBLE_ROUTING_LINKS.md) §5 참고)
- [ ] Play 스토어 미배포 전제 유지 — 웹·NFC 중심 ([`app-distribution.mdc`](../.cursor/rules/app-distribution.mdc))

---

## 3. 데이터 모델 (안)

### 신규 D1 — 개인 즐겨찾기 (스팟 테이블과 분리)

```text
companion_saved_places
  id              TEXT PK
  user_id         TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
  tenant_id       TEXT NULL REFERENCES tenants(id) ON DELETE SET NULL  -- 개인 NULL, 조직 확장 시
  label           TEXT NOT NULL          -- "집", "단골 병원" (최대 40자)
  kind            TEXT NOT NULL          -- station | coordinates | address (1차: station + coordinates)
  station_id      TEXT NULL              -- wayfinder_stations.id
  latitude        REAL NULL
  longitude       REAL NULL
  floor_label     TEXT NULL              -- 선택: "2호선 환승 통로" 등 메모
  sort_order      INTEGER NOT NULL DEFAULT 0
  created_at      DATETIME
  updated_at      DATETIME

INDEX (user_id, tenant_id, sort_order)
```

**규칙 (안):**

- `kind = station` → `station_id` 필수, lat/lng는 역 좌표로 UI 표시(스냅샷 저장은 선택).
- `kind = coordinates` → lat/lng 필수.
- 사용자당 개인(tenant_id NULL) 최대 **5**건 — 서버·UI 동일 검증.

### wayfinder_spots (기존)

- Phase 1에서 **신규 INSERT 경로(보호자 액션)만 제거**.
- 스키마·공개 API·어드민 연동은 당분간 유지.

---

## 4. API·서버 (안)

| 메서드 | 경로 | 용도 |
|--------|------|------|
| GET | `/api/companion/saved-places` | 목록 (세션) |
| POST | `/api/companion/saved-places` | 추가 |
| PATCH | `/api/companion/saved-places/[id]` | 수정·순서 |
| DELETE | `/api/companion/saved-places/[id]` | 삭제 |

- Edge Route Handler, `getAuth` 세션 필수.
- `tenant` 쿼리는 Phase 2(조직)까지 **개인만**.

**코드 위치 (안):**

- `src/lib/companion/saved-places-db.ts`
- `src/app/actions/companion-saved-places.ts` (또는 Route Handler만)

---

## 5. UI·UX (안)

### `/wayfinder` (공개·로그인 선택)

- 로그인 시: 헤더 아래 **가로 스크롤 칩** — 저장된 `label` 탭.
- 탭 동작:
  - `station` → `/wayfinder/stations/[id]` (+ 기존 facility 쿼리 확장은 추후)
  - `coordinates` → 근처 역 재검색 또는 카카오맵 길찾기 프리셋
- 비로그인: 칩 숨김, GPS 메인만 (현행 유지).

### `/dashboard/companion/wayfinder`

- **「시설·지점 스팟 · NFC」** 섹션 제거.
- **「자주 가는 장소」** 카드:
  - 목록 · 추가 · 편집 · 삭제 · 드래그 정렬(선택)
  - 추가 UX: 「지금 GPS」 / 「역 검색·선택」 (1차는 역 검색 또는 근처 역에서 「즐겨찾기에 추가」)
- 빠른 링크: 공개 `/wayfinder` 열기 (유지).

### NFC

- 동행 전용 태그 NDEF: **`/wayfinder?from=nfc&tag=…`** 유지.
- 스캔 후: GPS 근처 역 + (로그인 시) 즐겨찾기 섹션 노출.
- **스팟 slug URL 신규 발급**은 보호자 UI에서 중단; 어드민만 유지(Phase 2).

---

## 6. 구현 Phase

### Phase 1 — 개인 즐겨찾기 MVP

- [ ] D1 마이그레이션 `companion_saved_places`
- [ ] CRUD API + 대시보드 UI
- [ ] `/wayfinder` 즐겨찾기 칩
- [ ] 대시보드에서 **스팟 등록 UI·액션 제거** (읽기 전용 안내 또는 완전 제거)
- [ ] `revalidatePath` · copy 정리 (`linkuCompanionSpotSubLabel` 등 문구 변경)
- [ ] QA: 로그인/비로그인, tenant 없음, 5개 상한, 역 삭제·미존재 station_id

### Phase 2 — NFC·운영 정리

- [ ] 인벤토리·벌크 등록: 동행 태그 기본 URL 문서·UI 통일
- [ ] 어드민: 스팟 연결은 **시설/플랫폼** 워크플로만 노출
- [ ] (선택) 근처 역 카드에서 「즐겨찾기 추가」 원탭

### Phase 3 — 레거시 스팟 정리

- [ ] `wayfinder_spots` 미사용·미발행 데이터 리포트
- [ ] `/wayfinder/s/{slug}` 410 vs 301 정책 (태그·외부 링크 조사 후)
- [ ] `tags.wayfinder_spot_id` 신규 연결 중단 여부 결정

---

## 7. 제거·변경 파일 (착수 시 참고)

| 영역 | 변경 |
|------|------|
| UI | `WayfinderDashboardSpotSection.tsx` 제거 또는 즐겨찾기 컴포넌트로 교체 |
| 액션 | `wayfinder-spots.ts` create/update — 보호자 경로 비활성 |
| 라우트 | `companion/wayfinder/[spotId]/edit` — 제거 또는 어드민 전용 |
| 문서 | `WAYFINDER_SUBWAY_NAV.md` 스팟=보조·B2B 명시 |
| 마이그레이션 | `0042_companion_saved_places.sql` (번호는 착수 시 확정) |

**유지:** `resolve-nfc-entry.ts`, `getPublishedWayfinderSpotBySlug`, admin NFC write, `/wayfinder/s/[slug]`.

---

## 8. 완료 기준 (MVP)

1. 로그인 보호자가 **자주 가는 장소 3종**(역·좌표 등)을 저장·삭제할 수 있다.
2. `/wayfinder` 에서 칩 한 번으로 **역 상세 또는 길찾기**에 진입할 수 있다.
3. 보호자 대시보드에 **스팟 slug 등록 폼이 없다**.
4. 기존에 발행된 `/wayfinder/s/{slug}` 및 연결된 NFC는 **동작한다**.
5. `npm run typecheck` · D1 마이그레이션 스크립트 `package.json` 반영.

---

## 9. 추적

| ID | 항목 | Phase |
|----|------|-------|
| SP-1 | D1 `companion_saved_places` | 1 |
| SP-2 | saved-places API | 1 |
| SP-3 | companion 대시보드 UI | 1 |
| SP-4 | `/wayfinder` 칩 | 1 |
| SP-5 | 스팟 CRUD UI 제거 | 1 |
| SP-6 | NFC·인벤토리 문서 | 2 |
| SP-7 | 레거시 스팟 정책 | 3 |

**착수 트리거 예:** 동행 MAU·NFC 스캔 데이터 확보 후, 스팟 self-serve 사용률이 낮다고 확인될 때.
