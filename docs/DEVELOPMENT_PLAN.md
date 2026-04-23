# 개발 계획 (NFC · 보호자)

단계를 **순서대로** 진행합니다. 앞 단계를 마친 뒤 다음 단계에 착수합니다.

---

## 1단계: 안드로이드 전용 앱 — URL 입력 기능 마무리 (우선)

**목표:** 웹 딥링크 없이도 **개발·테스트**와 **예외 상황**에서 태그에 URL을 쓸 수 있게 한다.

**현재 전제:** `MainActivity`는 `petidconnect://nfc/write?uid=&url=&handoffToken=` 딥링크로만 `WritePayload`를 채운다.

**마무리할 범위(체크리스트):**

- [ ] UI: 프로필 URL(또는 기록할 URL), UID, **핸드오프 토큰** 입력 수단(필드 / 붙여넣기) — 서버 검증이 필요한 구조면 토큰은 웹에서 발급받은 값을 그대로 넣는 흐름 명시
- [ ] 입력값으로 `WritePayload` 구성 후, 기존 **태그 대기 → NDEF URL 쓰기 → native-write 콜백** 경로 재사용
- [ ] 딥링크로 열린 경우와 **수동 입력**이 섞일 때 우선순위(예: 딥링크가 오면 입력란 덮어쓰기 / 확인) 정리
- [ ] 빈 값·형식 오류 시 메시지(한국어) 정리
- [ ] `BuildConfig.NATIVE_API_BASE_URL` 등 **개발용 설정**과 문서(`android-native-writer/README.md`) 한 줄 보강

**완료 기준:** 실제 기기에서 “웹 없이 입력만으로” 태그 1개에 URL 기록 + 서버 보고까지 성공하는 시나리오 재현 가능.

---

## 2단계: 보호자 웹 — NFC 태그 관리(추가 구현)

**전제:** 1단계 완료 후 착수. (Play 스토어 배포 전 — [`.cursor/rules/app-distribution.mdc`](../.cursor/rules/app-distribution.mdc) 전제 유지.)

**목표:** 한 반려에 **여러 NFC**가 연결된 경우, 보호자가 **목록·연결 해제·추가(재등록)** 를 웹에서 처리.

**범위(요약):**

- 반려 상세(`dashboard/.../pets/[pet_id]`)에 기존 `TagManageCard` 수준의 관리 UI 도입 또는 동일 로직 공유
- 대시보드 홈 ↔ 반려 상세 이동(필요 시 `#nfc` / 쿼리)
- 해제 확인 모달, 테넌트 `writeLocked` 정합
- 서버: 기존 `linkTag` / `unlinkTag` / `getPetTags` 중심(스키마 변경은 후속)

**상세 설계:** 채팅/이슈에 정리된 “반려 단위 중심 IA”를 따름.

---

## 3단계(선택): 네이티브에서 관리

- 딥링크로 **반려 상세(태그 섹션)** 열기 → 관리는 웹
- 또는 앱 전용 API로 목록/해제(권한 동일) — 필요 시 별도 설계

---

## 진행 방식

1. **1단계** 끝날 때까지 **2단계 UI/웹 작업은 스코프 밖**으로 둔다.
2. 1단계 완료 후 이 문서의 1단계 체크를 갱신하고 2단계 이슈/PR을 연다.

---

## 부록: 추적·연락 제품 목표(로드맵 요약)

BLE·Find My·NFC 등 **축별 약속 범위**와 대외 문구 가이드는 아래 문서에 정리합니다.

- [`docs/TRACKING_PRODUCT_GOALS.md`](./TRACKING_PRODUCT_GOALS.md)
- [`docs/IOS_EXPANSION_MASTER_PLAN.md`](./IOS_EXPANSION_MASTER_PLAN.md) — iOS 확장 고도화 개발 계획
