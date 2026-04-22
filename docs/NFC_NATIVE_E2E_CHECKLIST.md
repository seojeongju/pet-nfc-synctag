# NFC Native E2E Checklist

## 목적

- 실제 안드로이드 디바이스에서 **웹 handoff → 네이티브 태그 쓰기 → 서버 callback** 전 구간을 검증한다.
- 관리자/보호자 양쪽 UI에서 동일하게 동작하는지 확인한다.

## 사전 준비

- 웹 환경변수
  - `NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED=true`
  - (`선택`) `NEXT_PUBLIC_NFC_NATIVE_APP_STORE_URL=...`
- 서버 환경변수
  - `NFC_NATIVE_HANDOFF_SECRET`
  - `NFC_NATIVE_APP_API_KEY`
  - (`선택`) `NFC_NATIVE_APP_HMAC_SECRET_CURRENT` / `_NEXT`
- 앱 환경값 (`android-native-writer/local.properties`)
  - `NATIVE_API_BASE_URL`
  - `NATIVE_APP_API_KEY`
  - (`선택`) HMAC current/next
- 등록된 테스트 태그 2개 이상
- 테스트 관리자 계정 + 보호자 계정

## 시나리오 A: 관리자 정상 경로

1. 관리자 `URL 기록(Web NFC)` 화면에서 `전용 앱에서 쓰기 열기` 실행
2. 네이티브 앱에서 태그 접촉 후 기록 성공
3. 기대 결과
   - API 응답 `200`
   - `admin_action_logs`에 `nfc_native_handoff`, `nfc_native_write(success=1)` 기록
   - 태그 스캔 시 `/t/{uid}` 열림

## 시나리오 B: 보호자 정상 경로 (Web NFC 미지원 상황)

1. 보호자 대시보드에서 태그 연결 완료
2. `앱으로 태그 주소 기록` 버튼 실행
3. 네이티브 앱에서 태그 접촉 후 기록 성공
4. 기대 결과
   - API 응답 `200`
   - `admin_action_logs`에 `source=guardian_dashboard` payload로 handoff 기록
   - 태그 스캔 시 `/t/{uid}` 열림

## 시나리오 C: HMAC 서명 실패

1. 앱에서 고의로 잘못된 signature 전송
2. 기대 결과
   - API 응답 `401` (`Invalid native signature`)
   - `nfc_native_write_rejected` + `reason=invalid_signature`

## 시나리오 D: handoff token 재사용

1. 동일 callback payload 재전송
2. 기대 결과
   - API 응답 `409`
   - `reason=handoff_token_replay_or_expired`

## 시나리오 E: bearer 불일치

1. 잘못된 bearer로 callback 전송
2. 기대 결과
   - API 응답 `401` (`Unauthorized`)
   - `reason=unauthorized_bearer`

## 시나리오 F: 앱 미설치

1. 웹에서 handoff 버튼 노출 상태에서 앱 미설치 기기로 접근
2. `앱이 없나요? 스토어에서 설치하기` 링크 실행
3. 기대 결과
   - Play Store(또는 지정 링크) 정상 이동

## 검증 결과 기록 템플릿

- 실행 일시:
- 앱 빌드 버전:
- 디바이스 모델 / OS:
- 관리자 경로 결과:
- 보호자 경로 결과:
- 실패 케이스(C~F) 결과:
- 이슈 및 재현 절차:
- 조치 담당자:
