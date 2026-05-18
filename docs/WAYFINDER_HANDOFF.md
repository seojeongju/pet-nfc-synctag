# 링크유-동행 Wayfinder — 작업 백업·이어하기

**백업 시점:** 2026-05-18  
**브랜치:** `main`  
**체크포인트 커밋:** `068325a` — `feat(wayfinder): 역 상세 지도·시설 POI, NFC 역 앵커, 동기화 리포트`  
**Git 태그:** `wayfinder-handoff-2026-05-18`

---

## 1. 완료된 작업 요약

### Phase A — 역 상세 지도·시설 POI
- `WayfinderStationExperience` — 지도·목적지·TTS·시설 선택 통합
- `WayfinderStationMap` — 다중 시설 마커, InfoWindow, 좌표 없을 때 역 중심 오프셋
- `WayfinderStationAccessibility` — 시설 클릭 ↔ 지도, 시설별 카카오 길찾기
- `src/lib/wayfinder/facility-map-layout.ts` — `buildFacilityMapPoints`, `buildDestinationPresets`, TTS 문구

### Phase B (부분) — 운영
- `migrations/0039_wayfinder_sync_meta.sql` — Cron offset (`wayfinder_sync_meta`)
- `GET /api/cron/wayfinder-sync-accessibility` — `CRON_SECRET` (선택)
- `GET /api/admin/wayfinder/sync-report` + `WayfinderSyncReportCard`
- D1 **0039·0040 원격 적용 완료** (2026-05-18)

### Phase C (부분) — NFC 역 앵커
- `migrations/0040_tags_wayfinder_station_anchor.sql` — `tags.wayfinder_station_id`, `wayfinder_facility_id`
- `/t/[tag_id]` → 역 앵커 시 `/wayfinder/stations/[id]?facility=…`
- `resolveWayfinderNfcEntry` + `WayfinderStationAnchorCard` on `/wayfinder`

### 배포
- `main` 푸시됨 → GitHub Actions **Deploy Cloudflare Pages** 자동 배포

---

## 2. 환경·마이그레이션

| 항목 | 상태 |
|------|------|
| D1 `0038` wayfinder_station_facilities | 적용됨 (이전) |
| D1 `0039` wayfinder_sync_meta | **원격 적용됨** |
| D1 `0040` tags 역·시설 앵커 | **원격 적용됨** |
| `PUBLIC_DATA_API_KEY` | Pages에 설정 (동기화용) |
| `CRON_SECRET` | **미설정 OK** — 수동 동기화만 쓸 때 불필요 |

로컬/재적용 스크립트:

```bash
npm run d1:apply:wayfinder-sync-meta
npm run d1:apply:tags-wayfinder-station-anchor
```

(`--file` 실패 시 이전처럼 `wrangler d1 execute ... --command "..."` 사용)

---

## 3. 다음 작업 (우선순위)

### 즉시 (운영·QA, 코드 없음)
1. `/admin/wayfinder` → **수도권 전체** 동기화 완료
2. 실기기: GPS → 역 상세 → 마커·길찾기·TTS
3. 역 앵커 테스트 (SQL):
   ```sql
   UPDATE tags SET wayfinder_station_id = 'seoul-station' WHERE id = '태그UID';
   ```

### 추후 — 공공버스 실시간 도착

- 전체 계획·구현 체크리스트: [`WAYFINDER_BUS_REALTIME_PLAN.md`](./WAYFINDER_BUS_REALTIME_PLAN.md)  
- 착수 시점: 지하철 C3·운영 안정화 **이후** (Phase B0 API 조사부터)

### R1 완료 — 서울동행맵 연동

- [`WAYFINDER_ACCESSIBLE_ROUTING_LINKS.md`](./WAYFINDER_ACCESSIBLE_ROUTING_LINKS.md) — 역할 분리·코드 위치·**§5 법·운영 주의사항**

### 다음 스프린트 (코드) — **C3 추천**
| ID | 작업 | 주요 파일 |
|----|------|-----------|
| C3 | 관리자 태그 UI에 역·시설 앵커 입력 | `TagProductRow.tsx`, `admin.ts` `updateTagProductProfile` |
| C4 | NDEF·인벤토리와 역 앵커 정합 | `TagBulkRegisterCard`, `native-write` |
| B3 | 승강기 가동현황 API | 새 client + 시설 카드 `operationLabel` |
| B5 | `external_ref` 역코드 매핑 | `wayfinder_stations`, sync |
| — | Cron 주기 동기화 | Cloudflare Cron + `CRON_SECRET` |
| D | 역내 단계 안내 카드 | `parse-guide-steps` 패턴 재사용 |
| E | 접근성·이벤트 집계 | TTS·포커스·익명 로그 |

### 문서
- [ ] `WAYFINDER_SUBWAY_NAV.md` 체크리스트 갱신 (2·3·4단계 부분 완료 반영)

---

## 4. 핵심 경로·API

| 용도 | 경로 |
|------|------|
| 동행 메인 | `/wayfinder` |
| 역 상세 | `/wayfinder/stations/[id]?facility=` |
| 관리자 동기화 | `/admin/wayfinder` |
| 동기화 API | `POST /api/admin/wayfinder/sync-accessibility` |
| 동기화 리포트 | `GET /api/admin/wayfinder/sync-report` |
| Cron (선택) | `GET /api/cron/wayfinder-sync-accessibility` |

파일럿 역 ID: `seoul-station`, `gangnam-station`, `jamsil-station`, `hongdae-station`

---

## 5. 이어서 작업할 때

```bash
git checkout main
git pull
git checkout wayfinder-handoff-2026-05-18   # 또는 git checkout 068325a
```

AI/개발 재개 시 이 파일과 `docs/WAYFINDER_SUBWAY_NAV.md`를 함께 참고.

**권장 첫 문장:** 「`docs/WAYFINDER_HANDOFF.md` 기준으로 Phase C3 관리자 태그 역·시설 앵커 UI부터 이어서 구현해줘」

---

## 6. 관련 커밋 이력 (최근)

| 커밋 | 내용 |
|------|------|
| `068325a` | 지도·시설 POI, NFC 앵커, 동기화 리포트 |
| `7b30691` | 수도권 전체 배치 동기화 |
| `f165ac6` | 교통약자 공공 API + 관리자 동기화 UI |
| `91bf5c0` | 수도권 615역 GPS 근처 역 |
