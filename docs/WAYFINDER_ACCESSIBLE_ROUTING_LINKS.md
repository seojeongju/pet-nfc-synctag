# 링크유-동행 — 교통약자 맞춤 경로 연동 (서울동행맵)

**상태:** R1 완료 (서울동행맵 아웃바운드) · R2~ 추후  
**관련:** [`WAYFINDER_SUBWAY_NAV.md`](./WAYFINDER_SUBWAY_NAV.md) · [`WAYFINDER_BUS_REALTIME_PLAN.md`](./WAYFINDER_BUS_REALTIME_PLAN.md)

---

## 1. 역할 분리

| 담당 | 서비스 | 내용 |
|------|--------|------|
| **링크유-동행** | 자체 | GPS·지하철역·역 내 **교통약자 편의시설**(엘리베이터·화장실 등) |
| **서울동행맵** | 서울시 앱 | 서울 **단차·경사·보도폭** 반영 보행, 저상버스, 지하철 시설 |
| **카카오맵 link/to** | 참고 | 역·시설 **좌표까지** 일반 길찾기 (휠체어 전용 경로 아님) |

> 카카오맵 **무장애나눔길**(숲길·둘레길)은 지하철 이동 안내와 무관하여 **연동하지 않음**.

---

## 2. R1 구현 (완료)

| 항목 | 내용 |
|------|------|
| 라이브러리 | `src/lib/wayfinder/accessible-routing-links.ts` |
| UI | `WayfinderAccessibleRoutingSection` |
| 메인 | `/wayfinder` — 서울동행맵(스토어) |
| 역 상세 | 서울 좌표 역 — 서울동행맵 카드 |
| 서울 판별 | `isInSeoulMetroBounds(lat, lng)` |

---

## 3. 추후 (R2~)

- [ ] **R2** 서울동행맵 딥링크·API 제휴 (공개 시)
- [ ] **R3** GPS 기반 메인 화면에서 서울동행맵 카드만 서울일 때 노출 (NearbyStations 좌표 상향)

---

## 4. 코드 위치

- `src/components/wayfinder/WayfinderMainExperience.tsx`
- `src/components/wayfinder/WayfinderStationDetail.tsx`
- `src/lib/wayfinder/accessible-routing-links.ts`
