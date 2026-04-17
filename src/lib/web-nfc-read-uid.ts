import { isValidTagUidFormat, normalizeTagUid } from "@/lib/tag-uid-format";

type NdefReaderLike = {
  addEventListener(type: "reading", listener: (event: Event) => void): void;
  addEventListener(type: "readingerror", listener: () => void): void;
  scan(options?: { signal?: AbortSignal }): Promise<void>;
};

type NdefReadingEventLike = Event & {
  serialNumber?: string;
};

const DEFAULT_TIMEOUT_MS = 45_000;

export function isWebNfcReadSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as unknown as { NDEFReader?: new () => NdefReaderLike }).NDEFReader);
}

export type ReadNfcTagUidResult =
  | { ok: true; uid: string }
  | { ok: false; error: string };

export async function readNfcTagUidOnce(options?: {
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<ReadNfcTagUidResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "브라우저에서만 사용할 수 있습니다." };
  }
  const Ctor = (window as unknown as { NDEFReader?: new () => NdefReaderLike }).NDEFReader;
  if (!Ctor) {
    return {
      ok: false,
      error:
        "이 브라우저는 Web NFC 읽기(NDEFReader)를 지원하지 않습니다. Android Chrome(HTTPS)에서 시도하거나 UID를 직접 입력하세요.",
    };
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const ac = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    ac.abort();
  }, timeoutMs);

  if (options?.signal) {
    if (options.signal.aborted) {
      clearTimeout(timeoutId);
      return { ok: false, error: "취소되었습니다." };
    }
    options.signal.addEventListener(
      "abort",
      () => {
        ac.abort();
      },
      { once: true }
    );
  }

  const reader = new Ctor();
  let settled = false;

  return await new Promise<ReadNfcTagUidResult>((resolve) => {
    const finish = (r: ReadNfcTagUidResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      ac.abort();
      resolve(r);
    };

    const onReading = (event: Event) => {
      if (settled) return;
      const e = event as NdefReadingEventLike;
      const raw = typeof e.serialNumber === "string" ? e.serialNumber.trim() : "";
      if (!raw) {
        finish({
          ok: false,
          error:
            "태그는 인식됐지만 UID(시리얼)를 제공하지 않습니다. 다른 태그를 쓰거나 UID를 직접 입력해 주세요.",
        });
        return;
      }
      const uid = normalizeTagUid(raw);
      if (!isValidTagUidFormat(uid)) {
        finish({ ok: false, error: `읽은 값이 허용 형식이 아닙니다: ${raw}` });
        return;
      }
      finish({ ok: true, uid });
    };

    const onReadingError = () => {
      if (settled) return;
      finish({ ok: false, error: "NFC 읽기 오류입니다. 태그를 기기에 밀착한 뒤 다시 시도해 주세요." });
    };

    reader.addEventListener("reading", onReading);
    reader.addEventListener("readingerror", onReadingError);

    void reader.scan({ signal: ac.signal }).catch((err: unknown) => {
      if (settled) return;
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") {
        if (options?.signal?.aborted) {
          finish({ ok: false, error: "취소되었습니다." });
          return;
        }
        if (timedOut) {
          finish({
            ok: false,
            error: `${Math.round(timeoutMs / 1000)}초 안에 태그를 인식하지 못했습니다. 태그를 가까이 대고 다시 눌러 주세요.`,
          });
          return;
        }
        finish({ ok: false, error: "NFC 세션이 중단되었습니다. 다시 시도해 주세요." });
        return;
      }
      if (name === "NotAllowedError") {
        finish({ ok: false, error: "NFC 권한이 거부됐거나 대화 상자가 닫혔습니다." });
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      finish({ ok: false, error: msg || "NFC를 시작할 수 없습니다." });
    });
  });
}