"use client";

import { useMemo, useState } from "react";

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (v) => chars[v % chars.length]).join("");
}

export default function OwnerPasswordField() {
  const [password, setPassword] = useState(() => generatePassword());
  const [copied, setCopied] = useState(false);
  const helper = useMemo(() => (copied ? "복사됨" : "복사"), [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <input
        name="owner_password"
        required
        type="text"
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="조직관리자 초기 비밀번호 (8자 이상)"
        className="min-h-[48px] w-full touch-manipulation rounded-2xl border border-slate-200 px-4 text-base font-semibold sm:h-11 sm:text-sm"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPassword(generatePassword())}
          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
        >
          자동 생성
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="h-9 rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-black text-teal-700 hover:bg-teal-100"
        >
          {helper}
        </button>
        <p className="text-[11px] font-semibold text-slate-500">초기 비밀번호는 반드시 안전한 채널로 전달하세요.</p>
      </div>
    </div>
  );
}
