# 개발 계획 (NFC · 보호자)

단계를 **순서대로** 진행합니다. 앞 단계를 마친 뒤 다음 단계에 착수합니다.

---

## 1단계: 안드로이드 전용 앱 — URL 입력 기능 마무리 (우선) — **완료(문서·동작 정합)**

**목표:** 웹 딥링크 없이도 **개발·테스트**와 **예외 상황**에서 태그에 URL을 쓸 수 있게 한다.

**전제·구현:** `WriterAppScreen` + `MainActivity`에서 Link-U 모드 시 UID·URL·핸드오프 토큰을 **필드 입력·붙여넣기**로 넣을 수 있고, `[태그에 쓰기]` → NDEF 쓰기 → `POST /api/admin/nfc/native-write` 경로를 쓴다. 토큰은 웹 handoff에서 발급된 값을 그대로 쓰는 구조.

**체크리스트(닫힘):**

- [x] UI: 프로필 URL(또는 기록할 URL), UID, 핸드오프 토큰 입력(필드/붙여넣기) 및 `「URL 자동(UID+사이트)」`
- [x] `WritePayload` → 태그 대기 → NDEF 쓰기 → native-write 콜백(Link-U 모드) 재사용
- [x] **딥링크(`…/nfc/write`) vs 수동:** `uid`·`url`·`handoffToken`이 **모두** 채워진 딥링크일 때만 필드 덮어쓰기. 하나라도 비면 **기존 입력 유지** + 안내(README·코드 주석)
- [x] 빈 값: Link-U는 세 칸·일반 도구는 URL/정보, 블루투스 MAC 등 **한국어 안내**(`MainActivity` 등)
- [x] `NATIVE_API_BASE_URL` / 앱 내 서버 설정: `android-native-writer/README.md`·`local.properties.example`에 정리

**완료 기준:** 기기에서 수동 입력만으로 태그 1개 URL 기록 + (설정 시) 서버 보고 — 재현 가능(검증은 `docs/NFC_NATIVE_E2E_CHECKLIST.md` 권장).

---

## 2단계: 보호자 웹 — NFC 태그 관리(추가 구현) — **1차 완료(반려 상세)**

**전제:** 1단계 완료 후 착수. (Play 스토어 배포 전 — [`.cursor/rules/app-distribution.mdc`](../.cursor/rules/app-distribution.mdc) 전제 유지.)

**목표:** 한 반려에 **여러 NFC**가 연결된 경우, 보호자가 **목록·연결 해제·추가(재등록)** 를 웹에서 처리.

**범위(요약):**

- [x] 반려 상세 `dashboard/.../pets/[pet_id]` **NFC 섹션**에 `TagManageCard`(embed) — 목록·UID 추가 연결·해제 **확인 모달**, `tenantSuspended` → `writeLocked`와 동일(수정/연결 잠김)
- [x] `linkTag` / `unlinkTag` 성공 시 **반려 상세 경로 revalidate** (`/dashboard/{kind}/pets/{id}`)
- [x] 대시보드 홈 ↔ 반려 상세, `#nfc` (이미 연동)
- [x] **홈 대시보드** elder/child/luggage/gold — `DashboardNfcQuickRegisterCard`로 pet과 동일 NFC 흐름(스캔·NDEF·네이티브 handoff·`linkedTagCount`)
- [ ] (후속) 다른 `subject` **비홈** 경로·쿼터/가이드 문구 통일
- 서버: `linkTag` / `unlinkTag` / `getPetTags` 유지(스키마 변경 없음)

**상세 설계:** 채팅/이슈에 정리된 “반려 단위 중심 IA”를 따름.

---

## 3단계(선택): 네이티브에서 “웹 태그 관리”로 **[딥링크 열기만]** — **1차 구현됨**

- [x] **딥링크:** `petidconnect://nfc/pet?kind=…&pet_id=…&tenant=…(선택)` → 기본 브라우저에서  
  `{사이트}/dashboard/{kind}/pets/{id}?tenant#nfc` (보호자 반려 상세의 NFC 섹션 앵커). 앱 `MainActivity` + `AndroidManifest` + 웹 `id="nfc"`.
