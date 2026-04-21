/**
 * NFC tag UID normalization and validation (bulk register, server actions, Web NFC).
 */
export function normalizeTagUid(uid: string): string {
  return uid.trim().toUpperCase();
}

export function isValidTagUidFormat(uid: string): boolean {
  /** NFC-A serial은 4/7/10바이트가 흔하고, 단말·브라우저별로 3바이트 등 짧은 값도 보고될 수 있음 */
  const hexWithColon = /^([0-9A-F]{2}:){2,15}[0-9A-F]{2}$/;
  const alnum = /^[A-Z0-9_-]{8,32}$/;
  return hexWithColon.test(uid) || alnum.test(uid);
}
