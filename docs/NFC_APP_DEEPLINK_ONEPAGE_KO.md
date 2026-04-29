# NFC 앱 연동 1페이지 요약 (앱팀 전달용)

## 목표 UX

- 웹에서 `앱으로 NFC 등록하기` 클릭
- 앱 화면 자동 진입 + 값 자동 채움
- 사용자는 **저장 버튼 1회**로 완료

---

## 딥링크 엔드포인트

- 우선: `petidconnect://nfc/write?...`
- 보조: `petidconnect://nfc/pet?...`

웹은 가능한 경우 `nfc/write`를 우선 사용하고, 실패 시 `nfc/pet`로 내려간다.

---

## `nfc/write` 파라미터

- 필수
  - `uid`: 태그 UID
  - `url`: 태그에 기록할 웹 URL
  - `handoffToken`: 서버 서명 토큰
  - `exp`: 만료 시각(unix sec)
- 앱 동작
  - NFC 등록 화면 즉시 진입
  - `uid`, `url` 자동 채움
  - 토큰 검증 후 저장 가능

---

## `nfc/pet` 파라미터

- 필수
  - `kind`: `pet|elder|child|luggage|gold`
  - `pet_id`: 연결 대상 ID
- 선택
  - `tenant`: 조직 컨텍스트
  - `entry`: 진입 소스 (`dashboard_quick_register`)
  - `app_base`: 웹 앱 base URL
  - `uid`: UID prefill 값
- 앱 동작
  - 대상 자동 선택
  - `uid` 있으면 자동 입력

---

## 설치/미설치 fallback

- 앱 미실행 시 웹 fallback:
  - 기본: `/install?next=<원래딥링크>`
  - 스토어 URL 설정 시: 스토어 우선 이동
- 설치 화면 요구사항:
  - `next`가 있으면 **설치 후 앱 바로 열기** 버튼 제공

---

## 오류 처리 기준 (앱)

- 파라미터 누락/파싱 실패: 사용자 안내 + 수동 입력 허용
- 토큰 만료/서명 오류: 저장 비활성 + “웹에서 다시 시도” 안내
- NFC 권한/하드웨어 비가용: 설정 이동 안내

---

## 웹 이벤트 로그 (이미 반영됨)

- 이벤트명
  - `app_open_attempt`
  - `app_opened`
  - `store_fallback`
  - `install_page_fallback`
- 저장 위치
  - `admin_action_logs` (`action='guardian_nfc_app_event'`)

---

## 앱팀 최종 체크

- `nfc/write`, `nfc/pet` 라우트 구현
- 화면 자동 채움 + 저장 1회 완료
- 설치 후 딥링크 재진입 확인
- 토큰 검증 실패 UX 확인

