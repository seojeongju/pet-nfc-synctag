# NFC 앱 등록 — QA 시나리오 (웹 ↔ `petidconnect` 딥링크)

기준 문서: `NFC_APP_DEEPLINK_SPEC.md`, `NFC_APP_DEEPLINK_ONEPAGE_KO.md`  
검증 대상: 대시보드 `NFC 연결 관리` → **앱으로 NFC 등록하기**, Android 앱 딥링크 처리, 관리자 모니터링 로그

---

## 공통 전제

| 항목 | 내용 |
| --- | --- |
| 웹 | HTTPS, `NEXT_PUBLIC_APP_URL` 설정, `nfc/write` handoff는 서버에 `NFC_NATIVE_HANDOFF_SECRET` 필요(배포와 동일) |
| 앱 | `petidconnect://` 인텐트/앱 링크 등록, 테스트 빌드 설치 |
| 딥링크 우선순위 | UID가 있고 서버 handoff가 성공하면 `nfc/write`, 그 외 `nfc/pet` |
| 토큰 | `nfc/write`용 handoff 토큰 **유효 시간: 10분** (서버 `expiresInSec: 10 * 60`) |
| 웹 fallback 타이밍 | 딥링크 후 **약 1.2초** 내에 페이지가 숨겨지지 않으면 스토어 URL(설정 시) 또는 `/install?next=...`로 이동 |
| 모니터링 | `admin_action_logs`, `action = guardian_nfc_app_event` — `app_open_attempt`, `app_opened`, `store_fallback`, `install_page_fallback` |

---

## 시나리오 A — 정상 (앱 설치, 저장 1회로 완료)

**목표:** 딥링크로 앱 진입 → 화면에 UID·URL(및 `nfc/pet` 시 대상) 자동 반영 → 사용자가 **저장 한 번**으로 NFC 기록·연동 완료

### A-1) `nfc/write` (태그가 이미 웹에서 대상에 연결된 경우)

1. **준비:** 대시보드에서 대상 선택 → 태그 UID 입력 후 웹에서 **태그 연결(등록)** 을 먼저 완료해, DB상 해당 UID가 선택 대상에 묶여 있어야 handoff가 성공한다. (`prepareGuardianNfcNativeHandoff`는 “이미 연결된 태그”에 대해 토큰을 만든다.)
2. **실행:** **앱으로 NFC 등록하기** 클릭.
3. **기대 (웹):** 짧은 안내 메시지 후 `petidconnect://nfc/write?...`로 이동 시도, 탭/앱이 전면으로 전환되면 `app_opened` 로그(가시성 `hidden` 시)가 쌓일 수 있음.
4. **기대 (앱):** NFC 등록 화면, `uid`·`url`·`handoffToken`·`exp` 반영, 토큰 유효 시 저장(쓰기) 가능.
5. **기대 (결과):** 태그에 URL 기록·백엔드와 일치하는 연결 상태.

### A-2) `nfc/pet` (UID 없음 또는 handoff 실패 시 fallback)

1. **준비:** 대상만 선택하고 UID는 비우거나, handoff가 실패하는 조건(미연결 태그 UID 등)으로 `nfc/pet`만 나가는 경우.
2. **실행:** **앱으로 NFC 등록하기** 클릭.
3. **기대 (앱, `android-native-writer`):** `pet`·`elder` 등 허용 `kind`·`app_base`·`uid`로 `…/t/{uid}` 링크 prefill, **NFC 쓰기(Link-U) 화면에 머묾**(브라우저로 대시보드 열지 않음). UID가 없으면 직접 UID 입력·「번호만 넣고 주소 자동으로 만들기」로 이어감.
4. **기대 (결과):** [태그에 쓰기]로 NDEF URL 기록 완료(스펙상 “저장 1회” UX는 앱 구현에 따름).

---

## 시나리오 B — 앱 미설치 / 딥링크가 열리지 않음 (fallback)

**목표:** 앱이 없을 때 사용자가 **설치 경로**로 떨어지고, 가능하면 `next`로 **동일 딥링크 재시도**까지 이어짐

