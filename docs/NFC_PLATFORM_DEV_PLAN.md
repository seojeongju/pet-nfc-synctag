# NFC 통합 서비스 플랫폼 — 개발 계획서 (v0.2)

> 상태: 계획 확정 전 초안 · §9 결정 사항 합의 후 v1.0
> 선행 문서: [`NFC_INTEGRATED_PLATFORM_PROPOSAL.md`](./NFC_INTEGRATED_PLATFORM_PROPOSAL.md) (v0.1 — IA·랜딩·디자인 구상)
> 이 문서는 v0.1을 **실행 계획**으로 구체화하고, **AI 3D 생성 API**와 **wow3dp.co.kr 자동견적 연동**을 추가한다.
> 작성일: 2026-11-13

---

## 1. 요구사항 정리

| # | 요구사항 | 이 계획에서의 해석 |
|---|---|---|
| R1 | Link-U 위치추적 시스템을 통합시스템의 **하나의 서비스**로 | 현 홈(5모드 + 동행)을 `/linku` 서비스 섹션으로 이동. 기존 URL(`/t/*`, `/pet` 등, `/dashboard/*`)은 그대로 둔다 |
| R2 | 다양한 NFC 기능을 담는 **메인페이지** | `/`에 플랫폼 랜딩을 새로 만든다. **서비스 레지스트리**(코드 상수 → 이후 DB) 기반으로 서비스 카드를 늘려 간다 |
| R3 | 사용자가 서비스를 고른 뒤 **커스터마이징 태그 제작 요청** | `/studio` 제작 마법사: 서비스 → 폼팩터 → 디자인 → 프리뷰 → 견적 → 요청 |
| R4 | 태그 제작에 **AI API**(3D 모델링, 프리뷰) 연결 | 파라메트릭 3D 생성(결정적·출력 보장)을 기본으로 하고, AI image/text→3D는 장식용으로 붙인다. 프리뷰는 three.js |
| R5 | **wow3dp.co.kr 자동견적** 연동 | `QuoteProvider` 어댑터를 둔다. 1차는 핸드오프(딥링크), 2차는 파트너 API(서버 간 통신) |

---

## 2. 현황 (코드 기준)

| 영역 | 현황 | 재사용 |
|---|---|---|
| 스택 | Next.js 15 App Router, edge runtime, Cloudflare Pages + D1 + R2, Better Auth | 그대로 |
| 홈 `/` | `MultiModeHomeClient` — 5모드(pet/elder/child/luggage/gold) + 동행 타일 | `/linku`로 이동 |
| 태그 해석 | `/t/[tag_id]` → 미연결 태그는 `/?tag=…&action=activate` | 활성화 리다이렉트를 `/linku`로 넘김 |
| 쇼핑 | `shop_products`, `shop_orders`(배송지 포함, 결제 pending), 관리자 상품·주문 | 제작 주문을 `shop_orders`에 연결 |
| NFC 쓰기 | Web NFC + Android native handoff, 관리자 인벤토리·UID 등록 | 제작 완료 태그 UID 예약·기록에 사용 |
| Android 앱 | URL/명함/SMS/Wi-Fi/블루투스 NDEF 도구 | 웹 "범용 NFC 서비스" 카탈로그의 기반 |
| R2 | 상품 이미지 업로드 `/api/r2/[...key]` | 디자인 에셋·STL/GLB 저장 |

### wow3dp.co.kr 자동견적 (공개 페이지 기준 조사)
- 입력: STL·OBJ·3MF·PLY 즉시 견적(STEP 자동 변환), **사진 → AI STL 생성**(로그인, 1일 1회)
- 소재 30종+(PLA/ABS/PETG/TPU/나일론/PC/레진), 공법 FDM·SLA·DLP 자동 견적(SLS·MJF·금속은 전문가 견적)
- 가격 = 재료비(부피) + 장비비(출력 시간 × 공법 단가) + 옵션비(서포트·후가공)
- 경로: `/quote?entry=file|photo`, `/price-calculator`, `/stl-checker`, `/my-account`
- **공개 API는 확인되지 않음** → 같은 회사가 운영하므로 파트너 API를 새로 연다(§6).

