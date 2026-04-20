const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type HandoffPayload = {
  uid: string;
  url: string;
  exp: number;
  jti: string;
};

function toBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array | null {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  try {
    const binary = atob(padded);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

function randomHex(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signWithSecret(secret: string, message: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(new Uint8Array(signature));
}

export async function verifyWithSecret(secret: string, message: string, signatureB64Url: string): Promise<boolean> {
  const sig = fromBase64Url(signatureB64Url);
  if (!sig) return false;
  const key = await importHmacKey(secret);
  return crypto.subtle.verify("HMAC", key, new Uint8Array(sig), encoder.encode(message));
}

export async function mintNativeHandoffToken(input: {
  uid: string;
  url: string;
  expiresInSec: number;
  secret: string;
}): Promise<{ token: string; expiresAt: number; jti: string }> {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload: HandoffPayload = {
    uid: input.uid,
    url: input.url,
    exp: nowSec + Math.max(30, input.expiresInSec),
    jti: randomHex(16),
  };
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signatureB64 = await signWithSecret(input.secret, payloadB64);
  return {
    token: `${payloadB64}.${signatureB64}`,
    expiresAt: payload.exp,
    jti: payload.jti,
  };
}

export async function verifyNativeHandoffToken(input: {
  token: string;
  uid: string;
  url: string;
  secret: string;
}): Promise<{ ok: true; payload: HandoffPayload } | { ok: false; error: string }> {
  const [payloadB64, signatureB64] = input.token.split(".");
  if (!payloadB64 || !signatureB64) {
    return { ok: false, error: "invalid token format" };
  }
  const verified = await verifyWithSecret(input.secret, payloadB64, signatureB64);
  if (!verified) {
    return { ok: false, error: "invalid token signature" };
  }
  const bytes = fromBase64Url(payloadB64);
  if (!bytes) {
    return { ok: false, error: "invalid token payload" };
  }

  let payload: HandoffPayload;
  try {
    payload = JSON.parse(decoder.decode(bytes)) as HandoffPayload;
  } catch {
    return { ok: false, error: "invalid token payload json" };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < nowSec) {
    return { ok: false, error: "token expired" };
  }
  if (!payload.jti || typeof payload.jti !== "string") {
    return { ok: false, error: "missing token id" };
  }
  if (payload.uid !== input.uid || payload.url !== input.url) {
    return { ok: false, error: "token subject mismatch" };
  }
  return { ok: true, payload };
}
