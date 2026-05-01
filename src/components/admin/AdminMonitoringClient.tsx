"use client";

import { useRef, useState, useTransition, type ComponentType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
import { CardContent } from "@/components/ui/card";
import {
  AdminTableHeadCell,
  AdminTableHeadRow,
  AdminTableRow,
} from "@/components/admin/ui/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import {
  Activity,
  BatteryWarning,
  MapPin,
  Radio,
  Search,
  ShieldAlert,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  acknowledgeMapTelemetryAlert,
  clearMapTelemetryAlertAcknowledge,
  getTagDiagnosticsForAdmin,
  updateMapTelemetryThresholds,
  updateTagBleMac,
  type TagDiagnosticResult,
} from "@/app/actions/admin-monitoring";
import type {
  LandingAutoRouteRow,
  GuardianNfcAppEventRow,
  LowBatteryRow,
  MapTelemetryHealthSummary,
  MapTelemetryAlertState,
  NativeRejectReasonRow,
  MapTelemetryThresholdAuditRow,
  MapTelemetryThresholds,
  MapTelemetryTrendPoint,
  MonitoringPageResult,
  RecentBleRow,
  RecentNfcScanRow,
  UnknownAccessRow,
} from "@/lib/admin-monitoring-data";
import { formatOwnerPrimaryLine, subjectKindShortLabel } from "@/lib/admin-uid-context";
import { AdminInlineContextBlock } from "@/components/admin/ui/AdminInlineContextBlock";

type Summary = {
  nfcScans24h: number;
  nfcScans7d: number;
  nfcWithLocation24h: number;
  unknownUidAccess7d: number;
  landingAutoRoutes7d: number;
  bleEvents24h: number;
  bleEvents7d: number;
  bleLostEvents7d: number;
  distinctPetsBatteryLow30d: number;
  nativeWriteFail24h: number;
  nativeWriteFail7d: number;
  nativeHandoff7d: number;
  nativeRejected24h: number;
  nativeRejected7d: number;
  finderCall24h: number;
  finderSms24h: number;
  finderLocationClick24h: number;
  finderLocationSuccess24h: number;
  finderLocationClick7d: number;
  finderLocationSuccess7d: number;
  guardianAlerts24h: number;
  guardianAlerts7d: number;
  tagsTotal: number;
  tagsActive: number;
  tagsUnsold: number;
};