---

## 3. 목표 아키텍처

```
                        ┌──────────────── wow-linku.co.kr (Next.js / CF Pages) ────────────────┐
 /  플랫폼 랜딩 ─────────┤  서비스 레지스트리 (platform_services)                                 │
                        │   ├─ linku      위치·안심 (기존 5모드 + 동행)  → /linku               │
                        │   ├─ card       디지털 명함 (vCard/프로필 URL)                         │
                        │   ├─ wifi       Wi-Fi 접속 태그                                       │
                        │   ├─ shop       매장·리뷰·SNS 연결                                    │
                        │   ├─ asset      장비·자산 관리 (B2B)                                  │
                        │   └─ custom     자유 URL                                             │
                        │                                                                       │
 /studio 제작 마법사 ────┤  tag_designs ─▶ 3D 생성(파라메트릭 + AI) ─▶ GLB 프리뷰 / STL 출력     │
                        │        │                                   │                         │
                        │        ▼                                   ▼ R2                      │
                        │  quote_requests ◀── QuoteProvider ──────────────▶ wow3dp.co.kr 견적  │
                        │        │                                                              │
                        │        ▼                                                              │
                        │  production_orders ─▶ shop_orders(결제·배송) ─▶ 관리자 제작 큐      │
                        │        │                                                              │
                        │        ▼                                                              │
                        │  nfc tag UID 예약 → NDEF 기록(서비스별 페이로드) → 출고 → 사용자 활성화 │
                        └───────────────────────────────────────────────────────────────────────┘
```

### 핵심 설계 원칙
1. **비파괴 이전** — 이미 기록된 태그 URL(`/t/{uid}`), 모드 경로, 대시보드는 바꾸지 않는다.
2. **서비스 = 플러그인** — 서비스마다 `id, 이름, 상태(live/beta/soon), 진입 경로, NFC 페이로드 타입, 제작 가능 폼팩터`를 선언한다. 메인·스튜디오·관리자가 같은 레지스트리를 쓴다.
3. **Edge 한계 존중** — Cloudflare Workers에서는 무거운 3D 연산을 하지 않는다. 메시 생성·CSG는 **브라우저(WASM)**, AI 생성은 **외부 API 비동기 작업**(작업 ID 폴링 또는 웹훅)으로 처리한다.
4. **출력 가능성 우선** — AI 결과물을 그대로 출력하지 않는다. 검증된 **베이스 템플릿**(칩 포켓·두께·공차 고정)에 장식만 합성해 실패율을 낮춘다.

---

## 4. 정보 구조 (라우트)

| 경로 | 상태 | 내용 |
|---|---|---|
| `/` | **신규** | 플랫폼 랜딩: 히어로, 서비스 카드, 제작 프로세스, Link-U 소개, CTA |
| `/linku` | **이동** | 기존 홈(`MultiModeHomeClient`) 그대로 + 태그 활성화 배너 |
| `/services/[id]` | 신규(P2) | 서비스 상세: 기능, 사용 예, 제작 가능 태그, "이 서비스로 태그 만들기" |
| `/studio` | 신규(P2) | 제작 마법사 시작 (`?service=…` 사전 선택) |
| `/studio/[designId]` | 신규(P2) | 디자인 편집·3D 프리뷰·견적 |
| `/studio/requests` | 신규(P3) | 내 제작 요청·견적·진행 상태 |
| `/admin/production` | 신규(P3) | 제작 요청 큐, 견적 확정, 출력 파일 다운로드, UID 바인딩 |
| `/pet`·`/elder`…, `/t/*`, `/dashboard/*`, `/wayfinder/*`, `/shop/*` | 유지 | 변경 없음 (`/t` 미연결 리다이렉트만 `/linku`로) |

---

## 5. 태그 제작 스튜디오 (R3·R4)

### 5.1 사용자 플로우
```
① 서비스 선택 ─▶ ② 폼팩터 선택 ─▶ ③ 디자인 ─▶ ④ 3D 프리뷰 ─▶ ⑤ 견적 ─▶ ⑥ 제작 요청/결제 ─▶ ⑦ 수령·활성화
   (linku/명함/   (키링·펜던트·   (텍스트·로고·  (회전·색상·   (wow3dp)    (배송지·결제)     (/t/{uid} 또는
    Wi-Fi …)      카드·스탠드)    AI 장식)       소재 미리보기)                                  서비스별 설정)
```

