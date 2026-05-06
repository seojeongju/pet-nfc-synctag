# 보호자 Web Push (발견자 알림)

PWA/브라우저에 알림을 허용한 보호자에게, 발견자의 전화·문자·위치 관련 행동을 시스템 알림으로 보냅니다. 웹앱 탭을 닫아도 수신 가능합니다(브라우저·OS 정책 범위 내).

## 환경 변수

| 변수 | 공개 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 예 | 클라이언트 구독용 공개 키(Base64 URL). 미설정 시 대시보드에 「발견자 알림」카드가 나오지 않음. |
| `VAPID_PRIVATE_KEY` | 아니오 | 서버용 비밀 키 — **JSON Web Key 한 줄**(PushForge 형식). Cloudflare Pages **Secrets** 권장. |
| `VAPID_CONTACT_MAILTO` | 아니오 | VAPID subject. 예: `mailto:support@example.com`. 미설정 시 기본값 사용. |

키 생성(Edge 호환 `@pushforge/builder`):

```bash
npx @pushforge/builder vapid
```

표시되는 **Public Key** 문자열을 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`에, **Private Key(JSON 객체)** 를 한 줄로 이스케이프해 `VAPID_PRIVATE_KEY`에 넣습니다.  
(레거시 PEM/Base64 전용 `web-push generate-vapid-keys` 출력과 형식이 다릅니다.)

## 데이터베이스

마이그레이션: `migrations/0031_guardian_push_subscriptions.sql`

운영 D1에 적용:

```bash
npx wrangler d1 execute pet-id-db --remote --file=migrations/0031_guardian_push_subscriptions.sql
```

## 동작

1. 보호자가 대시보드에서 「알림 받기」→ 브라우저 알림 허용 → 구독이 `guardian_push_subscriptions`에 저장됩니다.
2. 발견자 행동이 `logFinderAction`으로 기록되고, 기존 웹훅(`GUARDIAN_ALERT_WEBHOOK_URL`)과 동일 쿨다운을 거친 뒤 **보호자(owner_id)**에게 Web Push를 보냅니다.
3. 서비스 워커는 `public/sw-push-listener.js`이며 `next.config.mjs`의 Workbox `importScripts`로 로드됩니다.

## 이벤트 (웹훅과 동일 범위, `location_share_error` 제외)

- `call_click`, `sms_click`, `location_share_click`, `location_share_success`

## 제한 사항

- iOS: 홈 화면에 추가한 PWA에서 Web Push 지원(버전에 따라 상이).
- 알림 클릭 시 프로필 경로로 이동합니다(`/profile/{petId}?from=scan`).
