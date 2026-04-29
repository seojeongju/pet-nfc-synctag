# Link-U NFC 앱 연동 딥링크 스펙 (웹 ↔ 앱)

이 문서는 웹 대시보드의 **`앱으로 NFC 등록하기`** 버튼과 Android 앱의 NFC 등록 화면을
연동하기 위한 파라미터 계약이다.

## 1) 진입 경로

웹은 아래 두 가지 딥링크 중 하나를 사용한다.

1. `petidconnect://nfc/write?...`  
   - 우선 경로
   - 이미 UID가 입력된 경우 사용
   - URL/토큰이 포함되어 앱이 대부분 자동 채움 가능

2. `petidconnect://nfc/pet?...`  
   - 보조 경로
   - UID가 없거나 handoff 토큰 발급 실패 시 사용
   - 앱에서 대상/모드 기준으로 기본값을 채우고 사용자가 계속 진행

## 2) `nfc/write` 파라미터

- `uid` (string, required)
  - 태그 UID (정규화된 값)
- `url` (string, required)
  - 태그에 기록할 웹 URL (예: `https://.../t/{uid}`)
- `handoffToken` (string, required)
  - 서버 서명 토큰
- `exp` (string/number, required)
  - 만료 unix timestamp(sec)

앱 동작 권장:
- 앱 진입 즉시 NFC 등록 화면 표시
- `uid`, `url` prefill
- `handoffToken/exp` 검증 후 쓰기 활성화
- 사용자는 **저장 버튼 1회**로 완료

## 3) `nfc/pet` 파라미터

- `kind` (string, required)
  - `pet | elder | child | luggage | gold`
- `pet_id` (string, required)
  - 연결 대상 ID
- `tenant` (string, optional)
  - 조직 컨텍스트
- `entry` (string, optional)
  - 현재는 `dashboard_quick_register`
- `app_base` (string, optional)
  - 웹 앱 base URL
- `uid` (string, optional)
  - 입력되어 있던 UID (있으면 prefill)

앱 동작 권장:
- 대상(`pet_id`) 자동 선택
- `uid`가 있으면 UID 입력칸 prefill
- `app_base`가 있으면 URL 자동 구성 가능

## 4) 설치 fallback 연계

앱 미설치(딥링크 전환 실패) 시 웹은 아래로 이동한다.

- 기본: `/install?next=<원래 딥링크>`
- 스토어 URL 설정 시: 스토어 우선 이동

설치 안내 페이지(`/install`)는 `next` 파라미터가 있으면  
**`설치 후 앱 바로 열기`** 버튼으로 해당 딥링크를 다시 실행한다.

## 5) 이벤트 로그 (웹 서버)

웹은 아래 이벤트를 `admin_action_logs`(`action='guardian_nfc_app_event'`)로 저장한다.

- `app_open_attempt`
- `app_opened`
- `store_fallback`
- `install_page_fallback`

payload:
- `event`
- `subjectKind`
- `petId`
- `tenantId`
- `userId`

## 6) 앱 구현 체크리스트

- 딥링크 라우터에 `nfc/write`, `nfc/pet` 등록
- 파라미터 파싱 실패 시 사용자 안내 후 수동 입력 허용
- NFC 쓰기 완료 시 성공 토스트 + 웹 복귀 옵션 제공
- `nfc/write`는 토큰 만료/서명오류 시 저장 비활성 + 재시도 안내

