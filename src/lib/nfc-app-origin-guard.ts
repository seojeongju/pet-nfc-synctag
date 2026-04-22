/**
 * Guards NFC URL writes when NEXT_PUBLIC_APP_URL is set: client-built URLs must match the configured origin.
 */

export type NfcOriginMismatchMode = "block" | "advisory";

export function normalizeAppBaseUrl(raw: string | undefined | null): string {
  return (raw ?? "").trim().replace(/\/$/, "");
}

export function parseAppBaseOrigin(appBase: string): string | null {
  if (!appBase) return null;
  try {
    return new URL(appBase).origin;
  } catch {
    return null;
  }
}

/**
 * When NEXT_PUBLIC_APP_URL is empty, returns null (caller may use window.location.origin).
 * When set: invalid URL string, origin mismatch vs window, or OK.
 */
export function getNfcOriginMismatchMessage(
  configuredAppBaseRaw: string | undefined | null,
  windowOrigin: string,
  mode: NfcOriginMismatchMode = "block",
): string | null {
  const base = normalizeAppBaseUrl(configuredAppBaseRaw);
  if (!base) return null;
  const configuredOrigin = parseAppBaseOrigin(base);
  if (!configuredOrigin) {
    return mode === "block"
      ? "\uC11C\uBE44\uC2A4 \uC571 \uC8FC\uC18C(NEXT_PUBLIC_APP_URL) \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC6B4\uC601 \uC124\uC815\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694."
      : "NEXT_PUBLIC_APP_URL \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uD3EC \uD658\uACBD \uBCC0\uC218\uB97C \uD655\uC778\uD558\uC138\uC694.";
  }
  if (configuredOrigin === windowOrigin) return null;
  if (mode === "advisory") {
    return `\uC811\uC18D \uC8FC\uC18C(${windowOrigin})\uC640 NEXT_PUBLIC_APP_URL\uC758 \uB3C4\uBA54\uC778(${configuredOrigin})\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uC774 \uD654\uBA74\uC5D0\uC11C \uAE30\uB85D\uB418\uB294 URL\uC740 \uC11C\uBC84\uAC00 \uB0B4\uB824\uC8FC\uB294 \uAC12\uC774\uB77C \uB0B4\uC6A9\uC740 \uB9DE\uC744 \uC218 \uC788\uC9C0\uB9CC, \uAC00\uB2A5\uD558\uBA74 ${configuredOrigin}\uC73C\uB85C \uC811\uC18D\uD55C Chrome\uC5D0\uC11C \uC791\uC5C5\uD558\uB294 \uAC83\uC774 \uC88B\uC2B5\uB2C8\uB2E4.`;
  }
  return `\uC9C0\uAE08 \uC811\uC18D\uD55C \uC8FC\uC18C(${windowOrigin})\uC640 \uC11C\uBE44\uC2A4\uC5D0 \uC124\uC815\uB41C \uC8FC\uC18C(${configuredOrigin})\uAC00 \uB2EC\uB77C NFC \uAE30\uB85D\uC744 \uC9C4\uD589\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. ${configuredOrigin}(\uC73C)\uB85C \uC2DC\uC791\uD558\uB294 \uC8FC\uC18C\uB85C \uC811\uC18D\uD55C \uB4A4, \uC548\uB4DC\uB85C\uC774\uB4DC Chrome\uC5D0\uC11C \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.`;
}