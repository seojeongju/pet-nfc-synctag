# Guardian Realtime Alerts

## 목적
- 발견자 행동(`call_click`, `sms_click`, `location_share_*`) 발생 시 보호자 대응 시간을 줄이기 위해 실시간 알림을 보냅니다.

## 환경변수
- `GUARDIAN_ALERT_WEBHOOK_URL`
  - 실시간 알림 웹훅 URL
  - 미설정 시 알림은 발송되지 않고 로그만 저장됩니다.
- `NEXT_PUBLIC_APP_URL` (권장)
  - 알림 메시지에 보호자 프로필 링크를 포함할 때 사용됩니다.
- `KAKAO_REST_API_KEY` (권장)
  - 카카오 개발자 콘솔의 **REST API 키** (지도에 쓰는 JavaScript 키와 다름).
  - 설정 시 `location_share_success` 등 **좌표가 있을 때** [좌표→주소](https://developers.kakao.com/docs/latest/ko/local/dev-guide#coord-to-address)로 도로명·지번을 조회해 알림 `text`의 `address=` 및 JSON `address` 필드에 넣습니다.
  - 미설정이거나 API 실패 시 좌표·카카오맵 링크는 그대로 두고, 주소 문구만 비웁니다.

## 웹훅 JSON 본문 (요약)
- `text`: 사람이 읽는 한 줄 텍스트 블록 (`address=`, `coordinates=`, `kakao_map=` 등).
- `address`: 역지오코딩된 주소 문자열 또는 `null`.
- `latitude` / `longitude`: 숫자 또는 `null`.
- `kakaoMapUrl`: 카카오맵 웹 링크 또는 `null`.

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
