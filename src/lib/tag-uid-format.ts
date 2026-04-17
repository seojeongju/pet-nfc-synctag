/**
 * NFC tag UID normalization and validation (bulk register, server actions, Web NFC).
 */
export function normalizeTagUid(uid: string): string {
  return uid.trim().toUpperCase();
}

export function isValidTagUidFormat(uid: string): boolean {
  const hexWithColon = /^([0-9A-F]{2}:){3,15}[0-9A-F]{2}$/;
  const alnum = /^[A-Z0-9_-]{8,32}$/;
  return hexWithColon.test(uid) || alnum.test(uid);
}
