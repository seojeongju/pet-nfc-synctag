/**
 * Web NFC URL 기록 — Chromium은 스펙상 {@link https://developer.mozilla.org/en-US/docs/Web/API/NDEFReader/write NDEFReader.write}를 사용합니다.
 * 구형 초안의 `NDEFWriter` 전역은 현재 Chrome Android에 노출되지 않는 경우가 많습니다.
 */

export function isWebNfcWriteSupported(): boolean {
  if (typeof window === "undefined") return false;
  const Ctor = (window as unknown as { NDEFReader?: new () => unknown }).NDEFReader;
  if (!Ctor) return false;
  return typeof (Ctor.prototype as { write?: unknown }).write === "function";
}

export async function writeNfcUrlRecord(url: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof window === "undefined") return { ok: false, error: "NDEFReader를 사용할 수 없습니다." };
  const Ctor = (window as unknown as { NDEFReader?: new () => { write: (m: unknown) => Promise<void> } })
    .NDEFReader;
  if (!Ctor || typeof Ctor.prototype.write !== "function") {
    return { ok: false, error: "Web NFC 쓰기(NDEFReader.write) 미지원 브라우저" };
  }
  try {
    const ndef = new Ctor();
    await ndef.write({
      records: [{ recordType: "url", data: url }],
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
