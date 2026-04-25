"use client";

import Link from "next/link";
import { useState } from "react";
import { submitRequiredPrivacyConsent } from "@/app/actions/privacy-consent";

export function ConsentForm({ next, err }: { next: string; err: string }) {
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeLocation, setAgreeLocation] = useState(false);
  const [pending, setPending] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const allAgreed = agreeTerms && agreePrivacy && agreeLocation;
  const finalErr = localErr || err;

  const handleToggleAllAgree = (checked: boolean) => {
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeLocation(checked);
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLocalErr("");
        const form = new FormData();
        form.set("next", next);
        if (agreeTerms) form.set("agree_terms", "on");
        if (agreePrivacy) form.set("agree_privacy", "on");
        if (agreeLocation) form.set("agree_location", "on");

        setPending(true);
        try {
          await submitRequiredPrivacyConsent(form);
          window.location.assign(next);
        } catch (error) {
          setLocalErr(error instanceof Error ? error.message : "동의 저장에 실패했습니다.");
        } finally {
          setPending(false);
        }
      }}
      className="mt-6 space-y-4"
    >
      <input type="hidden" name="next" value={next} />

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          checked={allAgreed}
          onChange={(e) => handleToggleAllAgree(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span className="text-sm font-black text-slate-900">전체 동의 (필수 3항목)</span>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          name="agree_terms"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          className="mt-1 h-4 w-4"
          required
        />
        <span className="text-sm font-semibold text-slate-700">
          (필수) 서비스 이용약관에 동의합니다.{" "}
          <Link href="/legal/terms" className="font-black text-teal-700 underline">
            약관 보기
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          name="agree_privacy"
          checked={agreePrivacy}
          onChange={(e) => setAgreePrivacy(e.target.checked)}
          className="mt-1 h-4 w-4"
          required
        />
        <span className="text-sm font-semibold text-slate-700">
          (필수) 개인정보 처리방침에 동의합니다.{" "}
          <Link href="/legal/privacy" className="font-black text-teal-700 underline">
            방침 보기
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          name="agree_location"
          checked={agreeLocation}
          onChange={(e) => setAgreeLocation(e.target.checked)}
          className="mt-1 h-4 w-4"
          required
        />
        <span className="text-sm font-semibold text-slate-700">
          (필수) 위치·모니터링 데이터 처리(발견자 위치 공유, 기기 식별자 로그)를 이해하고 동의합니다.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-2xl bg-slate-900 text-sm font-black text-white hover:bg-teal-600 disabled:opacity-60"
      >
        동의하고 계속하기
      </button>
      {finalErr ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          {finalErr}
        </p>
      ) : null}
    </form>
  );
}