1. **준비:** 테스트기에서 앱 **삭제** 또는, 딥링크를 처리할 앱이 없는 상태.
2. **실행:** **앱으로 NFC 등록하기** 클릭.
3. **기대 (웹):** 앱이 열리지 않으면 약 1.2초 후  
   - `NEXT_PUBLIC_NFC_NATIVE_APP_STORE_URL`이 있으면 스토어로 이동하고 `store_fallback` 이벤트,  
   - 없으면 `/install?next=<원래딥링크>`로 이동하고 `install_page_fallback` 이벤트.
4. **기대 (설치 페이지):** `next`가 있을 때 **설치 후 앱 바로 열기**로 동일 `petidconnect://...` 재실행.
5. **기대 (사후):** 앱 설치 완료 후 그 버튼으로 다시 딥링크 → 시나리오 A로 이어져 최종 등록 완료.

---

## 시나리오 C — 토큰 만료 / 서명 오류 (`nfc/write`)

**목표:** `exp` 경과 후 또는 잘못된 `handoffToken`에 대해 **저장이 되지 않고** 사용자에게 재시도 루트(웹에서 다시 시도)가 안내됨

1. **준비:** `nfc/write` 딥링크를 **발급받은 뒤 10분 이상** 방치하거나, 앱에서 `exp`를 수동으로 과거로 바꾼 테스트 빌드로 검증.
2. **실행:** 앱에서 쓰기(저장) 시도.
3. **기대 (앱):** 저장(쓰기) 비활성 또는 거부, “웹에서 다시 **앱으로 NFC 등록하기**를 눌러 주세요” 등 **재발급 유도** 문구.
4. **기대 (웹):** 사용자가 대시보드에서 버튼을 다시 누르면 **새 handoff**로 정상 복구.

---

## 시나리오 D — 권한 거부 / 하드웨어 비가용 (앱·기기)

**목표:** NFC 끄기, OS 권한 거부, NFC 없는 기기에서도 **크래시 없이** 복구 경로가 있음

1. **준비 (앱/기기):**  
   - NFC off 또는 앱·OS **NFC 권한** 거부  
   - 또는 NFC 미지원/비가용 기기
2. **실행:** 딥링크로 진입한 뒤 쓰기(저장) 절차 시도.
3. **기대 (앱):** 설정으로 이동·권한 안내, **수동 입력/재시도** 등 스펙(`ONEPAGE`의 “오류 처리 기준”)에 맞는 UX, 앱이 종료·무응답이 되지 않을 것.
4. **참고 (웹 “브라우저에서 직접 등록”):** Web NFC 경로는 브라우저 **읽기/쓰기 권한 거부** 시 한글 오류(예: “NFC 권한이 거부되었습니다…”) — 앱퍼스트와 별도 검증 항목으로 둔다.

---

## 관리자 모니터링 확인 (선택 공통)

1. **플랫폼 관리자** → 모니터링 화면에서 “보호자 앱 실행 이벤트”(또는 동등 테이블)을 연다.
2. 테스트한 세션에 대해 `app_open_attempt` / `app_opened` / `store_fallback` / `install_page_fallback`가 기대대로 쌓이는지 확인(환경·필터에 따라 표시 시점이 다를 수 있음).
3. payload에 `subjectKind`, `petId`, `tenantId`, `userId`가 일관되게 남는지 점검.

---

## 요약 체크리스트

- [ ] **A** 앱 있음: `nfc/write`·`nfc/pet` 각각 진입·저장 1회·결과 OK  
- [ ] **B** 앱 없음: 1.2초 내 fallback, 스토어 또는 `/install?next=...`, `next`로 재오픈  
- [ ] **C** 토큰 만료/오류: 저장 막힘 + 웹 재시도로 복구  
- [ ] **D** 권한/하드웨어: 안내·복구, 비정상 종료 없음  
- [ ] (선택) 모니터링 이벤트 4종 확인

이 문서는 `linkTagSafe` / `prepareGuardianNfcNativeHandoff` / `DashboardNfcQuickRegisterCard`의 **현 구현**에 맞춰 두었으며, 앱 측 동작 세부(토스트, 화면명)는 네이티브 QA 문서에 추가해도 좋다.
