# NFC Native Security Runbook

## 목적
- `nfc_native_write_rejected` 급증 시 운영자가 빠르게 원인 파악/복구할 수 있도록 표준 대응 절차를 정의한다.
- HMAC 키 로테이션 절차를 일관되게 수행해 서명 검증 실패 위험을 줄인다.

## 모니터링 기준
- **즉시 경보**
  - 최근 24시간 `nativeRejected24h > 0` (이미 모니터링 배너 표출)
  - 웹훅 `[NativeSecurity Reject Alert]` 수신
- **심화 점검 트리거**
  - 1시간 거절 건수(`last_1h`)가 5 이상
  - `invalid_signature`, `invalid_handoff_token`, `handoff_token_replay_or_expired` 비중이 50% 이상

## 1차 대응 절차 (5~10분)
1. 관리자 모니터링 페이지에서 `네이티브 콜백 거절` 카드와 `거절 사유 TOP` 확인
2. `admin/nfc-tags/history`에서 `nfc_native_write_rejected` 필터로 최근 30분 로그 확인
3. 아래 체크포인트를 순서대로 확인
   - `unauthorized_bearer`: 앱 API 키(`NFC_NATIVE_APP_API_KEY`) 불일치 여부
   - `invalid_signature`: 앱 서명키/타임스탬프 헤더 전송 여부
   - `invalid_handoff_token`: 웹 handoff 토큰 만료/uid-url 불일치 여부
   - `handoff_token_replay_or_expired`: 앱 재시도 로직의 중복 전송 여부
4. 원인 분류 후 조치(아래 2차 대응) 수행

## 2차 대응 절차 (원인별)

### A) unauthorized_bearer 급증
- 앱 설정의 bearer 값이 최신인지 확인
- 서버의 `NFC_NATIVE_APP_API_KEY` 회전 이력 확인
- 조치 후 테스트 콜백 1건 전송하여 200 응답 확인

### B) invalid_signature 급증
- 앱이 `x-native-timestamp`, `x-native-signature`를 전송하는지 확인
- 타임스탬프가 밀리초 epoch인지 확인 (서버 허용 오차: 5분)
- 앱의 HMAC 대상 문자열이 `${timestamp}.${rawBody}`인지 확인
- 서버 시크릿(`NFC_NATIVE_APP_HMAC_SECRET_CURRENT`, `_NEXT`) 설정 확인

### C) invalid_handoff_token 급증
- 서버 `NFC_NATIVE_HANDOFF_SECRET` 변경 이력 확인
- 앱이 deep link의 `handoffToken` 원문을 손상 없이 전달하는지 확인
- 앱 내부 재구성 URL이 handoff 시점 URL과 동일한지 확인

### D) handoff_token_replay_or_expired 급증
- 앱 재시도 정책에서 동일 handoff token 재사용 여부 확인
- 네트워크 재시도 시 새 handoff 발급 플로우 사용하도록 수정
- 장시간 백그라운드 후 복귀 시 토큰 재발급 유도

## HMAC 키 로테이션 체크리스트

### 사전 준비
- 앱 버전별 사용 키(`current`/`next`) 정책 공지
- 배포 시간대/롤백 담당자 지정

### 단계 1: 서버에 next 키 선반영
- `NFC_NATIVE_APP_HMAC_SECRET_CURRENT=<old>`
- `NFC_NATIVE_APP_HMAC_SECRET_NEXT=<new>`
- 앱은 `x-native-key-id: next` + `new` 키 서명 지원 버전 배포

### 단계 2: 점진 전환
- 모니터링에서 `invalid_signature` 증가 없는지 확인
- `keyId=next` 이벤트가 정상 유입되는지 확인

### 단계 3: current 승격
- `NFC_NATIVE_APP_HMAC_SECRET_CURRENT=<new>`
- `NFC_NATIVE_APP_HMAC_SECRET_NEXT`는 비우거나 차기 키로 교체
- 필요 시 레거시 `NFC_NATIVE_APP_HMAC_SECRET` 제거

### 단계 4: 사후 검증
- 30분간 reject 추이 관찰
- `nfc_native_write` 성공/실패 이벤트 정상 적재 확인

## 롤백 기준
- 10분 내 `invalid_signature`가 급격히 증가(예: 5건 이상)하면 즉시 롤백
- 롤백 시 `CURRENT`를 이전 키로 복구하고 앱 서명 키 설정도 동기화

## 운영 기록 템플릿
- 발생 시간:
- 감지 신호(배너/웹훅):
- 상위 거절 사유 TOP3:
- 원인:
- 조치:
- 복구 확인(테스트 콜백 결과):
- 후속 액션:
