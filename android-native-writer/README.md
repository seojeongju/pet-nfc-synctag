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

## 3) 실행

1. Android Studio에서 `android-native-writer` 폴더 열기
2. Gradle sync
3. `app` 실행

## 4) 딥링크 테스트

아래 형태로 앱 실행:

`petidconnect://nfc/write?uid=04:A1:B2&url=https://example.com/t/04:A1:B2&handoffToken=...`

앱이 열리면 자동으로 태그 대기 상태가 되며, 태그를 대면 URL을 기록하고 서버 콜백을 전송합니다.

## 5) 웹 연동 포인트

웹에서 Web NFC 미지원(`NDEFWriter` 없음)일 때,

- 앱 설치됨: 딥링크로 즉시 실행
- 앱 미설치: Play 스토어(또는 내부 배포 링크) 이동

## 6) 주의사항

- 이 앱은 NFC 태그 **쓰기** 전용 MVP입니다.
- 배포 전 release signing / package name / 앱 아이콘 정리가 필요합니다.
