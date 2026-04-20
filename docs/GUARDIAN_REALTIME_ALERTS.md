# Guardian Realtime Alerts

## 목적
- 발견자 행동(`call_click`, `sms_click`, `location_share_*`) 발생 시 보호자 대응 시간을 줄이기 위해 실시간 알림을 보냅니다.

## 환경변수
- `GUARDIAN_ALERT_WEBHOOK_URL`
  - 실시간 알림 웹훅 URL
  - 미설정 시 알림은 발송되지 않고 로그만 저장됩니다.
- `NEXT_PUBLIC_APP_URL` (권장)
  - 알림 메시지에 보호자 프로필 링크를 포함할 때 사용됩니다.

## 발송 이벤트
- `call_click` (전화 버튼 클릭)
- `sms_click` (문자 버튼 클릭)
- `location_share_click` (위치 공유 시도)
- `location_share_success` (위치 공유 성공)
- `location_share_error`는 실시간 알림 제외(분석 지표 전용)

## 쿨다운 정책
- 테이블: `guardian_alert_state`
- 동일 `pet_id + action` 조합 기준
  - `location_share_success`: 1분
  - 그 외: 3분

## 운영 점검 체크리스트
1. 환경변수 반영 후 배포 완료
2. 테스트 태그 스캔 후 전화/문자/위치공유 클릭 실행
3. 웹훅 수신 로그에서 메시지 확인
4. 관리자 모니터링에서 `보호자 실시간 알림 발송` KPI 확인

## 주의사항
- 알림 발송 실패는 사용자 UX를 막지 않도록 non-blocking 처리됩니다.
- 웹훅 수신처에서 재시도/중복 처리 정책을 권장합니다.
