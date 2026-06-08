# Link-U (Pet-ID Connect) — 프로그램 전체 개요

> **한눈에 보기용 통합 문서**  
> 상세·실행 계획은 각 링크 문서를 참고하세요.  
> **최종 갱신:** 2026-06-08

---

## 목차

1. [한 줄 정의](#1-한-줄-정의)
2. [시스템 구성](#2-시스템-구성)
3. [제품 라인업](#3-제품-라인업)
4. [사용자 역할](#4-사용자-역할)
5. [핵심 플로우](#5-핵심-플로우)
6. [기술 축·로드맵 방향](#6-기술-축로드맵-방향)
7. [개발 진행 현황](#7-개발-진행-현황)
8. [현재 우선순위](#8-현재-우선순위)
9. [주요 환경 변수](#9-주요-환경-변수)
10. [문서 인덱스](#10-문서-인덱스)

---

## 1. 한 줄 정의

**Link-U(링크유)**는 NFC 스마트 태그를 통해 **발견자가 앱 설치 없이** 보호자에게 연락하고, **동의 기반**으로 위치를 전달할 수 있게 하는 **보호자·발견자 연결 플랫폼**입니다.

| 항목 | 내용 |
|------|------|
| 저장소명 | Pet-ID Connect |
| 서비스 브랜드 | Link-U (링크유) |
| 운영 URL | `https://wow-linku.co.kr` |
| 배포 | Cloudflare Pages (GitHub Actions CI) |
| DB | Cloudflare D1 (SQLite) |
| 앱 배포 | **Google Play 미배포** — 내부/개발용 APK 테스트 ([`app-distribution.mdc`](../.cursor/rules/app-distribution.mdc)) |

---

## 2. 시스템 구성

```
┌─────────────────────────────────────────────────────────────────┐
│                        클라이언트                                │
├──────────────┬────────────────────┬───────────────────────────────┤
│ Next.js 웹앱  │ Android NFC Writer │ PWA + Service Worker        │
│ (보호자·발견자)│ (android-native-   │ (Web Push 알림)             │
│              │  writer)           │                               │
└──────┬───────┴─────────┬──────────┴──────────────┬──────────────┘
       │                 │ handoff + callback         │
       ▼                 ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Pages / Workers + D1                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
  카카오맵 SDK        보호자 알림 웹훅      서울동행맵 앱
```

| 레이어 | 기술·경로 |
|--------|-----------|
| 웹 프레임워크 | Next.js (App Router) |
| 인증 | Better Auth |
| 맵 | 카카오맵 JS SDK — `/api/kakao-map-config` |
| NFC 쓰기 | Web NFC → 실패 시 Android 네이티브 handoff |
| NFC 콜백 | `POST /api/admin/nfc/native-write` |
| 보호자 알림 | 웹훅 + Web Push (VAPID) |
| BLE (후속) | `POST /api/ble/events` |

---

## 3. 제품 라인업

5개 **보호 대상 모드** + 1개 **동행(접근성)** 모드.

| `subject_kind` | 브랜드 | 대상 | 핵심 가치 |
|----------------|--------|------|-----------|
| `pet` | 링크유-펫 | 반려동물 | NFC 인식표 → 즉시 연락, 실시간 알림 |
| `elder` | 링크유-메모리 | 어르신 | 연락처·위치 단서를 가족에게 안전 전달 |
| `child` | 링크유-키즈 | 아이 | 등교·외출 시 빠른 연결, 안심 구역·이탈 알림 |
| `luggage` | 링크유-러기지 | 수하물·캐리어 | 분실 시 발견자 → 주인 연락 |
| `gold` | 링크유-골드 | 주얼리·고가품 | 전자 보증서 + 분실 방지 연결 |
| `companion` | 링크유-동행 | 교통약자 | GPS·지하철역·시설·NFC 앵커 안내 |

**공통 원칙**

- 발견자: 로그인 없이 `/t/{태그UID}` 공개 연락 화면
- 보호자: `/dashboard/{kind}` 대시보드에서 등록·태그·알림 관리
- UI: 동일 링크유 브랜드 셸, 모드별 랜딩 카피만 다름 (`src/lib/mode-landing-content.ts`)

---

## 4. 사용자 역할

상세: [`AUTHORIZATION_POLICY.md`](./AUTHORIZATION_POLICY.md)

| 역할 | 설명 | 핵심 권한 |
|------|------|-----------|
| **슈퍼관리자** | 플랫폼 전체 운영 | 조직 생성, 전체 데이터·권한 관리 |
| **조직관리자** | 1개 조직 운영 (1인 1조직) | 소속 조직 멤버·태그·운영 데이터만 |
| **보호자(사용자)** | 로그인 일반 사용자 | 등록 모드 쓰기, 미등록 모드 읽기 전용 |
| **발견자** | 비로그인 공개 방문자 | 연락 화면만 (전화·문자·위치 동의) |

---

## 5. 핵심 플로우

### 5.1 발견자 (앱리스 — 메인 축)

```
[NFC 태그 접촉 또는 /t/UID URL]
        ↓
[공개 연락 화면] — 로그인 불필요
        ↓
[전화 / 문자 / 위치 공유(동의)]
        ↓
[보호자 알림] — 웹훅 + Web Push (쿨다운 적용)
```

- 위치: **OS 권한 + 사용자 명시 동의** 후에만 전달
- “항상 추적”이 아닌 **사건 대응(발견 즉시 연락)** 축

### 5.2 보호자

```
[회원가입/로그인]
        ↓
[대시보드 /dashboard/{kind}]
        ↓
[관리 대상 등록] → [NFC 태그 연결] → [프로필·안심구역·스캔 이력]
        ↓
[발견자 행동 알림 수신]
```

- 관리 대상당 **여러 NFC** 연결 가능 (`TagManageCard`)
- 대시보드 홈: `DashboardNfcQuickRegisterCard` (전 subject)

### 5.3 운영자 NFC (어드민)

```
[인벤토리 UID 등록]
        ↓
[Web NFC URL 쓰기 시도]
        ↓ (실패/미지원)
[「앱으로 기록」handoff] → Android 딥링크
        ↓
[NDEF 쓰기] → native-write 콜백
        ↓
[admin_action_logs 감사 이력]
```

상세: [`NFC_HYBRID_IMPLEMENTATION_PLAN.md`](./NFC_HYBRID_IMPLEMENTATION_PLAN.md)

### 5.4 링크유-동행 (교통약자)

```
[GPS] → 근처 지하철역 → 역 상세·시설·길찾기     ← 메인 (/wayfinder)
[NFC·QR] → 고정 지점 안내 (TTS·연락·지도)        ← 보조 (/wayfinder/s/{slug})
```

상세: [`WAYFINDER_SUBWAY_NAV.md`](./WAYFINDER_SUBWAY_NAV.md)

---

## 6. 기술 축·로드맵 방향

상세: [`TRACKING_PRODUCT_GOALS.md`](./TRACKING_PRODUCT_GOALS.md)

| 축 | 기술 | 앱 설치 | 상태 |
|----|------|---------|------|
| **앱리스 NFC+웹** | NFC → Instant-View | 발견자 불필요 | **실행 중 (메인)** |
| **보호자 웹** | 대시보드·태그·알림 | PWA 선택 | **실행 중** |
| **Android Tag Writer** | 네이티브 NDEF 쓰기 | 운영자/현장용 | **1단계 완료** |
| **B2C BLE** | RSSI 근접/이탈 추정 | 보호자 단말 | 옵션 레이어 |
| **B2B 크라우드** | BLE 업링크 네트워크 | 참여 단말 | 후속 |
| **Find My 클래스** | OS 네트워크 | 인증·규제 큼 | 후속 |
| **iOS 네이티브** | Core NFC | iOS 앱 필요 | **미착수** |

**내부 원칙**

1. 위치·설치는 항상 **명시적 동의**
2. “무자각 자동”, “전 세계 실시간” 등 과장 표현 금지
3. NFC 웹 축 = “최후 수단·최대 호환”, BLE/Find My = 옵션 레이어

---

## 7. 개발 진행 현황

메인 실행 계획: [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)

### 7.1 NFC · 보호자 (순차 3단계)

| 단계 | 내용 | 상태 |
|------|------|------|
| **1** | Android URL 수동 입력·NDEF 쓰기·서버 콜백 | **완료** |
| **2** | 보호자 웹 NFC 태그 관리 (목록·연결·해제) | **1차 완료** (비홈 경로 통일 후속) |
| **3** | 네이티브 → 웹 `#nfc` 딥링크 | **1차 구현** (앱 전용 API 미착수) |

### 7.2 NFC 하이브리드 (웹↔네이티브)

| Phase | 내용 | 상태 |
|-------|------|------|
| 1 | handoff 버튼·딥링크·`nfc_native_handoff` 로그 | 완료 |
| 2 | `native-write` 콜백 API | 완료 |
| 3 | 퍼널 KPI (web→native 복구율) | 완료 |
| 4 | handoff token·HMAC 서명 | **진행 중** |

### 7.3 Android 앱 (`android-native-writer`)

**완료:** Link-U/일반 NFC 단일 UI, Wi-Fi SSID 스캔, 보호자 연동 타일, 브랜딩  
**남은 권장:** Wi-Fi 신뢰도·접근성·실기기 QA  
**우선순위:** Android 추가 기능 < **웹앱 고도화**

### 7.4 웹앱 고도화 백로그

상세: [`WEB_APP_ENHANCEMENT_BACKLOG.md`](./WEB_APP_ENHANCEMENT_BACKLOG.md)

| 우선순위 | 항목 |
|----------|------|
| **A** | NFC UX 통일, handoff 피드백, 태그 이력 가독성 |
| **B** | 권한 안내, 어드민 대량 처리, 운영 알림(Slack 등) |

### 7.5 iOS 확장

상세: [`IOS_EXPANSION_MASTER_PLAN.md`](./IOS_EXPANSION_MASTER_PLAN.md)  
**상태:** 미착수 — Swift + Core NFC 별도 앱, Android와 동일 `native-write` 계약 재사용

### 7.6 링크유-동행 Wayfinder

| 단계 | 내용 | 상태 |
|------|------|------|
| 0 | 방문자 스팟 UX (`/wayfinder/s/{slug}`) | 완료 |
| 1 | GPS + 근처 지하철역 | 완료 |
| 2~4 | 역 시설 POI · NFC 앵커 · 공공데이터 | **2단계 진행 중** |
| 5 | 공공버스 실시간 도착 | 백로그 |
| R1 | 서울동행맵 연결 | 완료 |
| R2 | `/dashboard/companion` 독립 레인 | 완료 |
| R3 | 자주 가는 장소 (스팟 CRUD 대체) | 백로그 |

### 7.7 보호자 알림

| 채널 | 문서 | 이벤트 | 쿨다운 |
|------|------|--------|--------|
| 웹훅 | [`GUARDIAN_REALTIME_ALERTS.md`](./GUARDIAN_REALTIME_ALERTS.md) | 전화·문자·위치 공유 | 위치 성공 1분 / 그 외 3분 |
| Web Push | [`GUARDIAN_WEB_PUSH.md`](./GUARDIAN_WEB_PUSH.md) | 동일 (`location_share_error` 제외) | 동일 |

---

## 8. 현재 우선순위

문서 합의 기준 (2026-04~06):

1. **웹앱 고도화** — NFC UX 통일, handoff 피드백, 태그 이력
2. **동행 Wayfinder 2단계** — 역 시설 POI·맵 마커
3. **NFC 하이브리드 Phase 4** — handoff token·HMAC 보안 마무리
4. **2단계 후속** — 전 subject NFC 화면·문구 통일
5. **iOS** — 웹·Android 안정화 후 설계 착수

---

## 9. 주요 환경 변수

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_APP_URL` | 서비스 기본 URL (`https://wow-linku.co.kr`) |
| `BETTER_AUTH_URL` | 인증 콜백 (Cloudflare) |
| `NEXT_PUBLIC_KAKAO_MAP_JS_KEY` | 카카오맵 JS 키 |
| `NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED` | 웹 handoff 버튼 노출 |
| `NFC_NATIVE_HANDOFF_SECRET` | handoff 토큰 서명 |
| `NFC_NATIVE_APP_API_KEY` | native-write Bearer |
| `GUARDIAN_ALERT_WEBHOOK_URL` | 보호자 실시간 알림 웹훅 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push |
| `NEXT_PUBLIC_WAYFINDER_ENABLED` | 동행 기능 (미설정 시 ON) |

전체 목록: [`README.md`](../README.md)

---

## 10. 문서 인덱스

### 프로그램·계획

| 문서 | 용도 |
|------|------|
| **본 문서** (`PROGRAM_OVERVIEW.md`) | 전체 한눈에 보기 |
| [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) | 순차 개발 계획 (실행 메인) |
| [`TRACKING_PRODUCT_GOALS.md`](./TRACKING_PRODUCT_GOALS.md) | 제품 축·대외 문구 |
| [`WEB_APP_ENHANCEMENT_BACKLOG.md`](./WEB_APP_ENHANCEMENT_BACKLOG.md) | 웹 고도화 백로그 |

### NFC

| 문서 | 용도 |
|------|------|
| [`NFC_HYBRID_IMPLEMENTATION_PLAN.md`](./NFC_HYBRID_IMPLEMENTATION_PLAN.md) | 웹↔네이티브 운영 흐름 |
| [`NFC_APP_DEEPLINK_SPEC.md`](./NFC_APP_DEEPLINK_SPEC.md) | 딥링크 규격 |
| [`NFC_NATIVE_E2E_CHECKLIST.md`](./NFC_NATIVE_E2E_CHECKLIST.md) | E2E 검증 |
| [`NFC_NATIVE_SECURITY_RUNBOOK.md`](./NFC_NATIVE_SECURITY_RUNBOOK.md) | 보안 운영 |
| [`NFC_BLE_WEB_WRITING.md`](./NFC_BLE_WEB_WRITING.md) | 웹·BLE 쓰기 범위 |

### 플랫폼 확장

| 문서 | 용도 |
|------|------|
| [`IOS_EXPANSION_MASTER_PLAN.md`](./IOS_EXPANSION_MASTER_PLAN.md) | iOS 앱 계획 |
| [`H1_BLE_INTEGRATION.md`](./H1_BLE_INTEGRATION.md) | BLE 이벤트 계약 |

### 동행 (Wayfinder)

| 문서 | 용도 |
|------|------|
| [`WAYFINDER_SUBWAY_NAV.md`](./WAYFINDER_SUBWAY_NAV.md) | 동행 마스터 로드맵 |
| [`WAYFINDER_ACCESSIBLE_ROUTING_LINKS.md`](./WAYFINDER_ACCESSIBLE_ROUTING_LINKS.md) | 서울동행맵 연동 |
| [`WAYFINDER_SAVED_PLACES_PLAN.md`](./WAYFINDER_SAVED_PLACES_PLAN.md) | 즐겨찾기(R3) |
| [`WAYFINDER_BUS_REALTIME_PLAN.md`](./WAYFINDER_BUS_REALTIME_PLAN.md) | 버스 실시간 (백로그) |

### 운영·정책

| 문서 | 용도 |
|------|------|
| [`AUTHORIZATION_POLICY.md`](./AUTHORIZATION_POLICY.md) | RBAC 정책 |
| [`GUARDIAN_REALTIME_ALERTS.md`](./GUARDIAN_REALTIME_ALERTS.md) | 웹훅 알림 |
| [`GUARDIAN_WEB_PUSH.md`](./GUARDIAN_WEB_PUSH.md) | PWA 푸시 |
| [`app-distribution.mdc`](../.cursor/rules/app-distribution.mdc) | 앱 배포 전제 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-08 | 프로그램 전체 개요 통합 문서 최초 작성 |