### 5.2 폼팩터 (초기 3종 권장)
| 코드 | 형태 | 칩 | 비고 |
|---|---|---|---|
| `keyring_round` | 원형 키링 Ø40×4mm, 고리 구멍 | NTAG213 Ø25 | 펫·수하물·명함 공용 |
| `pendant_bone` | 뼈다귀/하트 펜던트 | NTAG213 Ø20 | Link-U 펫 |
| `stand_plate` | 매장용 스탠드 80×100mm | NTAG215 Ø30 | Wi-Fi·리뷰·메뉴 |

각 폼팩터는 `form_factors` 행에 치수, 인쇄·각인 가능 영역, 칩 포켓 위치·깊이, 베이스 템플릿(STL/GLB R2 키), 허용 소재·공법을 둔다.

### 5.3 3D 생성 전략 — 2계층

| 계층 | 방식 | 용도 | 기술 |
|---|---|---|---|
| **L1 파라메트릭 (기본)** | 베이스 템플릿 + 텍스트 돌출/음각 + 로고(SVG→돌출) + 색상 | 모든 제작품. 결정적이고 출력이 보장됨 | 브라우저: `three` + `manifold-3d`(WASM CSG) → GLB(프리뷰) / 3MF·STL(출력) |
| **L2 AI 생성 (선택)** | 사진·문장 → 3D 장식(반려동물 얼굴 부조, 캐릭터) | 프리미엄 옵션. L1 베이스 위에 합성 | 외부 image/text-to-3D API (아래 후보) |

**AI 3D API 후보** (P4 착수 전 PoC로 비교)
| 후보 | 입력 | 장점 | 확인할 점 |
|---|---|---|---|
| **wow3dp 사진→STL (자사)** | 사진 | 이미 운영 중, 견적 파이프라인과 바로 연결 | 파트너 API 공개 여부, 하루 1회 제한 해제 |
| Meshy | text/image | 품질 대비 비용이 낫고 GLB/STL 출력 | 상업 이용 약관, 생성 시간 |
| Tripo3D | text/image | 빠른 생성, 리메시 옵션 | 부조(relief) 품질 |
| Stability Stable Fast 3D / SPAR3D | image | 1–2초급 빠른 생성 | 출력 가능한 메시인지(수밀성) |

**AI 보조 기능 (LLM)**: 문장으로 디자인 문구·배치 추천("우리 강아지 콩이, 연락처 넣은 귀여운 스타일"), 업로드 이미지 → 로고 SVG 벡터화 전처리. Claude API(`claude-sonnet-5-5`)를 서버 라우트에서 호출한다.

**AI 생성 파이프라인 (비동기)**
```
POST /api/studio/ai-jobs {designId, prompt|imageKey}
  → ai_jobs(status=queued) 저장 → 외부 API 작업 생성(provider_job_id)
  → 클라이언트 폴링 GET /api/studio/ai-jobs/{id} (또는 provider 웹훅)
  → 완료 시 GLB를 R2에 복사 → 프리뷰에 장식으로 배치(스케일·위치 조정)
  → 확정 시 브라우저에서 L1 베이스와 CSG 합성 → 수밀성 검사 → 3MF/STL 업로드
```
- 사용자별 일일 생성 한도, 비용 상한(`AI_3D_DAILY_LIMIT`, `AI_3D_MONTHLY_BUDGET_KRW`)
- API 키는 서버 전용(`MESHY_API_KEY` 등), 생성물은 R2 `studio/{userId}/{designId}/…`

### 5.4 프리뷰
- `@react-three/fiber` + `drei`. `/studio/[designId]`에서만 `dynamic(..., { ssr:false })`로 불러 다른 페이지 번들에 섞이지 않게 한다.
- 소재 프리셋(PLA 무광, PETG 유광, 레진 투명, 우드 PLA)과 색상 팔레트, 실측 자(mm)
- 모바일 성능: 삼각형 50k 이하로 decimate, 그림자는 정적 baked plane

---

## 6. wow3dp.co.kr 견적 연동 (R5)

### 6.1 인터페이스 (어댑터 패턴)
```ts
interface QuoteProvider {
  id: "wow3dp-handoff" | "wow3dp-api" | "internal-estimate";
  requestQuote(input: {
    modelUrl: string;        // R2 서명 URL (STL/3MF)
    process: "FDM" | "SLA" | "DLP";
    material: string;        // "PLA" …
    color?: string;
    quantity: number;
    postProcess?: string[];  // "sanding" | "painting" | "assembly"
    nfcChip: "NTAG213" | "NTAG215" | "NTAG216";
    referenceId: string;     // quote_requests.id
  }): Promise<QuoteResult>;
}
type QuoteResult =
  | { status: "priced"; quoteId: string; unitPriceKrw: number; totalKrw: number; leadDays: number; expiresAt: string; breakdown?: {...} }
  | { status: "redirect"; url: string }          // 핸드오프 방식
  | { status: "manual_review"; reason: string }; // 전문가 견적
```

### 6.2 단계별 연동 방식
| 단계 | 방식 | 구현 | 장단점 |
|---|---|---|---|
| **Q1 핸드오프** (P3, 바로 가능) | 서명된 모델 URL을 붙여 `wow3dp.co.kr/quote?entry=file&source=linku&ref={id}&model={signedUrl}`로 이동 | wow3dp 쪽: 파라미터를 받아 파일 자동 로드(소규모 수정) | 빠름 / 결제·상태가 두 사이트로 나뉨 |
| **Q2 파트너 API** (P3.5, 권장 최종형) | 서버 간 `POST https://wow3dp.co.kr/api/partner/v1/quotes` (HMAC 서명) → 가격 응답, 주문 확정 `POST …/orders`, 상태 웹훅 `POST wow-linku.co.kr/api/partner/wow3dp/webhook` | 양쪽 개발. 키: `WOW3DP_PARTNER_KEY`, `WOW3DP_WEBHOOK_SECRET` | 사용자 경험이 끊기지 않고 상태가 자동 동기화됨 |
| **Q0 내부 추정** (fallback) | 폼팩터별 기준가 + 소재·수량 계수표 | `internal-estimate` 어댑터 | wow3dp 장애 시 "예상가" 표시용 |

### 6.3 wow3dp 측에 필요한 작업 (요청 목록)
1. 파트너 견적 API: 입력(§6.1) → 단가·총액·납기·견적 만료, 견적 ID
2. 주문 확정 API: 견적 ID + 배송지 → wow3dp 주문번호
3. 상태 웹훅: `accepted / printing / post_processing / qa / shipped(송장) / canceled`
4. 핸드오프용 `/quote` 쿼리 파라미터 수신(`model`, `ref`, `source`)
5. (선택) 사진→STL AI를 파트너 키로 호출 가능하게 하고, 하루 1회 제한은 B2B 쿼터로 따로 둔다

### 6.4 NFC 칩 삽입 공정
- 견적에 **칩 단가 + 삽입 공임**을 별도 항목으로 둔다 (wow3dp 후가공 "조립" 옵션에 대응).
- 출력 중 일시정지 후 칩 삽입(FDM) 또는 후면 포켓 접착(레진) — 폼팩터별로 `insert_method`에 기록한다.

---

## 7. 데이터 모델 (D1 마이그레이션 초안)