- [ ] 앱 전용 API로 태그 목록/해제(권한 동일) — **미착수**, 필요 시 별도 설계
- [x] 반려 상세(NFC 섹션)·보호자 **대시보드 홈(`NFC 빠른 등록`)** 에서 Android + handoff 플래그 시 **「전용 앱으로 열기 → 브라우저에 이 NFC 태그 안내」** (`OpenNativePetNfcSectionButton`)

---

## 진행 방식

1. **1단계**는 위 기준으로 **닫힘** → **2단계(보호자 웹 태그 관리)** 를 우선 백로그/이슈로 둔다(스코프는 제품 합의에 따름).
2. 1단계·3단계(딥링크)는 문서·앱·웹에 반영됨. 2단계 착수 시 `dashboard/.../pets/[pet_id]`·`#nfc` IA와 맞출 것.

---

## iOS 네이티브 앱 (필수 후속)

- **Android만** `android-native-writer`로 구현된 상태이며, **iOS는 별도 네이티브 앱으로 개발을 진행해야 한다** (기록일 기준 착수 전). 상세 범위·단계는 아래 문서를 따른다.
- [`docs/IOS_EXPANSION_MASTER_PLAN.md`](./IOS_EXPANSION_MASTER_PLAN.md)

---

## 부록: 추적·연락 제품 목표(로드맵 요약)

BLE·Find My·NFC 등 **축별 약속 범위**와 대외 문구 가이드는 아래 문서에 정리합니다.

- [`docs/TRACKING_PRODUCT_GOALS.md`](./TRACKING_PRODUCT_GOALS.md)
- [`docs/IOS_EXPANSION_MASTER_PLAN.md`](./IOS_EXPANSION_MASTER_PLAN.md) — iOS 확장 고도화 개발 계획

---

## 2026-04-25 앱 개발 정리 (최신)

### Android 앱 (`android-native-writer`) 현재 완료

- [x] 진입 UX 단순화: 랜딩을 `NFC 켜기(휴대폰 설정)` + `NFC 쓰기` 2개 메뉴로 정리
- [x] Link-U 전용 모드 분리 제거: 동일 NFC 쓰기 UI에서 handoff 유무로 동작 분기
- [x] 일반 NFC 도구 대시보드 강화: URL/명함/SMS/영상/Wi-Fi/블루투스/보호자 연동 타일
- [x] Link-U 연동 섹션을 대시보드 내부 흐름으로 통합(별도 모드 학습 필요 없음)
- [x] 불필요한 모드 안내 문구 축소(사용자 행동 중심 문구로 정리)
- [x] 하단 공통 브랜딩(`Link-U` 로고) 적용
- [x] Wi-Fi UX 개선
  - [x] `WPA/WEP/nopass` 수동 선택 제거
  - [x] 주변 SSID 스캔 + 선택 시 SSID 자동 채움
  - [x] SSID 선택 후 목록 접고 입력창(SSID+비밀번호) 집중 흐름 적용

### Android 앱 남은 작업 (권장)

- [ ] Wi-Fi 스캔 신뢰도 개선(권한/위치 OFF/제조사 제약 안내 세분화)
- [ ] Wi-Fi 리스트 품질 개선(신호 강도/보안 타입/정렬 옵션)
- [ ] 접근성 보강(TalkBack 라벨, 버튼 상태 전환, 포커스 이동)
- [ ] 문구/아이콘 컴포넌트 공통화(복수 화면 중복 제거)
- [ ] 실기기 QA 매트릭스 재검증(삼성/샤오미/픽셀, Android 12~15)

### 다음 우선순위

- Android 앱 기능 추가보다, **Link-U 웹앱 고도화**를 우선 진행
- 웹앱 작업 목록은 [`docs/WEB_APP_ENHANCEMENT_BACKLOG.md`](./WEB_APP_ENHANCEMENT_BACKLOG.md) 기준으로 운영
