# 관리자 URL 기록 QA 체크리스트

기준일: 2026-04-25  
대상 화면: `/admin/nfc-tags/write-url`  
목표: Web NFC와 앱(딥링크) 경로가 모두 동일 운영 규칙(등록 UID, 감사 로그)으로 동작하는지 검증.

---

## 1) 사전 준비

- 관리자 계정 로그인 상태
- 인벤토리에 등록된 테스트 UID 최소 1개
- 테스트 태그(실물) + Android 기기(Chrome)
- (앱 경로 점검 시) Link-U 앱 설치 및 handoff 설정 활성화

권장 환경 변수 점검:

- `NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED=true` (앱 경로 활성화)
- `NFC_NATIVE_HANDOFF_SECRET` (서버)
- `NFC_NATIVE_APP_API_KEY` (서버/API)
- `NEXT_PUBLIC_APP_URL` (서비스 기준 URL)

---

## 2) 화면 진입 직후 확인

1. `/admin/nfc-tags/write-url` 접속
2. 상단 배지 상태 확인
   - `Web NFC 쓰기`
   - `Web NFC 읽기`
   - `앱(딥링크) 쓰기`
3. 기대 결과
   - 현재 기기에서 가능한 경로가 배지에 정확히 표시됨
   - 원점(origin) 불일치 시 경고 문구가 노출됨

---

## 3) UID 검증 흐름

1. UID 입력 (또는 NFC 읽기 버튼으로 채움)
2. 입력 필드 blur(포커스 아웃) 후 상태 확인
3. 기대 결과
   - 등록 UID: `인벤토리에 있음` + 기록될 URL 미리보기 노출
   - 미등록 UID: 등록 필요 메시지 노출
   - 비정상 형식 UID: 형식 경고 노출

---

## 4) Web NFC 기록 경로

1. `태그에 URL 기록 (Web NFC)` 실행
2. 태그 접촉 후 완료
3. 기대 결과
   - 성공 메시지 표시
   - 실패 시 오류 메시지 표시(권한/브라우저/기기)
   - `nfc_web_write` 감사 로그가 생성됨

실패 케이스 점검:

- Web NFC 미지원 브라우저에서 버튼 비활성/가이드 노출
- HTTPS/권한 이슈 시 사용자 행동 유도 문구 표시

---

## 5) 앱(딥링크) 기록 경로

1. `앱에서 쓰기 열기` 실행
2. 앱 전환 후 태그 기록 진행
3. 기대 결과
   - 앱 전환 성공
   - 기록 후 이력에서 `nfc_native_write` 확인 가능
   - 실패 시 원인 메시지가 화면/이력에서 파악 가능

---

## 6) 감사 로그 검증

### A. Web 쓰기

- 바로가기: `/admin/nfc-tags/history?action=nfc_web_write&days=7&success=all`
- 확인 항목:
  - `tagId`, 성공/실패, 시각, payload(clientError 포함 여부)

### B. 앱 쓰기

- 바로가기: `/admin/nfc-tags/history?action=nfc_native_write&days=7&success=all`
- 확인 항목:
  - `tagId`, 성공/실패, 시각, 플랫폼/버전 정보(payload)

---

## 7) 연결·감사 독립 페이징 회귀 체크

대상 화면: `/admin/nfc-tags/history`

- 상단 연결/해제 목록: `lpage`, `lps`
- 하단 감사 로그: `page` + 필터

확인 포인트:

- 상단 페이지 이동 시 하단 감사 페이지가 깨지지 않음
- 하단 필터 변경 시 상단 `lpage/lps`가 불필요하게 초기화되지 않음

---

## 8) 완료 기준

- Web NFC/앱 중 하나 이상으로 실제 태그 기록 성공
- 기록 성공/실패가 감사 로그에서 재현 가능
- 운영자가 URL 기록 실패 원인을 화면 문구 + 이력 payload로 1분 내 파악 가능

