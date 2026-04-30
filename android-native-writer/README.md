# Pet-ID NFC Native Writer (Android)

Web NFC (`NDEFWriter`)가 기기/브라우저에서 비활성일 때, 딥링크로 전달받은 URL을 NFC 태그에 기록하는 안드로이드 전용 앱입니다.

## 1) 준비

- Android Studio (Koala+)
- Android SDK 34
- 실제 NFC 지원 안드로이드 기기

## 2) 설정 파일

`local.properties.example`를 복사해 `local.properties`를 만들고 값 입력:

```properties
NATIVE_API_BASE_URL=https://your-domain.com
NATIVE_APP_API_KEY=replace_with_native_app_api_key
NATIVE_HMAC_SECRET_CURRENT=
NATIVE_HMAC_SECRET_NEXT=
```

- `NATIVE_API_BASE_URL`: 웹 서버 base URL (`/api/admin/nfc/native-write` 앞부분)
- `NATIVE_APP_API_KEY`: 서버 `NFC_NATIVE_APP_API_KEY`
- HMAC은 선택(서버에서 활성화했을 때만)

`local.properties`는 Gradle이 읽어 `BuildConfig`에 넣습니다. **빌드 없이** 바꾸려면 앱에서 **「서버 보고 설정」** 에 API URL·키를 저장해도 됩니다(SharedPreferences, 런타임 값이 우선).

## 3) 실행

1. Android Studio에서 `android-native-writer` 폴더 열기
2. Gradle sync
3. `app` 실행

## 4) 딥링크·수동 입력

### 4-1) 태그 쓰기(Link-U) — `…/nfc/write`

딥링크로 앱을 열면 **UID / URL / 토큰** 필드가 채워집니다. **「기록 시작」** 을 누른 뒤 태그를 대면 NDEF URL 쓰기가 진행됩니다.

`petidconnect://nfc/write?uid=04:A1:B2&url=https://example.com/t/...&handoffToken=...`

필드에 직접 붙여 넣어서 써도 됩니다. **「URL 자동(UID+사이트)」** 은 프로필 사이트(또는 API base)를 기준으로 `/t/{uid}` URL을 만듭니다.

**딥링크 vs 수동 입력:** `…/nfc/write`에 `uid`·`url`·`handoffToken`이 **셋 다** 있을 때만 필드를 덮어쓴다. 하나라도 비어 있으면 기존 입력은 유지되고, 안내 문구만 갱신된다.

### 4-2) 보호자 대시보드에서 온 `…/nfc/pet` (앱 퍼스트)

앱은 **브라우저로 보내지 않고**, `Link-U 연동(보호자)` NFC 쓰기 화면으로 진입하며 `app_base`·`uid`가 있으면 `…/t/{uid}` URL을 맞춰 둡니다(웹 `앱으로 NFC 등록하기`와 동일한 계약).

`petidconnect://nfc/pet?kind=pet&pet_id=<id>&tenant=<선택>&app_base=<https://…>&uid=<선택>`

- `kind`: `pet` | `elder` | `child` | `luggage` | `gold` (웹 `subjectKind`와 동일).
- `app_base`가 있으면 우선, 없으면 `local.properties` / 앱 **[Link-U 서비스에 기록]** 에 저장한 프로필/서비스 주소를 씀.
- `uid`가 있으면 `draftUrl`까지 채움(인증 토큰은 없음 → 태그에 쓰기만, 서버 `native-write` handoff는 생략).
- 상세(고급)로 접은 뒤 **「번호만 넣고 주소 자동으로 만들기」**로 URL을 만들 수 있음(UID가 비어 있을 때).

서버에 쓰기 완료를 보고하려면 `NFC_NATIVE_APP_API_KEY`·`NFC_NATIVE_HANDOFF_SECRET` 등이 서버에 맞게 설정돼 있어야 하며, 앱 쪽 API URL·키가 비어 있으면 **태그 쓰기는 성공해도 서버 보고는 건너뛰고** 안내만 합니다(개발용).

## 5) 웹 연동 포인트

웹에서 Web NFC 미지원(`NDEFWriter` 없음)일 때,

- 앱 설치됨: 딥링크로 즉시 실행
- 앱 미설치: Play 스토어(또는 내부 배포 링크) 이동

## 6) 주의사항

- 이 앱은 NFC 태그 **쓰기** 전용 MVP입니다.
- 배포 전 release signing / package name / 앱 아이콘 정리가 필요합니다.
