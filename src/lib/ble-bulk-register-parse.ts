import { isValidBleMac, normalizeBleMac } from "@/lib/ble-mac-format";
import { isValidTagUidFormat, normalizeTagUid } from "@/lib/tag-uid-format";

export type BleBulkPairLine = {
  uid: string;
  bleMac: string | null;
};

export type ParseBleBulkPairsResult = {
  pairs: BleBulkPairLine[];
  invalidUidCount: number;
  invalidMacCount: number;
  duplicateUidInInput: number;
};

function pushUid(
  pairs: BleBulkPairLine[],
  seenUids: Set<string>,
  uidRaw: string,
  bleMac: string | null
): "ok" | "dup" | "invalid_uid" {
  const uid = normalizeTagUid(uidRaw);
  if (!uid || !isValidTagUidFormat(uid)) return "invalid_uid";
  if (seenUids.has(uid)) return "dup";
  seenUids.add(uid);
  pairs.push({ uid, bleMac });
  return "ok";
}

/**
 * 대량 등록 입력 파싱.
 * - `UID,MAC` 또는 `UID<TAB>MAC` 한 줄 (2번째가 MAC이면 쌍)
 * - `UID1,UID2,UID3` 한 줄 (쉼표로 UID만 나열 — 레거시)
 * - 줄바꿈으로 UID만 나열
 * - MAC만 별도 줄 목록은 `zipUidsWithBleMacLines`로 결합
 */
export function parseBleBulkPairLines(text: string): ParseBleBulkPairsResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const pairs: BleBulkPairLine[] = [];
  let invalidUidCount = 0;
  let invalidMacCount = 0;
  let duplicateUidInInput = 0;
  const seenUids = new Set<string>();

  for (const line of lines) {
    const parts = line.split(/[,\t]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) continue;

    if (parts.length === 1) {
      const r = pushUid(pairs, seenUids, parts[0] ?? "", null);
      if (r === "invalid_uid") invalidUidCount += 1;
      if (r === "dup") duplicateUidInInput += 1;
      continue;
    }

    const second = parts[1] ?? "";
    if (isValidBleMac(second)) {
      if (parts.length > 2) {
        // UID,MAC,extra — MAC 뒤 토큰은 무시하지 않고 오류로 처리하지 않되 MAC만 사용
      }
      const r = pushUid(pairs, seenUids, parts[0] ?? "", normalizeBleMac(second));
      if (r === "invalid_uid") invalidUidCount += 1;
      if (r === "dup") duplicateUidInInput += 1;
      continue;
    }

    // 2번째가 MAC이 아니면 쉼표 구분 UID 목록으로 해석
    let anyMacLooking = false;
    for (const part of parts) {
      if (isValidBleMac(part) && !isValidTagUidFormat(normalizeTagUid(part))) {
        anyMacLooking = true;
        break;
      }
    }
    if (anyMacLooking) {
      invalidMacCount += 1;
      continue;
    }

    for (const part of parts) {
      const r = pushUid(pairs, seenUids, part, null);
      if (r === "invalid_uid") invalidUidCount += 1;
      if (r === "dup") duplicateUidInInput += 1;
    }
  }

  return { pairs, invalidUidCount, invalidMacCount, duplicateUidInInput };
}

/** UID 목록과 같은 줄 수의 MAC 목록(빈 줄은 MAC 없음)을 zip */
export function zipUidsWithBleMacLines(
  uids: string[],
  macLinesText: string
): Map<string, string | null> {
  const macLines = macLinesText.split(/\r?\n/);
  const map = new Map<string, string | null>();

  uids.forEach((uid, i) => {
    const raw = (macLines[i] ?? "").trim();
    if (!raw) {
      map.set(uid, null);
      return;
    }
    if (isValidBleMac(raw)) {
      map.set(uid, normalizeBleMac(raw));
    }
  });

  return map;
}