```sql
-- 0042_platform_services.sql (P1은 코드 상수, P2에서 DB로)
CREATE TABLE platform_services (
  id TEXT PRIMARY KEY,               -- 'linku' | 'card' | 'wifi' | ...
  name TEXT NOT NULL, tagline TEXT, status TEXT NOT NULL DEFAULT 'soon', -- live|beta|soon
  entry_path TEXT, payload_type TEXT NOT NULL,                           -- linku_profile|url|vcard|wifi
  sort_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1
);
-- 0043_form_factors.sql
CREATE TABLE form_factors (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  spec_json TEXT NOT NULL,           -- 치수·각인 영역·칩 포켓·공차
  base_model_key TEXT,               -- R2 GLB/STL
  allowed_services TEXT NOT NULL,    -- JSON 배열
  allowed_materials TEXT NOT NULL,   -- JSON 배열
  base_price_krw INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1
);
-- 0044_tag_designs.sql
CREATE TABLE tag_designs (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL, form_factor_id TEXT NOT NULL,
  design_json TEXT NOT NULL,         -- 텍스트·로고·색상·AI 장식 배치
  service_config_json TEXT,          -- 서비스별 NFC 내용(명함 정보, Wi-Fi SSID 등)
  preview_key TEXT, glb_key TEXT, print_model_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft|ready|requested|locked
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE ai_jobs (
  id TEXT PRIMARY KEY, design_id TEXT NOT NULL, user_id TEXT NOT NULL,
  provider TEXT NOT NULL, provider_job_id TEXT, kind TEXT NOT NULL, -- image_to_3d|text_to_3d|vectorize|copy
  input_json TEXT, status TEXT NOT NULL DEFAULT 'queued', result_key TEXT, error TEXT, cost_krw INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 0045_quotes_production.sql
CREATE TABLE quote_requests (
  id TEXT PRIMARY KEY, design_id TEXT NOT NULL, user_id TEXT NOT NULL,
  provider TEXT NOT NULL, provider_quote_id TEXT,
  process TEXT, material TEXT, quantity INTEGER NOT NULL DEFAULT 1, options_json TEXT,
  unit_price_krw INTEGER, total_krw INTEGER, lead_days INTEGER, expires_at DATETIME,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|priced|manual_review|expired|accepted
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE production_orders (
  id TEXT PRIMARY KEY, quote_id TEXT NOT NULL, shop_order_id TEXT REFERENCES shop_orders(id),
  provider_order_id TEXT, status TEXT NOT NULL DEFAULT 'queued', -- queued|printing|post|qa|nfc_bind|shipped|done|canceled
  reserved_tag_uids TEXT,            -- JSON 배열, NFC 인벤토리와 연결
  tracking_no TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE shop_orders ADD COLUMN production_order_id TEXT;
```

---

## 8. 단계별 개발 계획

| Phase | 이름 | 기간(추정) | 산출물 | 완료 기준 |
|---|---|---|---|---|
| **P1** | 플랫폼 랜딩 + Link-U 섹션화 | 1–2주 | 서비스 레지스트리(코드), 새 `/`, 기존 홈 → `/linku`, `/t` 활성화 리다이렉트 변경, 사이트맵·SEO | 기존 태그 스캔·모드·대시보드 회귀 없음, 새 홈에서 모든 서비스·Link-U 진입 |
| **P2** | 서비스 상세 + 스튜디오 MVP | 3–4주 | `/services/[id]`, `/studio` 마법사(①–③), 폼팩터 3종 템플릿, L1 파라메트릭 3D 프리뷰, `tag_designs` 저장 | 로그인 사용자가 디자인을 저장하고 3D로 돌려볼 수 있음 |
| **P3** | 견적·제작 요청 | 2–3주 | `QuoteProvider`(Q0 내부 추정 + Q1 핸드오프), `quote_requests`, 제작 요청 → `shop_orders`, 관리자 제작 큐 `/admin/production`, STL/3MF 내보내기 | 요청 → 관리자가 파일을 내려받아 wow3dp 공정으로 넘길 수 있음 |
| **P3.5** | wow3dp 파트너 API | 2주 (wow3dp 측 병행) | Q2 어댑터, HMAC, 웹훅 상태 동기화 | 견적가 실시간 표시, 상태 자동 갱신 |
| **P4** | AI 3D·AI 보조 | 3–4주 | `ai_jobs`, 제공사 PoC 비교 후 1개 채택, 사진→부조 장식, LLM 디자인 추천, 한도·비용 관리 | AI 장식이 들어간 디자인이 수밀성 검사를 통과하고 견적까지 이어짐 |
| **P5** | 범용 NFC 서비스 확장 | 서비스당 1–2주 | 디지털 명함, Wi-Fi, 매장·리뷰, 자산관리(B2B) — 각자 공개 페이지 + 관리 화면 + NDEF 페이로드 | 제작 태그 수령 후 서비스별 활성화 흐름 완료 |
| **P6** | 생산 운영 고도화 | 2주 | UID 예약·일괄 NDEF 기록(Android writer 연동), 송장, 알림, 통계 | 주문부터 출고·활성화까지 추적 가능 |

**전체 일정**: 순차 진행 시 약 4–5개월. P2와 P3.5(wow3dp 측)는 병행할 수 있다.

### P1 상세 작업 (2026-11-13 구현 · 배포 전 기기 확인 필요)
- [x] `src/lib/platform/services.ts` — 서비스 레지스트리(상태·경로·아이콘·제작 가능 여부)
- [x] `src/app/linku/page.tsx` — 기존 홈 로직 이동(세션·조직·동행 링크·활성화 배너)
- [x] `src/app/page.tsx` — 플랫폼 랜딩. `?action=activate` 등 기존 쿼리는 `/linku`로 리다이렉트
- [x] `src/components/platform/PlatformHomeClient.tsx` — 히어로 / 서비스 그리드 / 제작 4단계 / Link-U 블록 / CTA
- [x] `/t/[tag_id]` 미연결 태그 리다이렉트 → `/linku?…`
- [x] 모드 화면의 "링크유 홈"·"모드 선택" 링크 → `/linku`
- [x] `public/sitemap.xml`에 `/linku` 추가, 홈 메타데이터를 플랫폼 문구로
- [x] **Link-U 구매자 흐름 보존** — 태그에 기록된 URL(`/t/{UID}`, `/wayfinder?from=nfc&tag=`)은 그대로 둠. 태그 스캔 후 화면(발견자 프로필, 미등록·없는 태그, 동행, 설명서, 로그인, 대시보드 오류, 초대)의 "홈" 링크와 로그아웃·직접 `/login` 접근 시 돌아가는 곳을 `/` 대신 `/linku`로 변경. 새 플랫폼 홈 `/`는 처음 방문자용 진입점
- [x] `npm run typecheck` · `npm run lint` · `npm run build` 통과

---

### P2 상세 작업 (2026-11-13 구현 · D1 마이그레이션 적용·기기 확인 필요)
- [x] 디자인 기준 확정: 메인 서비스명 **Link-U** 유지, 색상·카드·레이아웃은 기존 Link-U(로즈·앰버 배경 + 흰 라운드 카드 + 틸 #00A896, 모바일 폭) 그대로 — 메인 `/` 재정렬
- [x] `PlatformTopNav` — 플랫폼 영역 공통 상단 바 (FlowTopNav 스타일)
- [x] `/services/[id]` — 서비스 상세, 제작 가능한 태그, "이 서비스로 태그 만들기"
- [x] `src/lib/platform/form-factors.ts` — 원형 키링 / 뼈다귀 펜던트 / 스탠드 플레이트 (치수·칩·기본가)
- [x] `migrations/0042_tag_designs.sql` + `npm run d1:apply:tag-designs`
- [x] `src/lib/platform/tag-design.ts` — 디자인 JSON 형식·정규화(문구·본체/문구 색·재질·양각/음각)
- [x] `src/app/actions/studio.ts` — 초안 생성(비로그인 시 로그인 후 복귀)·조회·저장·완료·삭제, 사용자당 50개
- [x] `/studio` — ① 서비스 ② 모양 선택, 내 디자인 목록
- [x] `/studio/[designId]` — 편집 + three.js 3D 미리보기(동적 로드), NFC 칩 위치 보기, 임시 저장/디자인 완료
- [ ] 운영 D1에 0042 적용 후 실기기(안드로이드·iOS 사파리) 3D 미리보기 확인
- 남은 항목 → P3: 미리보기 썸네일 R2 저장, STL/3MF 내보내기(manifold-3d CSG)

### 웹 반응형 랜딩 · 통합 관리자 (2026-11-13)
- [x] 메인 `/`: 휴대폰은 Link-U 웹앱 카드형 유지, PC(lg 이상)는 넓은 웹 레이아웃 — 2단 히어로(태그 목업), Link-U 안심 모드 6종 띠, 서비스 3열 카드, 제작 4단계 가로 흐름, 다단 푸터
- [x] `PlatformTopNav`: PC 가로 메뉴(서비스·태그 제작·Link-U 안심·사용 설명서·로그인)
- [x] `/services/[id]` PC 2단, `/studio` PC 폭 확장. `/linku`·모드·`/t`·대시보드는 기존 웹앱 레이아웃 그대로
- [x] 관리자 → **통합 관리자**: 메뉴를 통합 운영 / Link-U 안심 / 태그 스튜디오 / NFC 태그 공통 / 커머스 / 조직·계정으로 재편
- [x] `/admin` 통합 대시보드(사용자·태그·Link-U 관리 대상·대기 주문·서비스 현황·스튜디오 상태), 기존 대시보드는 `/admin/linku`
- [x] `/admin/platform/services` 서비스 관리(읽기 전용), `/admin/platform/studio` 디자인 목록·상태 필터
- [ ] PC 히어로 태그 목업 → 실물 태그 사진·렌더링으로 교체

### Link-U 구매자 스캔 흐름 (변경 금지 기준)
| 상황 | 흐름 |
|---|---|
| 등록된 태그 스캔 | `/t/{UID}` → 발견자 공개 프로필 (변경 없음) |
| 미등록(신규 구매) 태그 스캔 | `/t/{UID}` → `/linku?tag=…&action=activate` → 기존 모드 선택 + 활성화 배너 → `/{mode}` → 로그인 → 연결 |
| 동행 태그 스캔 | `/wayfinder?from=nfc&tag=…` (변경 없음) |
| 예전 `/?tag=…` 링크 | `/` 서버에서 `/linku?…`로 리다이렉트 |
| 보호자 PWA·로그인 후 | `/hub` (변경 없음) |

## 9. 결정 필요 사항

1. ~~**브랜드**~~ — **확정(2026-11-13): 메인 서비스명 Link-U 유지, 디자인·컬러는 현재 Link-U 기준**
2. **wow3dp 파트너 API 개발 일정** — 같은 회사 시스템이므로 §6.3 목록을 기준으로 일정을 잡아야 함. 그 전에는 Q1 핸드오프 + Q0 추정으로 운영
3. **AI 3D 제공사·예산** — 자사 사진→STL을 우선 쓸지, 외부 API(Meshy 등)를 쓸지. 월 예산 상한
4. **결제** — 현재 `shop_orders`는 pending 보관만 함. 제작 주문에 PG(토스페이먼츠 등)를 붙일지, wow3dp 결제로 넘길지
5. **초기 SKU** — 폼팩터 3종·칩 사양 확정, 실물 샘플 출력으로 공차 검증

---

## 10. 리스크

| 리스크 | 영향 | 완화 |
|---|---|---|
| AI 메시가 출력에 부적합(비수밀, 얇은 벽) | 높음 | L1 베이스 + 장식 합성, 수밀성·최소 두께 검사, 관리자 검수 단계 |
| wow3dp API 일정 지연 | 중 | Q1 핸드오프·Q0 추정으로 먼저 오픈 |
| Edge 번들·성능(three.js) | 중 | `/studio`에서만 동적 로드, CSG는 브라우저 WASM |
| 기존 태그 URL·SEO 회귀 | 높음 | `/t`·모드 경로 불변, `/` 쿼리 리다이렉트, 회귀 체크리스트 |
| AI API 비용 폭증 | 중 | 사용자·월 단위 한도, 결제 후 생성 옵션 |

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| v0.2 | 2026-11-13 | v0.1 기반 실행 계획: 서비스 레지스트리, 스튜디오 플로우, AI 3D 2계층 전략, wow3dp 견적 어댑터(Q0–Q2), D1 스키마, P1–P6 |
| v0.3 | 2026-11-13 | 브랜드·디자인 확정, P2(서비스 상세·스튜디오·3D 미리보기) 구현 |
| v0.4 | 2026-11-13 | PC 웹 반응형 랜딩, 통합 관리자(메뉴 재편·통합 대시보드·서비스/스튜디오 관리) |
