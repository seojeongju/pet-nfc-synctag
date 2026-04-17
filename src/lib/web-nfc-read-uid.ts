import { isValidTagUidFormat, normalizeTagUid } from "@/lib/tag-uid-format";

type NdefReaderLike = {
  addEventListener(type: "reading", listener: (event: Event) => void): void;
  addEventListener(type: "readingerror", listener: () => void): void;
  removeEventListener(type: "reading", listener: (event: Event) => void): void;
  removeEventListener(type: "readingerror", listener: () => void): void;
  scan(options?: { signal?: AbortSignal }): Promise<void>;
};

type NdefReadingEventLike = Event & {
  serialNumber?: string;
};

const DEFAULT_TIMEOUT_MS = 45_000;

function getNdefReaderCtor(): (new () => NdefReaderLike) | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { NDEFReader?: new () => NdefReaderLike }).NDEFReader ?? null;
}

export function isWebNfcReadSupported(): boolean {
  return Boolean(getNdefReaderCtor());
}

export type ReadNfcTagUidResult =
  | { ok: true; uid: string }
  | { ok: false; error: string };

export type NfcUidScanSession = {
  stop: () => void;
};

export async function readNfcTagUidOnce(options?: {
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<ReadNfcTagUidResult> {
  const Ctor = getNdefReaderCtor();
  if (!Ctor) {
    return {
      ok: false,
      error: "NDEFReader is not supported in this browser.",
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
      return { ok: false, error: "Cancelled." };
    }
    options.signal.addEventListener("abort", () => ac.abort(), { once: true });
  }

  const reader = new Ctor();
  let settled = false;

  return await new Promise<ReadNfcTagUidResult>((resolve) => {
    const finish = (result: ReadNfcTagUidResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      ac.abort();
      reader.removeEventListener("reading", onReading);
      reader.removeEventListener("readingerror", onReadingError);
      resolve(result);
    };

    const onReading = (event: Event) => {
      const e = event as NdefReadingEventLike;
      const raw = typeof e.serialNumber === "string" ? e.serialNumber.trim() : "";
      if (!raw) {
        finish({ ok: false, error: "Tag was read but serialNumber is empty." });
        return;
      }
      const uid = normalizeTagUid(raw);
      if (!isValidTagUidFormat(uid)) {
        finish({ ok: false, error: `Invalid UID format: ${raw}` });
        return;
      }
      finish({ ok: true, uid });
    };

    const onReadingError = () => {
      finish({ ok: false, error: "NFC reading error." });
    };

    reader.addEventListener("reading", onReading);
    reader.addEventListener("readingerror", onReadingError);

    void reader.scan({ signal: ac.signal }).catch((err: unknown) => {
      if (settled) return;
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") {
        if (options?.signal?.aborted) {
          finish({ ok: false, error: "Cancelled." });
          return;
        }
        if (timedOut) {
          finish({ ok: false, error: `No tag detected within ${Math.round(timeoutMs / 1000)}s.` });
          return;
        }
        finish({ ok: false, error: "NFC session was aborted." });
        return;
      }
      if (name === "NotAllowedError") {
        finish({ ok: false, error: "NFC permission denied." });
        return;
      }
      finish({ ok: false, error: err instanceof Error ? err.message : String(err) });
    });
  });
}

export async function startNfcUidScanSession(options: {
  onUid: (uid: string) => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}): Promise<{ ok: true; session: NfcUidScanSession } | { ok: false; error: string }> {
  const Ctor = getNdefReaderCtor();
  if (!Ctor) {
    return { ok: false, error: "NDEFReader is not supported in this browser." };
  }

  const ac = new AbortController();
  const reader = new Ctor();

  const stop = () => {
    if (!ac.signal.aborted) ac.abort();
  };

  if (options.signal) {
    if (options.signal.aborted) {
      return { ok: false, error: "Cancelled." };
    }
    options.signal.addEventListener("abort", stop, { once: true });
  }

  const onReading = (event: Event) => {
    const e = event as NdefReadingEventLike;
    const raw = typeof e.serialNumber === "string" ? e.serialNumber.trim() : "";
    if (!raw) {
      options.onError?.("Tag was read but serialNumber is empty.");
      return;
    }
    const uid = normalizeTagUid(raw);
    if (!isValidTagUidFormat(uid)) {
      options.onError?.(`Invalid UID format: ${raw}`);
      return;
    }
    options.onUid(uid);
  };

  const onReadingError = () => {
    options.onError?.("NFC reading error.");
  };

  reader.addEventListener("reading", onReading);
  reader.addEventListener("readingerror", onReadingError);

  try {
    await reader.scan({ signal: ac.signal });
  } catch (err: unknown) {
    reader.removeEventListener("reading", onReading);
    reader.removeEventListener("readingerror", onReadingError);
    const name = err instanceof Error ? err.name : "";
    if (name === "NotAllowedError") return { ok: false, error: "NFC permission denied." };
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  ac.signal.addEventListener(
    "abort",
    () => {
      reader.removeEventListener("reading", onReading);
      reader.removeEventListener("readingerror", onReadingError);
    },
    { once: true }
  );

  return { ok: true, session: { stop } };
}
