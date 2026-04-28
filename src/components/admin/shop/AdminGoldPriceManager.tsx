"use client";

import { useMemo, useState } from "react";
import { saveAdminGoldSettings, triggerGoldPriceFetch } from "@/app/actions/admin-shop";
import { cn } from "@/lib/utils";
import { RefreshCw, Save, AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  settings: {
    useAutoFetch: boolean;
    manualOverridePrice: number | null;
    lastFetchedAt: string | null;
  };
}

export function AdminGoldPriceManager({ settings }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [manualOverridePriceInput, setManualOverridePriceInput] = useState(
    settings.manualOverridePrice != null ? String(settings.manualOverridePrice) : ""
  );

  // 수동 연동 입력 도우미(클라이언트 계산 전용)
  const [base24kPerGram, setBase24kPerGram] = useState("");
  const [karat, setKarat] = useState<"24K" | "18K" | "14K" | "custom">("24K");
  const [customPurityPct, setCustomPurityPct] = useState("99.9");
  const [premiumPerGram, setPremiumPerGram] = useState("0");
  const [weightGrams, setWeightGrams] = useState("");
  const [laborFee, setLaborFee] = useState("0");

  const calc = useMemo(() => {
    const base = Number(base24kPerGram);
    const premium = Number(premiumPerGram);
    const weight = Number(weightGrams);
    const fee = Number(laborFee);

    const purityRatio =
      karat === "24K"
        ? 1
        : karat === "18K"
          ? 18 / 24
          : karat === "14K"
            ? 14 / 24
            : Math.max(0, Math.min(100, Number(customPurityPct))) / 100;

    const suggestedPerGram =
      Number.isFinite(base) && base > 0
        ? Math.max(0, Math.round(base * purityRatio + (Number.isFinite(premium) ? premium : 0)))
        : 0;

    const estimatedItemPrice =
      Number.isFinite(weight) && weight > 0
        ? Math.max(
            0,
            Math.round(suggestedPerGram * weight + (Number.isFinite(fee) ? fee : 0))
          )
        : null;

    return { purityRatio, suggestedPerGram, estimatedItemPrice };
  }, [base24kPerGram, karat, customPurityPct, premiumPerGram, weightGrams, laborFee]);

  async function handleFetch() {
    if (!confirm("지금 즉시 공공데이터 API에서 최신 금 시세를 가져오시겠습니까?")) return;
    setLoading(true);
    setMessage(null);
    try {
      const price = await triggerGoldPriceFetch();
      setMessage({ type: "success", text: `최신 시세를 성공적으로 가져왔습니다: ${price.toLocaleString()}원/g` });
    } catch (e: unknown) {
      const text =
        e instanceof Error ? e.message : "시세를 가져오는 중 오류가 발생했습니다.";
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold",
          message.type === "success" ? "border-teal-200 bg-teal-50 text-teal-800" : "border-rose-200 bg-rose-50 text-rose-800"
        )}>
          {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 mb-4">자동 연동 제어</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-800">공공데이터 자동 수집</p>
            <p className="text-xs text-slate-500 font-medium">매일 오전 정해진 시간에 시세를 자동으로 업데이트합니다.</p>
            {settings.lastFetchedAt && (
              <p className="mt-1 text-[10px] font-bold text-teal-600 uppercase">최근 수집: {new Date(settings.lastFetchedAt).toLocaleString("ko-KR")}</p>
            )}
          </div>
          <button
            onClick={handleFetch}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            지금 업데이트
          </button>
        </div>
      </section>

      <form action={saveAdminGoldSettings} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-black text-slate-900">시세 수동 설정 및 정책</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              name="use_auto_fetch" 
              defaultChecked={settings.useAutoFetch}
              className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <div>
              <p className="font-bold text-slate-800 group-hover:text-teal-700 transition">자동 연동 활성화</p>
              <p className="text-xs text-slate-500 font-medium">체크 해제 시 시스템은 수동으로 설정된 가격만 사용합니다.</p>
            </div>
          </label>

          <div className="pt-4 border-t border-slate-50">
            <label className="block mb-2">
              <span className="text-sm font-black text-slate-700">수동 고정 시세 (1g당 가격)</span>
              <p className="text-[11px] text-slate-500 font-semibold mb-3">값이 입력되어 있으면 자동 연동 시세보다 우선하여 적용됩니다. (비워두면 자동 시세 사용)</p>
              <div className="relative">
                <input
                  type="number"
                  name="manual_override_price"
                  value={manualOverridePriceInput}
                  onChange={(e) => setManualOverridePriceInput(e.target.value)}
                  placeholder="예: 105000"
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 focus:border-teal-500 focus:ring-teal-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">KRW / g</span>
              </div>
            </label>
          </div>
        </div>

        <section className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 space-y-4">
          <div>
            <p className="text-sm font-black text-amber-900">수동 연동 입력 도우미</p>
            <p className="text-[11px] font-semibold text-amber-800/80">
              24K 기준 시세와 순도/공임 정보를 넣으면 권장 1g 시세를 계산해 바로 반영할 수 있어요.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-black text-slate-700">24K 기준 시세 (원/g)</span>
              <input
                type="number"
                value={base24kPerGram}
                onChange={(e) => setBase24kPerGram(e.target.value)}
                placeholder="예: 145000"
                className="mt-1 w-full rounded-xl border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-black text-slate-700">금 함량(순도)</span>
              <select
                value={karat}
                onChange={(e) => setKarat(e.target.value as "24K" | "18K" | "14K" | "custom")}
                className="mt-1 w-full rounded-xl border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800"
              >
                <option value="24K">24K (99.9%)</option>
                <option value="18K">18K (75%)</option>
                <option value="14K">14K (58.5%)</option>
                <option value="custom">직접 입력</option>
              </select>
            </label>

            {karat === "custom" && (
              <label className="block sm:col-span-2">
                <span className="text-[11px] font-black text-slate-700">직접 순도 (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={customPurityPct}
                  onChange={(e) => setCustomPurityPct(e.target.value)}
                  placeholder="예: 99.9"
                  className="mt-1 w-full rounded-xl border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800"
                />
              </label>
            )}

            <label className="block">
              <span className="text-[11px] font-black text-slate-700">g당 가감값 (원)</span>
              <input
                type="number"
                value={premiumPerGram}
                onChange={(e) => setPremiumPerGram(e.target.value)}
                placeholder="예: 1200 (프리미엄/디스카운트)"
                className="mt-1 w-full rounded-xl border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-black text-slate-700">중량 (g)</span>
              <input
                type="number"
                step="0.01"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                placeholder="예: 3.75"
                className="mt-1 w-full rounded-xl border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-[11px] font-black text-slate-700">공임/추가비 (원)</span>
              <input
                type="number"
                value={laborFee}
                onChange={(e) => setLaborFee(e.target.value)}
                placeholder="예: 30000"
                className="mt-1 w-full rounded-xl border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800"
              />
            </label>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white px-4 py-3">
            <p className="text-[11px] font-bold text-slate-500">
              적용 순도: <span className="font-black text-slate-800">{(calc.purityRatio * 100).toFixed(1)}%</span>
            </p>
            <p className="text-sm font-black text-slate-900 mt-1">
              권장 수동 시세: {calc.suggestedPerGram.toLocaleString()}원 / g
            </p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
              예상 제품가:{" "}
              {calc.estimatedItemPrice != null
                ? `${calc.estimatedItemPrice.toLocaleString()}원`
                : "중량 입력 시 계산"}
            </p>
            <button
              type="button"
              onClick={() => setManualOverridePriceInput(String(calc.suggestedPerGram || ""))}
              className="mt-3 rounded-xl bg-amber-700 px-3 py-2 text-[11px] font-black text-white hover:bg-amber-800"
            >
              권장값을 수동 고정 시세에 반영
            </button>
          </div>
        </section>

        <div className="pt-4">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-black text-white transition hover:bg-teal-700 shadow-lg shadow-slate-200"
          >
            <Save className="h-4 w-4" />
            설정 저장하기
          </button>
        </div>
      </form>
    </div>
  );
}
