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
| UI | `WayfinderSeoulCompanionPromo` · `WayfinderAccessibleRoutingSection` |
| 메인 | `/wayfinder` 상단 — 설치 CTA·이용 3단계·기능 칩 |
| 역 상세 | 링크유 고유 기능 허브만 (`WayfinderStationLinkuFeatures`) · 서울동행맵 미노출 |
| 메인 `/wayfinder` | 서울동행맵 프로모 (`WayfinderSeoulCompanionPromo`) |
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
- `src/lib/wayfinder/seoul-companion-app-launch.ts`
- `src/components/wayfinder/WayfinderSeoulCompanionLaunchButton.tsx`

---

## 5. 법·운영 주의사항 (아웃바운드 연동)

> **법률 자문이 아님.** 제품·운영 판단용 내부 메모. 규모 확대·제휴 전에는 서울시·앱 운영 측 확인을 권장한다.

### 5.1 현재 연동 범위 (허용되는 일반적 패턴에 가깝음)

| 허용에 가까운 것 | 하지 않는 것 |
|------------------|--------------|
| 공식 스토어(Play·App Store·원스토어) 링크 | 서울동행맵 **데이터·지도·경로 API** 무단 수집·재배포 |
| 사용자 기기에서 **앱 실행** 시도 (딥링크·Intent) | 서울동행맵 UI·기능을 링크유 화면 **내에 임베딩** |
| 「역 시설은 링크유 · 맞춤 경로는 서울동행맵」 **역할 분리** 안내 | 「서울시 **공식 제휴**」 등 **오해 소지** 문구 |
| 역 상세(`/wayfinder/stations/...`)는 **링크유 전용** | 서울시·동행맵 **로고·상표**를 공식처럼 사용 |

**공공·무료 앱**이라도 이용약관·저작권·상표 정책이 적용될 수 있다. 「공공 = 무제한 통합 가능」은 아니다.

### 5.2 UI·문구 원칙

- **추천·연결** 수준: 「서울시 제공 앱」「스토어에서 설치」「앱 실행」
- **금지에 가까운 표현:** 「공식 제휴」「서울시 인증」「동행맵 대체 서비스」
- 카카오맵과 동일하게 **참고·보조** 역할만 강조

### 5.3 기술·딥링크

- **Android:** APK 기준 **공개 딥링크 스킴 없음** → `MainActivity` component intent 로 실행 (`kr.go.seoul.mydata/kr.go.seoul.mydata.MainActivity`). `mydata://`·`package` 만 있는 intent 는 Play 로 빠지거나 무응답일 수 있음 (`browser_fallback_url`·2.8초 스토어 자동 이동 미사용)
- **iOS·보조:** 커스텀 스킴은 **공개 문서 미확인** (`NEXT_PUBLIC_SEOUL_COMPANION_LAUNCH_URL` 로 덮어쓰기 가능)
- 미설치 시 설치는 UI 하단 Play·App Store·원스토어 링크 사용 (`allowStoreFallback` 옵션만 스토어 자동 이동)
- 설치 여부는 웹에서 직접 조회 불가 → 실행 성공(화면 전환) 시 localStorage 힌트
- **R2** 착수 시: 서울시·운영사 **공식 딥링크** 확보 후 스킴 env 반영

### 5.4 확인이 필요한 시점 (체크리스트)

- [ ] 서울동행맵 **API**로 경로·POI를 링크유에 표시할 때
- [ ] 서울시·동행맵 **로고·명칭**을 마케팅·스플래시에 사용할 때
- [ ] 「공식 제휴」·공동 브랜딩을 대외 홍보할 때
- [ ] 상업적 유료 기능과 **묶어 판매**할 때

**문의 시 준비:** 연동 목적(교통약자 보조), 화면 캡처, 아웃바운드만 하는지·데이터 사용 여부.
