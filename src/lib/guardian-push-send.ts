import type { D1Database } from "@cloudflare/workers-types";
import { buildPushHTTPRequest } from "@pushforge/builder";

export type GuardianFinderPushPayload = {
  title: string;
  body: string;
  /** 알림 클릭 시 이동 (루트 상대 경로 권장) */
  url: string;
  tag?: string;
};

/** scan.ts FinderAction 중 웹푸시 대상(오류 제외) */
export type GuardianPushFinderAction =
  | "call_click"
  | "sms_click"
  | "location_share_click"
  | "location_share_success";

function getVapidPrivateJWK(): JsonWebKey | null {
  const raw =
    typeof process !== "undefined" ? process.env?.VAPID_PRIVATE_KEY?.trim() : "";
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JsonWebKey;
  } catch {
    return null;
  }
}

/**
 * 보호자(owner)에게 등록된 기기로 Web Push 전송 (Edge/Workers 호환).
 * VAPID_PRIVATE_KEY 미설정 시 조용히 스킵. 구독 만료(410/404) 시 행 삭제.
 */
export async function sendGuardianWebPushToUser(
  db: D1Database,
  ownerUserId: string,
  payload: GuardianFinderPushPayload
): Promise<void> {
  const privateJWK = getVapidPrivateJWK();
  if (!privateJWK) return;

  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS guardian_push_subscriptions (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "user_id TEXT NOT NULL, " +
        "endpoint TEXT NOT NULL UNIQUE, " +
        "p256dh TEXT NOT NULL, " +
        "auth TEXT NOT NULL, " +
        "created_at DATETIME DEFAULT CURRENT_TIMESTAMP, " +
        "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
        ")"
    )
    .run()
    .catch(() => {});

  const contact =
    (typeof process !== "undefined" && process.env?.VAPID_CONTACT_MAILTO?.trim()) ||
    "mailto:support@linku.app";

  const { results } = await db
    .prepare(
      "SELECT endpoint, p256dh, auth FROM guardian_push_subscriptions WHERE user_id = ?"
    )
    .bind(ownerUserId)
    .all<{ endpoint: string; p256dh: string; auth: string }>();

  const path = payload.url.startsWith("/") ? payload.url : `/${payload.url}`;

  for (const row of results ?? []) {
    const subscription = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };

    try {
      const { endpoint, headers, body } = await buildPushHTTPRequest({
        privateJWK,
        subscription,
        message: {
          payload: {
            title: payload.title,
            body: payload.body,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            tag: payload.tag ?? "finder-alert",
            data: { url: path },
          },
          adminContact: contact,
          options: { ttl: 86_400, urgency: "high" },
        },
      });

      const res = await fetch(endpoint, { method: "POST", headers, body });
      if (res.status === 404 || res.status === 410) {
        await db
          .prepare("DELETE FROM guardian_push_subscriptions WHERE endpoint = ?")
          .bind(row.endpoint)
          .run()
          .catch(() => {});
      }
    } catch {
      /* 알림 실패는 발견자 UX를 막지 않음 */
    }
  }
}

/**
 * 발견자 행동 알림 — 웹훅과 동일 이벤트에 대응 (실패는 조용히 무시).
 */
export async function sendGuardianWebPushForFinderAction(
  db: D1Database,
  opts: {
    ownerUserId: string;
    petId: string;
    petName: string;
    action: GuardianPushFinderAction;
    addressLabel: string | null;
    latitude: number | null;
    longitude: number | null;
    /** 알림 클릭 시 이동 (루트 상대 경로 권장, 예: /profile/xxx?from=scan) */
    openPath: string;
  }
): Promise<void> {
  const path = opts.openPath.startsWith("/") ? opts.openPath : `/${opts.openPath}`;
  let title = "LinkU";
  let body = "";
  const { action, petName } = opts;

  if (action === "location_share_success") {
    title = `${petName}: 발견자 위치 도착`;
    body = opts.addressLabel?.trim()
      ? opts.addressLabel
      : opts.latitude != null && opts.longitude != null
        ? `좌표 ${opts.latitude.toFixed(5)}, ${opts.longitude.toFixed(5)}`
        : "위치가 전달되었습니다.";
  } else if (action === "call_click") {
    title = `${petName}: 발견자가 전화 안내를 눌렀어요`;
    body = "연락처를 확인해 주세요.";
  } else if (action === "sms_click") {
    title = `${petName}: 발견자가 문자 안내를 눌렀어요`;
    body = "연락처를 확인해 주세요.";
  } else {
    title = `${petName}: 발견자가 위치 보내기를 시도 중`;
    body = "완료 시 또 알림이 갈 수 있어요.";
  }

  await sendGuardianWebPushToUser(db, opts.ownerUserId, {
    title,
    body,
    url: path,
    tag: `finder-${opts.petId}-${action}`,
  });
}
