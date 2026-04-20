# NFC Native E2E Checklist

## 목적
- 실제 안드로이드 디바이스에서 웹 handoff → 네이티브 쓰기 → 서버 callback 전 구간을 검증한다.

## 사전 준비
- 등록된 테스트 태그 2개 이상
- 테스트 관리자 계정
- 앱 설정
  - `NFC_NATIVE_APP_API_KEY`
  - (`선택`) HMAC 활성화 시 서명 시크릿
- 서버 설정
  - `NFC_NATIVE_APP_API_KEY`
  - `NFC_NATIVE_HANDOFF_SECRET`
  - (`선택`) `NFC_NATIVE_APP_HMAC_SECRET_CURRENT`/`_NEXT`

## 시나리오 A: 정상 성공 경로
1. 관리자 URL 쓰기 카드에서 `전용앱에서 쓰기 열기` 실행
2. 앱에서 태그 접촉 후 쓰기 성공
3. 기대 결과
   - API 응답 200
   - `admin_action_logs`에 `nfc_native_write` 적재 (`success=1`)
   - 모니터링 거절 건수 증가 없음

## 시나리오 B: HMAC 서명 실패
1. 앱에서 고의로 잘못된 signature 전송
2. 기대 결과
   - API 응답 401 (`Invalid native signature`)
   - `nfc_native_write_rejected` + `reason=invalid_signature`
   - 웹훅 알림(쿨다운 조건 충족 시) 수신

## 시나리오 C: handoff token 재사용
1. 동일 callback payload를 재전송
2. 기대 결과
   - API 응답 409
   - `reason=handoff_token_replay_or_expired`

## 시나리오 D: 잘못된 UID
1. 존재하지 않는 tagId로 callback 전송
2. 기대 결과
   - API 응답 404
   - `reason=unknown_tag_id`

## 시나리오 E: bearer 불일치
1. 잘못된 bearer로 callback 전송
2. 기대 결과
   - API 응답 401 (`Unauthorized`)
   - `reason=unauthorized_bearer`

## 검증 결과 기록
- 실행 일시:
- 앱 버전:
- 디바이스 모델/OS:
- 시나리오별 결과(성공/실패):
- 이슈 및 재현 절차:
- 조치 담당자:
