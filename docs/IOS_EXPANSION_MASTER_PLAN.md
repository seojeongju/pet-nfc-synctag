# iOS 확장 고도화 개발 계획서 (Link-U Tag Writer)

## 상태 (기록)

- **현재:** 이 저장소의 네이티브 앱은 **Android(`android-native-writer`)만** 구현되어 있음.
- **필수:** **iOS 네이티브 앱(Swift + Core NFC 등) 개발은 아직 착수 전**이며, **제품 측면에서 진행이 필요한 후속 작업**으로 둔다(웹만으로는 iOS Safari Web NFC 쓰기 제약이 큼).
- **참고:** 본 문서가 iOS 쪽 범위·단계·기술 방향의 단일 계획서다. 착수 시 `docs/DEVELOPMENT_PLAN.md`와 함께 갱신한다.

---

본 문서는 현재 **Android 중심으로 구현된 네이티브 NFC 쓰기 경로**를 iOS까지 확장하기 위한 실행 계획입니다.  
목표는 “기존 Link-U 특화 기능 유지 + 범용 NFC 도구 확장 + iOS 동시 지원”입니다.

---

## 0. 목표와 원칙

### 목표

1. iOS 사용자도 Link-U 흐름에서 NFC 읽기/쓰기(가능 범위)를 수행할 수 있게 한다.
2. 기존 Android 앱의 Link-U 보안 흐름(handoff token, callback, audit)은 유지한다.
3. 장기적으로 “Link-U 모드 + 일반 NFC 도구 모드”를 iOS/Android 공통 UX로 수렴한다.

### 원칙

- **동의 우선:** 위치·설치·백그라운드 동작은 항상 명시적 동의 기반.
- **동작 범위 명확화:** iOS 정책으로 불가/제약인 기능은 문구로 선제 안내.
- **기능 격리:** Link-U 특화 로직과 범용 NFC 도구 로직을 모듈로 분리.
- **감사 가능성 유지:** 쓰기 시도/성공/실패가 서버 로그로 추적 가능해야 함.

---

## 1. 범위 정의 (iOS에서의 지원 수준)

### 필수 범위 (MVP)

- NFC 태그 **읽기**
  - UID(가능한 경우), NDEF 레코드(URI/Text) 표시
  - 복사/공유
- NFC 태그 **쓰기**
  - URI 쓰기 (Link-U URL 포함)
  - Text 쓰기
- Link-U 연동
  - handoff token 포함 딥링크/유니버설 링크 진입
  - 쓰기 결과 callback 업로드(API 동일 계약 재사용)

### 후속 범위 (MVP 이후)

- 멀티 레코드(URI + Text) 프리셋
- 배치 작업(여러 태그 순차 쓰기) UX
- 일반 사용자 모드(범용 도구) 정식 분리

### 비범위 (초기 제외)

- iOS에서 정책상 불안정한 백그라운드 자동 스캔/자동 업로드
- “사용자 무자각” 위치 전송

---

## 2. 제품 구조 제안 (듀얼 모드)

### 홈 진입

- `Link-U 모드` (기본)
  - 현재 서비스 연동/보호자 워크플로 중심
- `일반 NFC 도구 모드`
  - 누구나 읽기/쓰기 가능한 유틸 기능

### 공통 코어

- `nfc-core`: 읽기/쓰기 세션, NDEF 파싱/생성, 오류 코드 표준화
- `api-client`: native-write callback, handoff 검증 관련 호출
- `analytics`: 이벤트 스키마 공통화

### 모드별 모듈

- `feature-linku`: URL 자동 생성, handoff token, 서버 감사 로그 연동
- `feature-tools`: UID/NDEF 유틸, 기록 히스토리, 공유 기능

---

## 3. 기술 아키텍처 (iOS)

### 권장 선택

- **Native iOS(Swift + Core NFC) 별도 구현** 권장  
  (현재 Android 네이티브 앱과 책임이 유사하고, NFC 제약 대응이 명확함)

### 앱 진입 계약

- Android: `petidconnect://nfc/write?...` 유지
- iOS: `Universal Link` + `custom scheme` 이중 지원
  - 1순위: Universal Link
  - 2순위: custom scheme fallback

### 서버 계약 재사용

- `/api/admin/nfc/native-write` 계약 재사용
- header/body/handoffToken 검증 규칙 통일
- iOS `deviceId`, `platform=ios`, `appVersion` 필드 확장(선택)

### 보안

- Bearer key + handoff token 필수
- HMAC 서명 옵션 Android/iOS 공통화
- 키 저장은 iOS Keychain 사용

---

## 4. 단계별 실행 계획

## Phase 1 — 설계 고정 (1주)

- [ ] iOS 가능/제약 매트릭스 확정 (기기·iOS 버전 포함)
- [ ] URL scheme / Universal Link 도메인 정책 확정
- [ ] 오류 코드/문구 표준(한/영) 정의
- [ ] QA 체크리스트 초안 작성

**완료 기준:** 기술·정책 제약과 사용자 문구가 합의되어 개발 착수 가능.

## Phase 2 — iOS MVP 구현 (2~4주)

- [ ] Core NFC 읽기/쓰기 기본 흐름
- [ ] Link-U handoff 파라미터 파싱
- [ ] callback API 연동(성공/실패 업로드)
- [ ] 설정 화면(API base URL, API key, 디버그 로그)
- [ ] 최소 UI(쓰기 시작, 결과, 재시도, 오류 안내)

**완료 기준:** 실제 iPhone에서 URL 쓰기 + 서버 callback 성공.

## Phase 3 — 공통 UX 정렬 (1~2주)

- [ ] Android/iOS 화면 용어·상태명 통일
- [ ] “Link-U 모드 / 일반 도구 모드” 홈 분기 적용
- [ ] 이벤트 로그 스키마(Android/iOS) 통합
- [ ] 운영 대시보드에서 platform 분리 조회

**완료 기준:** 플랫폼간 주요 플로우와 로그가 동일 관점으로 운영 가능.

## Phase 4 — 스토어 출시 준비 (1~2주)

- [ ] 개인정보 처리방침/이용약관 iOS 반영
- [ ] App Store 심사용 메타데이터/스크린샷
- [ ] TestFlight(내부/외부) 피드백 반영
- [ ] 릴리스/롤백 플랜 및 모니터링 룰 배포

**완료 기준:** TestFlight 안정화 후 App Store 심사 제출 가능 상태.

---

## 5. QA·검증 계획

`docs/NFC_NATIVE_E2E_CHECKLIST.md`를 기반으로 iOS 항목을 추가해 통합 체크리스트로 운영합니다.

### 필수 시나리오

1. handoff 진입 → 태그 쓰기 성공 → callback 200
2. 잘못된 bearer/handoff/hmac 실패 처리
3. 앱 미설치 상태 fallback 링크 동작
4. 네트워크 불안정/오프라인 재시도
5. 다양한 태그 타입(최소 2종) 호환성

### 디바이스 매트릭스 권장

- iPhone 12/13/14/15 계열 최소 1대씩(가능 범위)
- 최신 iOS + 직전 iOS 버전

---

## 6. 운영 및 관측

### 이벤트(권장)

- `ios_handoff_opened`
- `ios_write_started`
- `ios_write_success`
- `ios_write_failed`
- `ios_callback_success`
- `ios_callback_failed`

### KPI

- handoff 대비 write 성공률
- write 성공 대비 callback 성공률
- 실패 상위 원인(권한/태그/네트워크/서명)
- 기기 모델별 실패율

---

## 7. 스토어 전략 제안

### 단일 앱 전략 (권장)

- 앱명: `Link-U Tag Writer`
- 설명: “Link-U 연동 + 범용 NFC 읽기/쓰기”
- 장점: 운영 단순, 브랜드 일관

### 이원 앱 전략 (대안)

- Link-U 전용 앱 + 범용 NFC 도구 앱 분리
- 장점: 타깃 분리 명확 / 단점: 운영·마케팅 비용 증가

---

## 8. 리스크 및 대응

1. **iOS NFC 제약 오해**
   - 대응: 기능 가능/불가를 앱 내 명시, FAQ 제공
2. **플랫폼별 UX 불일치**
   - 대응: 공통 상태명/문구/플로우 정의서 우선
3. **보안 설정 누락**
   - 대응: 릴리스 체크리스트에 키/서명 검증 항목 고정
4. **스토어 심사 지연**
   - 대응: 민감 기능 설명(위치/NFC 목적) 사전 준비

---

## 9. 즉시 실행 액션 (이번 스프린트)

- [ ] iOS 확장 브랜치 생성 및 설계 RFC 문서화
- [ ] Universal Link 도메인/경로 설계 확정
- [ ] callback API에 `platform` 필드 수용(후방 호환)
- [ ] iOS MVP 화면 와이어(3~4장) 확정
- [ ] TestFlight 내부 테스터 그룹 정의

---

## 10. 변경 이력

- 2026-04-23: 초안 작성 (iOS 확장 고도화 계획서)