export default function AdminMonitoringClient({
  summary,
  mapHealth,
  mapThresholds,
  mapAlertState,
  mapThresholdAudits,
  mapTrend,
  period,
  recentNfcPage,
  unknownAccessPage,
  autoRouteEventsPage,
  guardianNfcAppEventsPage,
  recentBle,
  lowBattery,
  nativeRejectTop,
}: {
  summary: Summary;
  mapHealth: MapTelemetryHealthSummary;
  mapThresholds: MapTelemetryThresholds;
  mapAlertState: MapTelemetryAlertState;
  mapThresholdAudits: MapTelemetryThresholdAuditRow[];
  mapTrend: MapTelemetryTrendPoint[];
  period: "1h" | "24h" | "7d";
  recentNfcPage: MonitoringPageResult<RecentNfcScanRow>;
  unknownAccessPage: MonitoringPageResult<UnknownAccessRow>;
  autoRouteEventsPage: MonitoringPageResult<LandingAutoRouteRow>;
  guardianNfcAppEventsPage: MonitoringPageResult<GuardianNfcAppEventRow>;
  recentBle: RecentBleRow[];
  lowBattery: LowBatteryRow[];
  nativeRejectTop: NativeRejectReasonRow[];
}) {
  const [uidQuery, setUidQuery] = useState("");
  const [diag, setDiag] = useState<TagDiagnosticResult | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [bleMacEdit, setBleMacEdit] = useState("");
  const [pending, startTransition] = useTransition();
  const [thresholdPending, startThresholdTransition] = useTransition();
  const [ackPending, startAckTransition] = useTransition();
  const router = useRouter();
  const [thresholdForm, setThresholdForm] = useState(mapThresholds);
  const chartRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const buildMonitoringHref = (next: { np?: number; up?: number; ap?: number; gp?: number; period?: "1h" | "24h" | "7d" }) => {
    const p = new URLSearchParams();
    const nextPeriod = next.period ?? period;
    if (nextPeriod !== "24h") p.set("period", nextPeriod);

    const np = next.np ?? recentNfcPage.page;
    const up = next.up ?? unknownAccessPage.page;
    const ap = next.ap ?? autoRouteEventsPage.page;
    const gp = next.gp ?? guardianNfcAppEventsPage.page;
    if (np > 1) p.set("np", String(np));
    if (up > 1) p.set("up", String(up));
    if (ap > 1) p.set("ap", String(ap));
    if (gp > 1) p.set("gp", String(gp));
    const qs = p.toString();
    return qs ? `/admin/monitoring?${qs}` : "/admin/monitoring";
  };

  const runLookup = () => {
    setDiagError(null);
    startTransition(async () => {
      try {
        const r = await getTagDiagnosticsForAdmin(uidQuery);
        setDiag(r);
        if (r.ok) setBleMacEdit(r.bleMac ?? "");
      } catch (e) {
        setDiag(null);
        setDiagError(e instanceof Error ? e.message : "조회에 실패했습니다.");
      }
    });
  };

  const saveBleMac = () => {
    if (!diag || !diag.ok) return;
    startTransition(async () => {
      try {
        await updateTagBleMac(diag.tagId, bleMacEdit || null);
        const r = await getTagDiagnosticsForAdmin(diag.tagId);
        setDiag(r);
      } catch (e) {
        setDiagError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      }
    });
  };

  const activationRate =
    summary.tagsTotal > 0
      ? ((summary.tagsActive / summary.tagsTotal) * 100).toFixed(1)
      : "0";
  const healthTone =
    mapHealth.errorRatePercent24h >= thresholdForm.dangerErrorRate ||
    mapHealth.timeoutRatePercent24h >= thresholdForm.dangerTimeoutRate ||
    mapHealth.offlineRatePercent24h >= thresholdForm.dangerOfflineRate
      ? "danger"
      : mapHealth.errorRatePercent24h >= thresholdForm.warningErrorRate ||
          mapHealth.timeoutRatePercent24h >= thresholdForm.warningTimeoutRate ||
          mapHealth.offlineRatePercent24h >= thresholdForm.warningOfflineRate
        ? "warning"
        : "ok";
  const healthToneClass =
    healthTone === "danger"
      ? "border-rose-200 bg-rose-50"
      : healthTone === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-teal-200 bg-teal-50";
  const topFailureLabel =
    mapHealth.topFailureReason === "timeout"
      ? "타임아웃"
      : mapHealth.topFailureReason === "offline"
        ? "오프라인"
        : mapHealth.topFailureReason === "error"
          ? "요청 실패"
          : "이상 없음";
  const trendMax = Math.max(1, ...mapTrend.map((p) => p.avgRefreshMs));
  const avgTrendPoints = mapTrend
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${idx * 14},${36 - (p.avgRefreshMs / trendMax) * 32}`)
    .join(" ");
  const errorTrendPoints = mapTrend
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${idx * 14},${36 - (Math.max(0, Math.min(100, p.errorRatePercent)) / 100) * 32}`)
    .join(" ");
  const timeoutTrendPoints = mapTrend
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${idx * 14},${36 - (Math.max(0, Math.min(100, p.timeoutRatePercent)) / 100) * 32}`)
    .join(" ");
  const activePoint = hoverIdx != null && mapTrend[hoverIdx] ? mapTrend[hoverIdx] : null;
  const ackUntilTs = mapAlertState.acknowledgedUntil ? Date.parse(mapAlertState.acknowledgedUntil) : 0;
  const ackActive = Boolean(ackUntilTs && !Number.isNaN(ackUntilTs) && Date.now() < ackUntilTs);
  const showDangerBanner = healthTone === "danger" && !ackActive;
  const showNativeRejectBanner = summary.nativeRejected24h > 0;
  const finderLocationSuccessRate24h =
    summary.finderLocationClick24h > 0
      ? Math.round((summary.finderLocationSuccess24h / summary.finderLocationClick24h) * 100)
      : 0;

  const saveThresholds = () => {
    startThresholdTransition(async () => {
      await updateMapTelemetryThresholds(thresholdForm);
      router.refresh();
    });
  };
  const acknowledgeAlert = () => {
    startAckTransition(async () => {
      await acknowledgeMapTelemetryAlert(60);
      router.refresh();
    });
  };
  const clearAcknowledge = () => {
    startAckTransition(async () => {
      await clearMapTelemetryAlertAcknowledge();
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 pb-[max(5rem,env(safe-area-inset-bottom,0px))] pt-2 lg:p-10 lg:pb-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-[1.35rem] font-black uppercase italic leading-tight tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
          NFC / BLE 모니터링
        </h1>
        <p className="max-w-2xl text-[14px] font-medium leading-relaxed text-slate-500 sm:text-xs lg:text-sm">
          UID·pet id 옆에 연결 프로필·보호자·테넌트 요약을 붙여 두었습니다. 이벤트·스캔·BLE 흐름을 한눈에
          보기 위함입니다.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Kpi
          icon={Tag}
          label="태그 총량 / 활성"
          value={`${summary.tagsTotal} / ${summary.tagsActive}`}
          sub={`활성화율 ${activationRate}%`}
          tone="teal"
        />
        <Kpi
          icon={Activity}
          label="NFC 스캔 (24h / 7d)"
          value={`${summary.nfcScans24h} / ${summary.nfcScans7d}`}
          sub={`위치 동의 ${summary.nfcWithLocation24h}건 (24h)`}
          tone="amber"
        />
        <Kpi
          icon={Radio}
          label="BLE 이벤트 (24h / 7d)"
          value={`${summary.bleEvents24h} / ${summary.bleEvents7d}`}
          sub={`이탈(추정) ${summary.bleLostEvents7d}건 (7d)`}
          tone="slate"
        />
        <Kpi
          icon={ShieldAlert}
          label="미등록 UID (7d)"
          value={String(summary.unknownUidAccess7d)}
          sub="DB에 없는 NFC 시도"
          tone="rose"
        />
        <Kpi
          icon={Search}
          label="랜딩 자동 진입 (7d)"
          value={String(summary.landingAutoRoutes7d)}
          sub="UID/BLE 기반 모드 자동 라우팅"
          tone="teal"
        />
        <Kpi
          icon={ShieldAlert}
          label="네이티브 기록 실패 (24h / 7d)"
          value={`${summary.nativeWriteFail24h} / ${summary.nativeWriteFail7d}`}
          sub={`핸드오프 ${summary.nativeHandoff7d}건 (7d)`}
          tone="rose"
        />
        <Kpi
          icon={ShieldAlert}
          label="네이티브 콜백 거절 (24h / 7d)"
          value={`${summary.nativeRejected24h} / ${summary.nativeRejected7d}`}
          sub="서명·토큰·리플레이 차단"
          tone="rose"
        />
        <Kpi
          icon={Activity}
          label="발견자 연락 클릭 (24h)"
          value={`${summary.finderCall24h} / ${summary.finderSms24h}`}
          sub="전화 클릭 / 문자 클릭"
          tone="teal"
        />
        <Kpi
          icon={MapPin}
          label="위치 공유 전환율 (24h)"
          value={`${finderLocationSuccessRate24h}%`}
          sub={`${summary.finderLocationSuccess24h}/${summary.finderLocationClick24h} (7d: ${summary.finderLocationSuccess7d}/${summary.finderLocationClick7d})`}
          tone="amber"
        />
        <Kpi
          icon={ShieldAlert}
          label="보호자 실시간 알림 발송"
          value={`${summary.guardianAlerts24h} / ${summary.guardianAlerts7d}`}
          sub="24h / 7d 웹훅 발송 건수"
          tone="rose"
        />
      </div>

      {showDangerBanner && (
        <AdminCard variant="subtle" className="border border-rose-200 bg-rose-50">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-rose-700">지도 상태 위험: 즉시 점검이 필요합니다.</p>
              <p className="text-[11px] font-bold text-rose-600 mt-1">
                실패율 {mapHealth.errorRatePercent24h}% / 타임아웃율 {mapHealth.timeoutRatePercent24h}% / 오프라인율 {mapHealth.offlineRatePercent24h}%
              </p>
            </div>
            <Button
              type="button"
              onClick={acknowledgeAlert}
              disabled={ackPending}
              className="h-9 text-[10px] font-black uppercase bg-rose-600 hover:bg-rose-700"
            >
              {ackPending ? "처리 중..." : "1시간 알림 숨기기"}
            </Button>
          </CardContent>
        </AdminCard>
      )}

      {ackActive && (
        <AdminCard variant="subtle" className="border border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-amber-700">지도 알림이 일시 무시 상태입니다.</p>
              <p className="text-[11px] font-bold text-amber-600 mt-1">
                만료 시각: {mapAlertState.acknowledgedUntil}
              </p>
            </div>
            <Button
              type="button"
              onClick={clearAcknowledge}
              disabled={ackPending}
              className="h-9 text-[10px] font-black uppercase bg-amber-600 hover:bg-amber-700"
            >
              {ackPending ? "처리 중..." : "즉시 재활성화"}
            </Button>
          </CardContent>
        </AdminCard>
      )}

      {showNativeRejectBanner && (
        <AdminCard variant="subtle" className="border border-rose-200 bg-rose-50">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-rose-700">네이티브 콜백 보안 거절 이벤트가 감지되었습니다.</p>
              <p className="text-[11px] font-bold text-rose-600 mt-1">
                최근 24시간 {summary.nativeRejected24h}건 / 7일 {summary.nativeRejected7d}건
              </p>
            </div>
            <a
              href="/admin/nfc-tags/history?action=nfc_native_write_rejected&days=7"
              className="inline-flex items-center justify-center h-9 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-[10px] font-black uppercase text-white"
            >
              감사 로그 확인
            </a>
          </CardContent>
          {nativeRejectTop.length > 0 && (
            <CardContent className="pt-0 pb-4 px-4">
              <div className="rounded-lg border border-rose-100 bg-white/80 p-3">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">거절 사유 TOP (7d)</p>
                <div className="grid gap-1">
                  {nativeRejectTop.map((row) => (
                    <div key={row.reason} className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">{row.reason}</span>
                      <span className="font-black text-rose-600">{row.count}건</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </AdminCard>
      )}

      <AdminCard variant="subtle">
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지도 건강도 ({mapHealth.windowLabel})</p>
            <div className="flex items-center gap-1">
              <a
                href={buildMonitoringHref({ period: "1h" })}
                className={cn("px-2 py-1 rounded-lg text-[10px] font-black", period === "1h" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500")}
              >
                1시간
              </a>
              <a
                href={buildMonitoringHref({ period: "24h" })}
                className={cn("px-2 py-1 rounded-lg text-[10px] font-black", period === "24h" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500")}
              >
                24시간
              </a>
              <a
                href={buildMonitoringHref({ period: "7d" })}
                className={cn("px-2 py-1 rounded-lg text-[10px] font-black", period === "7d" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500")}
              >
                7일
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={cn("rounded-xl border p-3", healthToneClass)}>
              <p className="text-[10px] text-slate-400 font-black">표본 수</p>
              <p className="text-lg font-black text-slate-900 mt-1">{mapHealth.samples24h}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[10px] text-slate-400 font-black">평균 지연</p>
              <p className="text-lg font-black text-slate-900 mt-1">{mapHealth.avgRefreshMs24h}ms</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
              <p className="text-[10px] text-rose-400 font-black">실패율 / 타임아웃율</p>
              <p className="text-lg font-black text-rose-600 mt-1">
                {mapHealth.errorRatePercent24h}% / {mapHealth.timeoutRatePercent24h}%
              </p>
            </div>
            <div className="rounded-xl bg-teal-50 border border-teal-100 p-3">
              <p className="text-[10px] text-teal-500 font-black">오프라인율 / 자동갱신 ON</p>
              <p className="text-lg font-black text-teal-600 mt-1">
                {mapHealth.offlineRatePercent24h}% / {mapHealth.autoRefreshOnRatePercent24h}%
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 lg:col-span-2">
              <p className="text-[10px] text-slate-400 font-black">실패 원인 Top</p>
              <p className="text-sm font-black text-slate-800 mt-1">{topFailureLabel}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[10px] text-slate-400 font-black">오류 샘플</p>
              <p className="text-sm font-black text-slate-800 mt-1">{mapHealth.errorSamples}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[10px] text-slate-400 font-black">타임아웃/오프라인</p>
              <p className="text-sm font-black text-slate-800 mt-1">
                {mapHealth.timeoutSamples} / {mapHealth.offlineSamples}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold">
            최근 수신: {mapHealth.lastReceivedAt ?? "없음"}
          </p>
          <div className="rounded-xl bg-white border border-slate-100 p-3 space-y-2">
            <p className="text-[10px] text-slate-400 font-black">평균 지연/실패율 추세</p>
            {mapTrend.length > 1 ? (
              <svg
                ref={chartRef}
                viewBox={`0 0 ${Math.max(20, (mapTrend.length - 1) * 14 + 4)} 40`}
                className="w-full h-16"
                onMouseMove={(e) => {
                  const el = chartRef.current;
                  if (!el || mapTrend.length === 0) return;
                  const rect = el.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const ratio = rect.width > 0 ? x / rect.width : 0;
                  const idx = Math.max(0, Math.min(mapTrend.length - 1, Math.round(ratio * (mapTrend.length - 1))));
                  setHoverIdx(idx);
                }}
                onMouseLeave={() => setHoverIdx(null)}
              >
                <path d={avgTrendPoints} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />
                <path d={errorTrendPoints} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                <path d={timeoutTrendPoints} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2" />
              </svg>
            ) : (
              <p className="text-[10px] font-bold text-slate-400">추세 데이터를 수집 중입니다.</p>
            )}
            {activePoint && (
              <p className="text-[10px] font-black text-slate-500">
                {activePoint.bucket} · 지연 {activePoint.avgRefreshMs}ms · 실패율 {activePoint.errorRatePercent}% · 타임아웃율 {activePoint.timeoutRatePercent}%
              </p>
            )}
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-600" />지연(ms)</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />실패율</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />타임아웃율</span>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-3">
            <p className="text-[10px] text-slate-400 font-black">임계치 설정 (%)</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              <label className="text-[10px] font-black text-slate-500">
                주의 실패율
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholdForm.warningErrorRate}
                  onChange={(e) => setThresholdForm((p) => ({ ...p, warningErrorRate: Number(e.target.value) || 0 }))}
                  className="h-9 mt-1"
                />
              </label>
              <label className="text-[10px] font-black text-slate-500">
                주의 타임아웃율
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholdForm.warningTimeoutRate}
                  onChange={(e) => setThresholdForm((p) => ({ ...p, warningTimeoutRate: Number(e.target.value) || 0 }))}
                  className="h-9 mt-1"
                />
              </label>
              <label className="text-[10px] font-black text-slate-500">
                주의 오프라인율
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholdForm.warningOfflineRate}
                  onChange={(e) => setThresholdForm((p) => ({ ...p, warningOfflineRate: Number(e.target.value) || 0 }))}
                  className="h-9 mt-1"
                />
              </label>
              <label className="text-[10px] font-black text-slate-500">
                위험 실패율
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholdForm.dangerErrorRate}
                  onChange={(e) => setThresholdForm((p) => ({ ...p, dangerErrorRate: Number(e.target.value) || 0 }))}
                  className="h-9 mt-1"
                />
              </label>
              <label className="text-[10px] font-black text-slate-500">
                위험 타임아웃율
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholdForm.dangerTimeoutRate}
                  onChange={(e) => setThresholdForm((p) => ({ ...p, dangerTimeoutRate: Number(e.target.value) || 0 }))}
                  className="h-9 mt-1"
                />
              </label>
              <label className="text-[10px] font-black text-slate-500">
                위험 오프라인율
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholdForm.dangerOfflineRate}
                  onChange={(e) => setThresholdForm((p) => ({ ...p, dangerOfflineRate: Number(e.target.value) || 0 }))}
                  className="h-9 mt-1"
                />
              </label>
            </div>
            <Button
              type="button"
              onClick={saveThresholds}
              disabled={thresholdPending}
              className="h-9 text-[10px] font-black uppercase tracking-wide"
            >
              {thresholdPending ? "저장 중..." : "임계치 저장"}
            </Button>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-3 space-y-2">
            <p className="text-[10px] text-slate-400 font-black">임계치 변경 이력</p>
            {mapThresholdAudits.length === 0 ? (
              <p className="text-[10px] font-bold text-slate-400">이력이 없습니다.</p>
            ) : (
              <div className="space-y-1.5">
                {mapThresholdAudits.map((row) => (
                  <div key={row.id} className="text-[10px] font-bold text-slate-500 flex items-center justify-between gap-2">
                    <span className="truncate">{row.actorEmail ?? "unknown"}</span>
                    <span className="shrink-0">{row.createdAt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </AdminCard>

      <AdminCard variant="section" className="p-5 lg:p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-widest">
          <Search className="w-4 h-4 text-teal-500" />
          CS · UID 진단
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          &quot;인식이 안 돼요&quot; 문의 시 마지막 NFC 수신 시각·위치 동의 여부, BLE 마지막 이벤트로
          하드웨어/설정을 가늠합니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="NFC UID (예: 04:A1:B2:...)"
            value={uidQuery}
            onChange={(e) => setUidQuery(e.target.value)}
            className="font-mono text-xs h-11"
            onKeyDown={(e) => e.key === "Enter" && runLookup()}
          />
          <Button
            type="button"
            onClick={runLookup}
            disabled={pending || !uidQuery.trim()}
            className="h-11 font-black uppercase text-[10px] tracking-widest shrink-0"
          >
            조회
          </Button>
        </div>
        {diagError && (
          <p className="text-xs text-rose-600 font-medium">{diagError}</p>
        )}
        {diag && !diag.ok && (
          <p className="text-xs text-slate-600">등록된 태그가 없습니다.</p>
        )}
        {diag && diag.ok && (
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className={cn(adminUi.subtleCard, "p-4 space-y-2")}>
              <p className="font-black text-slate-700 uppercase tracking-wide">NFC</p>
              <p>
                <span className="text-slate-400">마지막 스캔: </span>
                {diag.lastNfcScan?.at ?? "없음"}
              </p>
              <p className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-500" />
                {diag.lastNfcScan?.lat != null && diag.lastNfcScan?.lng != null
                  ? `${diag.lastNfcScan.lat.toFixed(5)}, ${diag.lastNfcScan.lng.toFixed(5)}`
                  : "위치 미전송"}
              </p>
              <p>
                <span className="text-slate-400">7일 스캔 수: </span>
                {diag.nfcScans7d}
              </p>
            </div>
            <div className={cn(adminUi.subtleCard, "p-4 space-y-2")}>
              <p className="font-black text-slate-700 uppercase tracking-wide">BLE / OTA</p>
              <p>
                <span className="text-slate-400">상태: </span>
                {diag.status ?? "—"}
              </p>
              <p>
                <span className="text-slate-400">마지막 BLE: </span>
                {diag.lastBleEvent
                  ? `${diag.lastBleEvent.at} · ${diag.lastBleEvent.type}`
                  : "없음"}
              </p>
              <p>
                <span className="text-slate-400">7일 이탈(추정): </span>
                {diag.bleLost7d}
              </p>
              <p>
                <span className="text-slate-400">펌웨어(raw): </span>
                {diag.firmwareHint ?? "—"}
              </p>
            </div>
            <div className={cn(adminUi.subtleCard, "p-4 space-y-2 md:col-span-2")}>
              <p className="font-black text-slate-700 uppercase tracking-wide">매핑 (NFC UID ↔ BLE MAC)</p>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <Input
                  className="font-mono text-[11px] h-10"
                  placeholder="AA:BB:CC:DD:EE:FF"
                  value={bleMacEdit}
                  onChange={(e) => setBleMacEdit(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 text-[10px] font-black uppercase"
                  onClick={saveBleMac}
                  disabled={pending}
                >
                  BLE MAC 저장
                </Button>
              </div>
              <p className="text-[10px] text-slate-400">
                보조 식별: {diag.petName ? `대상 ${diag.petName}` : "미연결(미판매 등)"}
              </p>
            </div>
          </div>
        )}
      </AdminCard>

      <div className="grid lg:grid-cols-3 gap-6">
        <Section title="최근 NFC 스캔" subtitle="등록 태그 기준 (위치는 동의 시)" icon={Activity}>
          <p className="px-2 pb-1 text-[10px] font-black text-slate-400">
            총 {recentNfcPage.total}건 · {recentNfcPage.page}/{Math.max(1, Math.ceil(recentNfcPage.total / recentNfcPage.pageSize))}페이지
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] lg:text-xs">
              <thead>
                <AdminTableHeadRow>
                  <AdminTableHeadCell>UID</AdminTableHeadCell>
                  <AdminTableHeadCell>연결 프로필</AdminTableHeadCell>
                  <AdminTableHeadCell>보호자·테넌트</AdminTableHeadCell>
                  <AdminTableHeadCell>시각</AdminTableHeadCell>
                  <AdminTableHeadCell>위치</AdminTableHeadCell>
                </AdminTableHeadRow>
              </thead>
              <tbody>
                {recentNfcPage.rows.length === 0 ? (
                  <AdminTableRow>
                    <td colSpan={5} className="p-4 text-slate-400 text-center">
                      데이터 없음
                    </td>
                  </AdminTableRow>
                ) : (
                  recentNfcPage.rows.map((r) => {
                    const kindLbl = subjectKindShortLabel(r.subject_kind);
                    const ownerPrimary = formatOwnerPrimaryLine(r.owner_name, r.owner_email);
                    const tenant = (r.tenant_name ?? "").trim();
                    return (
                      <AdminTableRow key={r.id}>
                        <td className="p-2 align-top max-w-[150px]">
                          <AdminInlineContextBlock
                            primary={r.tag_id}
                            sublines={[
                              r.pet_name
                                ? kindLbl
                                  ? `${r.pet_name} · ${kindLbl}`
                                  : r.pet_name
                                : "프로필 미연결",
                              ownerPrimary || null,
                              tenant ? `조직 ${tenant}` : null,
                            ]}
                          />
                        </td>
                        <td className="p-2 align-top min-w-[100px] max-w-[160px]">
                          {r.pet_name ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-black text-slate-800 leading-snug break-words">
                                {r.pet_name}
                              </span>
                              {kindLbl ? (
                                <span className="text-[9px] font-bold text-teal-600">{kindLbl}</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-amber-600 font-bold">프로필 미연결</span>
                          )}
                        </td>
                        <td className="p-2 align-top min-w-[140px] max-w-[260px]">
                          <div className="flex flex-col gap-1">
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                                등록 보호자
                              </span>
                              <span className="mt-0.5 block text-slate-700 break-all leading-snug">
                                {ownerPrimary || "—"}
                              </span>
                            </div>
                            {r.tenant_id || tenant ? (
                              <div className="border-t border-slate-100 pt-1 space-y-0.5">
                                <span className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                                  테넌트
                                </span>
                                {tenant ? (
                                  <span className="block font-bold text-slate-600 leading-snug">{tenant}</span>
                                ) : null}
                                {(() => {
                                  const slug = (r.tenant_slug ?? "").trim();
                                  const tid = (r.tenant_id ?? "").trim();
                                  if (!slug && !tid) return null;
                                  const line = slug && tid ? `${slug} · ${tid}` : slug || tid;
                                  return (
                                    <span
                                      className="block font-mono text-[9px] text-slate-400 break-all"
                                      title={tid || undefined}
                                    >
                                      {line}
                                    </span>
                                  );
                                })()}
                                {(r.tenant_members_summary ?? "").trim() ? (
                                  <p
                                    className="text-[9px] text-slate-500 leading-relaxed break-words"
                                    title={(r.tenant_members_summary ?? "").trim()}
                                  >
                                    <span className="font-black text-slate-400">멤버 </span>
                                    {(r.tenant_members_summary ?? "").trim()}
                                  </p>
                                ) : r.tenant_id ? (
                                  <span className="text-[9px] text-slate-400">멤버 없음</span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-2 whitespace-nowrap align-top">{r.scanned_at}</td>
                        <td className="p-2 align-top">{r.has_location ? "Y" : "—"}</td>
                      </AdminTableRow>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {recentNfcPage.total > 0 ? (
            <div className="px-2 pt-2">
              <AdminPagination
                aria-label="최근 NFC 스캔 페이지"
                currentPage={recentNfcPage.page}
                totalPages={Math.max(1, Math.ceil(recentNfcPage.total / recentNfcPage.pageSize))}
                buildHref={(p) => buildMonitoringHref({ np: p })}
              />
            </div>
          ) : null}
        </Section>

        <Section
          title="미등록 NFC 시도"
          subtitle="스캔 시점 DB 미등록 UID · 이후 태그가 등록되면 현재 연결 정보를 참고로 표시"
          icon={ShieldAlert}
        >
          <p className="px-2 pb-1 text-[10px] font-black text-slate-400">
            총 {unknownAccessPage.total}건 · {unknownAccessPage.page}/{Math.max(1, Math.ceil(unknownAccessPage.total / unknownAccessPage.pageSize))}페이지
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] lg:text-xs">
              <thead>
                <AdminTableHeadRow>
                  <AdminTableHeadCell>UID</AdminTableHeadCell>
                  <AdminTableHeadCell>시각</AdminTableHeadCell>
                  <AdminTableHeadCell>IP</AdminTableHeadCell>
                </AdminTableHeadRow>
              </thead>
              <tbody>
                {unknownAccessPage.rows.length === 0 ? (
                  <AdminTableRow>
                    <td colSpan={3} className="p-4 text-slate-400 text-center">
                      기록 없음
                    </td>
                  </AdminTableRow>
                ) : (
                  unknownAccessPage.rows.map((r) => {
                    const matched = Boolean((r.matched_tag_id ?? "").trim());
                    const unknownSublines = matched
                      ? [
                          "현재 DB에 태그 있음 (스캔 당시는 미등록이었을 수 있음)",
                          (r.pet_name ?? "").trim()
                            ? subjectKindShortLabel(r.subject_kind)
                              ? `${(r.pet_name ?? "").trim()} · ${subjectKindShortLabel(r.subject_kind)}`
                              : (r.pet_name ?? "").trim()
                            : "프로필 미연결 태그",
                          formatOwnerPrimaryLine(r.owner_name, r.owner_email) || null,
                          (r.tenant_name ?? "").trim() ? `조직 ${(r.tenant_name ?? "").trim()}` : null,
                          (r.tenant_members_summary ?? "").trim()
                            ? `멤버 ${(r.tenant_members_summary ?? "").trim()}`
                            : null,
                        ]
                      : ["스캔 시점 DB 미등록 UID"];
                    return (
                      <AdminTableRow key={r.id}>
                        <td className="p-2 align-top max-w-[200px]">
                          <AdminInlineContextBlock primary={r.tag_uid} sublines={unknownSublines} />
                        </td>
                        <td className="p-2 whitespace-nowrap">{r.created_at}</td>
                        <td className="p-2 font-mono truncate max-w-[120px]">{r.ip_address ?? "—"}</td>
                      </AdminTableRow>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {unknownAccessPage.total > 0 ? (
            <div className="px-2 pt-2">
              <AdminPagination
                aria-label="미등록 NFC 시도 페이지"
                currentPage={unknownAccessPage.page}
                totalPages={Math.max(1, Math.ceil(unknownAccessPage.total / unknownAccessPage.pageSize))}
                buildHref={(p) => buildMonitoringHref({ up: p })}
              />
            </div>
          ) : null}
        </Section>

        <Section title="랜딩 자동 진입 로그" subtitle="source · mode · 로그인 여부" icon={Search}>
          <p className="px-2 pb-1 text-[10px] font-black text-slate-400">
            총 {autoRouteEventsPage.total}건 · {autoRouteEventsPage.page}/{Math.max(1, Math.ceil(autoRouteEventsPage.total / autoRouteEventsPage.pageSize))}페이지
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] lg:text-xs">
              <thead>
                <AdminTableHeadRow>
                  <AdminTableHeadCell>소스</AdminTableHeadCell>
                  <AdminTableHeadCell>모드</AdminTableHeadCell>
                  <AdminTableHeadCell>인증</AdminTableHeadCell>
                  <AdminTableHeadCell>시각</AdminTableHeadCell>
                </AdminTableHeadRow>
              </thead>
              <tbody>
                {autoRouteEventsPage.rows.length === 0 ? (
                  <AdminTableRow>
                    <td colSpan={4} className="p-4 text-slate-400 text-center">
                      기록 없음
                    </td>
                  </AdminTableRow>
                ) : (
                  autoRouteEventsPage.rows.map((r) => (
                    <AdminTableRow key={r.id}>
                      <td className="p-2 font-mono">{r.source}</td>
                      <td className="p-2 font-mono">{r.resolved_kind}</td>
                      <td className="p-2">{r.authenticated ? "Y" : "N"}</td>
                      <td className="p-2 whitespace-nowrap">{r.created_at}</td>
                    </AdminTableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {autoRouteEventsPage.total > 0 ? (
            <div className="px-2 pt-2">
              <AdminPagination
                aria-label="랜딩 자동 진입 로그 페이지"
                currentPage={autoRouteEventsPage.page}
                totalPages={Math.max(1, Math.ceil(autoRouteEventsPage.total / autoRouteEventsPage.pageSize))}
                buildHref={(p) => buildMonitoringHref({ ap: p })}
              />
            </div>
          ) : null}
        </Section>
      </div>

      <Section title="보호자 앱 실행 이벤트" subtitle="앱 실행 시도/성공/스토어 fallback" icon={Activity}>
        <p className="px-2 pb-1 text-[10px] font-black text-slate-400">
          총 {guardianNfcAppEventsPage.total}건 · {guardianNfcAppEventsPage.page}/{Math.max(1, Math.ceil(guardianNfcAppEventsPage.total / guardianNfcAppEventsPage.pageSize))}페이지
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] lg:text-xs">
            <thead>
              <AdminTableHeadRow>
                <AdminTableHeadCell>이벤트</AdminTableHeadCell>
                <AdminTableHeadCell>모드</AdminTableHeadCell>
                <AdminTableHeadCell>연결 맥락</AdminTableHeadCell>
                <AdminTableHeadCell>시각</AdminTableHeadCell>
              </AdminTableHeadRow>
            </thead>
            <tbody>
              {guardianNfcAppEventsPage.rows.length === 0 ? (
                <AdminTableRow>
                  <td colSpan={4} className="p-4 text-slate-400 text-center">
                    기록 없음
                  </td>
                </AdminTableRow>
              ) : (
                guardianNfcAppEventsPage.rows.map((r) => {
                  const petKind = subjectKindShortLabel(r.pet_subject_kind ?? r.subject_kind);
                  const tenantSlug = (r.tenant_slug ?? "").trim();
                  const tenantId = (r.tenant_id ?? "").trim();
                  const tenantLine =
                    tenantSlug && tenantId ? `${tenantSlug} · ${tenantId}` : tenantSlug || tenantId || "";
                  const tenantDisplayName = (r.tenant_name ?? "").trim();
                  const tenantPrimary = tenantLine || tenantId || tenantSlug || tenantDisplayName || "";
                  return (
                    <AdminTableRow key={r.id}>
                      <td className="p-2 font-mono align-top">{r.event}</td>
                      <td className="p-2 align-top">{r.subject_kind ?? "—"}</td>
                      <td className="p-2 align-top max-w-[min(100vw,320px)] space-y-2">
                        {r.pet_id ? (
                          <AdminInlineContextBlock
                            primary={r.pet_id}
                            sublines={[
                              r.pet_name
                                ? petKind
                                  ? `${r.pet_name} · ${petKind}`
                                  : r.pet_name
                                : null,
                              formatOwnerPrimaryLine(r.owner_name, r.owner_email) || null,
                            ]}
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400">pet_id 없음</span>
                        )}
                        {tenantPrimary || (r.tenant_members_summary ?? "").trim() ? (
                          <AdminInlineContextBlock
                            primary={tenantPrimary || "—"}
                            sublines={[
                              tenantDisplayName && tenantPrimary !== tenantDisplayName
                                ? `조직 ${tenantDisplayName}`
                                : null,
                              (r.tenant_members_summary ?? "").trim()
                                ? `멤버 ${(r.tenant_members_summary ?? "").trim()}`
                                : null,
                            ]}
                          />
                        ) : null}
                        {r.user_id || formatOwnerPrimaryLine(r.actor_name, r.actor_email) ? (
                          <AdminInlineContextBlock
                            primary={
                              formatOwnerPrimaryLine(r.actor_name, r.actor_email) || r.user_id || "—"
                            }
                            primaryMono={!formatOwnerPrimaryLine(r.actor_name, r.actor_email)}
                            sublines={
                              formatOwnerPrimaryLine(r.actor_name, r.actor_email) && r.user_id
                                ? [`user_id ${r.user_id}`]
                                : undefined
                            }
                          />
                        ) : null}
                      </td>
                      <td className="p-2 whitespace-nowrap align-top">{r.created_at}</td>
                    </AdminTableRow>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {guardianNfcAppEventsPage.total > 0 ? (
          <div className="px-2 pt-2">
            <AdminPagination
              aria-label="보호자 앱 실행 이벤트 페이지"
              currentPage={guardianNfcAppEventsPage.page}
              totalPages={Math.max(1, Math.ceil(guardianNfcAppEventsPage.total / guardianNfcAppEventsPage.pageSize))}
              buildHref={(p) => buildMonitoringHref({ gp: p })}
            />
          </div>
        ) : null}
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="저전력 후보 (30일)" subtitle="battery_low 유형 이벤트 기준" icon={BatteryWarning}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] lg:text-xs">
              <thead>
                <AdminTableHeadRow>
                  <AdminTableHeadCell>프로필·연결</AdminTableHeadCell>
                  <AdminTableHeadCell>마지막 시각</AdminTableHeadCell>
                </AdminTableHeadRow>
              </thead>
              <tbody>
                {lowBattery.length === 0 ? (
                  <AdminTableRow>
                    <td colSpan={2} className="p-4 text-slate-400 text-center">
                      해당 없음
                    </td>
                  </AdminTableRow>
                ) : (
                  lowBattery.map((r) => {
                    const lk = subjectKindShortLabel(r.subject_kind);
                    return (
                      <AdminTableRow key={r.pet_id}>
                        <td className="p-2 align-top max-w-[280px]">
                          <AdminInlineContextBlock
                            primary={r.pet_id}
                            sublines={[
                              r.pet_name
                                ? lk
                                  ? `${r.pet_name} · ${lk}`
                                  : r.pet_name
                                : null,
                              formatOwnerPrimaryLine(r.owner_name, r.owner_email) || null,
                              (r.tenant_name ?? "").trim() ? `조직 ${(r.tenant_name ?? "").trim()}` : null,
                            ]}
                          />
                        </td>
                        <td className="p-2 whitespace-nowrap align-top">{r.last_at}</td>
                      </AdminTableRow>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="최근 BLE 이벤트" subtitle="event_type · raw 일부는 상세 패널에서" icon={Radio}>
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-[10px] lg:text-xs">
              <thead>
                <AdminTableHeadRow>
                  <AdminTableHeadCell>유형</AdminTableHeadCell>
                  <AdminTableHeadCell>시각</AdminTableHeadCell>
                  <AdminTableHeadCell>pet</AdminTableHeadCell>
                </AdminTableHeadRow>
              </thead>
              <tbody>
                {recentBle.length === 0 ? (
                  <AdminTableRow>
                    <td colSpan={3} className="p-4 text-slate-400 text-center">
                      데이터 없음
                    </td>
                  </AdminTableRow>
                ) : (
                  recentBle.map((r) => {
                    const bk = subjectKindShortLabel(r.subject_kind);
                    return (
                      <AdminTableRow key={r.id}>
                        <td className="p-2 font-mono align-top">{r.event_type}</td>
                        <td className="p-2 whitespace-nowrap align-top">{r.created_at}</td>
                        <td className="p-2 align-top max-w-[220px]">
                          <AdminInlineContextBlock
                            primary={r.pet_id}
                            sublines={[
                              r.pet_name
                                ? bk
                                  ? `${r.pet_name} · ${bk}`
                                  : r.pet_name
                                : null,
                              formatOwnerPrimaryLine(r.owner_name, r.owner_email) || null,
                              (r.tenant_name ?? "").trim() ? `조직 ${(r.tenant_name ?? "").trim()}` : null,
                            ]}
                          />
                        </td>
                      </AdminTableRow>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <AdminCard variant="subtle" className="p-5 border border-dashed border-slate-200">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">개인정보·위치</strong>: 위치는 발견자 동의 후에만
          저장됩니다. 모니터링 표는 UID·pet id 옆에 연결된 프로필·보호자·테넌트 요약을 함께 두었습니다. 이용약관에 위치·모니터링 범위를
          명시해야 합니다. 지역별 히트맵·빅데이터 연동은 별도 배포 시 확장합니다.
        </p>
      </AdminCard>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone: "teal" | "amber" | "slate" | "rose";
}) {
  const ring =
    tone === "teal"
      ? "shadow-teal-500/10"
      : tone === "amber"
        ? "shadow-amber-500/10"
        : tone === "rose"
          ? "shadow-rose-500/10"
          : "shadow-slate-500/10";
  const iconColor =
    tone === "teal"
      ? "text-teal-500"
      : tone === "amber"
        ? "text-amber-500"
        : tone === "rose"
          ? "text-rose-500"
          : "text-slate-500";
  return (
    <AdminCard variant="kpi" className={cn("p-4 lg:p-5", ring)}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-lg lg:text-xl font-black text-slate-900 tracking-tight truncate">{value}</p>
          <p className="text-[10px] text-slate-500 font-medium leading-snug">{sub}</p>
        </div>
        <Icon className={cn("w-8 h-8 shrink-0 opacity-90", iconColor)} />
      </div>
    </AdminCard>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <AdminCard variant="section" className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
        <Icon className="w-4 h-4 text-teal-600" />
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-800">{title}</p>
          <p className="text-[10px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="p-2">{children}</div>
    </AdminCard>
  );
}
