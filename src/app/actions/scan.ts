"use server";
import { getDB } from "@/lib/db";
import { reverseGeocodeToKoreanAddress } from "@/lib/kakao-geocode";

export async function updateScanLocation(tagId: string, lat: number, lng: number) {
  const db = getDB();
  const tag = await db
    .prepare(
      `SELECT t.id
       FROM tags t
       INNER JOIN pets p ON p.id = t.pet_id
       WHERE t.id = ? AND t.is_active = 1`
    )
    .bind(tagId)
    .first<{ id: string }>();
  if (!tag) {
    return { success: false as const, error: "invalid_tag" };
  }

  const result = await db
    .prepare(
      `UPDATE scan_logs
       SET latitude = ?, longitude = ?
       WHERE id = (SELECT id FROM scan_logs WHERE tag_id = ? ORDER BY scanned_at DESC LIMIT 1)`
    )
    .bind(lat, lng, tagId)
    .run();

  const changes = result.meta?.changes ?? 0;
  if (changes < 1) {
    return { success: false as const, error: "no_scan" };
  }

  return { success: true as const };
}

type FinderAction =
  | "call_click"
  | "sms_click"
  | "location_share_click"
  | "location_share_success"
  | "location_share_error";

function finderActionLabel(action: FinderAction): string {
  if (action === "call_click") return "전화 버튼 클릭";
  if (action === "sms_click") return "문자 버튼 클릭";
  if (action === "location_share_click") return "위치 공유 버튼 클릭";
  if (action === "location_share_success") return "위치 공유 성공";
  return "위치 공유 오류";
}

async function maybeSendGuardianRealtimeAlert(
  db: ReturnType<typeof getDB>,
  input: {
    action: FinderAction;
    tagId?: string | null;
    petId?: string | null;
    detail?: string | null;
    userAgent?: string | null;
    /** 위치 공유 성공 등 — 있으면 카카오로 역지오코딩해 주소를 알림에 포함 */
    latitude?: number | null;
    longitude?: number | null;
  }
) {
  const webhook = process.env.GUARDIAN_ALERT_WEBHOOK_URL?.trim();
  if (!webhook) return;

  // 위치 공유 오류는 운영 분석 지표로만 사용하고 실시간 알림은 보내지 않음
  if (input.action === "location_share_error") return;

  let resolvedPetId = input.petId?.trim() || null;
  if (!resolvedPetId && input.tagId) {
    const fromTag = await db
      .prepare("SELECT pet_id FROM tags WHERE id = ? LIMIT 1")
      .bind(input.tagId)
      .first<{ pet_id: string | null }>()
      .catch(() => null);
    resolvedPetId = fromTag?.pet_id ?? null;
  }
  if (!resolvedPetId) return;

  await db.prepare(
    "CREATE TABLE IF NOT EXISTS guardian_alert_state (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "pet_id TEXT NOT NULL, " +
      "action TEXT NOT NULL, " +
      "last_sent_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
      ")"
  ).run();

  const cooldownMins = input.action === "location_share_success" ? 1 : 3;
  const recent = await db
    .prepare(
      "SELECT id FROM guardian_alert_state " +
        "WHERE pet_id = ? AND action = ? " +
        "AND datetime(last_sent_at) >= datetime('now', ?) " +
        "ORDER BY datetime(last_sent_at) DESC LIMIT 1"
    )
    .bind(resolvedPetId, input.action, `-${cooldownMins} minutes`)
    .first<{ id: number }>()
    .catch(() => null);
  if (recent?.id) return;

  const pet = await db
    .prepare("SELECT name, emergency_contact FROM pets WHERE id = ? LIMIT 1")
    .bind(resolvedPetId)
    .first<{ name: string | null; emergency_contact: string | null }>()
    .catch(() => null);

  let addressLabel: string | null = null;
  const lat = input.latitude;
  const lng = input.longitude;
  if (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    const geo = await reverseGeocodeToKoreanAddress(lat, lng);
    if (geo) addressLabel = geo.label;
  }

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim() || "";
  const profileUrl = base ? `${base}/profile/${encodeURIComponent(resolvedPetId)}?from=scan` : "";
  const mapUrl =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
      ? `https://map.kakao.com/link/map/발견위치,${lat},${lng}`
      : "";
  const addressTextLine =
    addressLabel != null
      ? `address=${addressLabel}\n`
      : lat != null && lng != null
        ? `address=(주소 문구 없음 — REST 키·네트워크 확인)\n`
        : "";

  const text =
    `[Guardian Realtime Alert]\n` +
    `pet=${pet?.name ?? resolvedPetId}\n` +
    `action=${finderActionLabel(input.action)}\n` +
    addressTextLine +
    (lat != null && lng != null
      ? `coordinates=${lat},${lng}\n` +
        (mapUrl ? `kakao_map=${mapUrl}\n` : "")
      : "") +
    `emergency_contact=${pet?.emergency_contact ?? "n/a"}\n` +
    `tag_id=${input.tagId ?? "n/a"}\n` +
    `detail=${input.detail ?? "n/a"}\n` +
    `profile=${profileUrl || "n/a"}`;

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      address: addressLabel,
      latitude: lat != null && Number.isFinite(lat) ? lat : null,
      longitude: lng != null && Number.isFinite(lng) ? lng : null,
      kakaoMapUrl: mapUrl || null,
    }),
  }).catch(() => {
    // 알림 전송 실패는 사용자 흐름을 막지 않음
  });

  await db
    .prepare("INSERT INTO guardian_alert_state (pet_id, action) VALUES (?, ?)")
    .bind(resolvedPetId, input.action)
    .run()
    .catch(() => {});
}

export async function logFinderAction(input: {
  action: FinderAction;
  tagId?: string | null;
  petId?: string | null;
  detail?: string | null;
  userAgent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const db = getDB();
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS finder_action_logs (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "action TEXT NOT NULL, " +
      "tag_id TEXT, " +
      "pet_id TEXT, " +
      "detail TEXT, " +
      "user_agent TEXT, " +
      "created_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
      ")"
  ).run();

  await db
    .prepare(
      "INSERT INTO finder_action_logs (action, tag_id, pet_id, detail, user_agent) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(
      input.action,
      input.tagId ?? null,
      input.petId ?? null,
      input.detail ?? null,
      input.userAgent ?? null
    )
    .run();
  await maybeSendGuardianRealtimeAlert(db, input);

  return { ok: true as const };
}
