"use client";

import { useState, useTransition, type ComponentType, type ReactNode } from "react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
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
import type {
  LandingAutoRouteRow,
  LowBatteryRow,
  RecentBleRow,
  RecentNfcScanRow,
  UnknownAccessRow,
} from "@/lib/admin-monitoring-data";
import {
  getTagDiagnosticsForAdmin,
  updateTagBleMac,
  type TagDiagnosticResult,
} from "@/app/actions/admin-monitoring";

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
  tagsTotal: number;
  tagsActive: number;
  tagsUnsold: number;
};

export default function AdminMonitoringClient({
  summary,
  recentNfc,
  unknownAccess,
  autoRouteEvents,
  recentBle,
  lowBattery,
}: {
  summary: Summary;
  recentNfc: RecentNfcScanRow[];
  unknownAccess: UnknownAccessRow[];
  autoRouteEvents: LandingAutoRouteRow[];
  recentBle: RecentBleRow[];
  lowBattery: LowBatteryRow[];
}) {
  const [uidQuery, setUidQuery] = useState("");
  const [diag, setDiag] = useState<TagDiagnosticResult | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [bleMacEdit, setBleMacEdit] = useState("");
  const [pending, startTransition] = useTransition();

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

  return (
    <div className="p-4 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight italic uppercase">
          NFC / BLE 모니터링
        </h1>
        <p className="text-xs lg:text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
          UID·이벤트 중심으로 기기·스캔·BLE 상태를 요약합니다. 고객 이름·이메일은 CS 조회 시에만
          보조적으로 표시됩니다.
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
      </div>

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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] lg:text-xs">
              <thead>
                <AdminTableHeadRow>
                  <AdminTableHeadCell>UID</AdminTableHeadCell>
                  <AdminTableHeadCell>시각</AdminTableHeadCell>
                  <AdminTableHeadCell>위치</AdminTableHeadCell>
                </AdminTableHeadRow>
              </thead>
              <tbody>
                {recentNfc.length === 0 ? (
                  <AdminTableRow>
                    <td colSpan={3} className="p-4 text-slate-400 text-center">
                      데이터 없음
                    </td>
                  </AdminTableRow>
                ) : (
                  recentNfc.map((r) => (
                    <AdminTableRow key={r.id}>
                      <td className="p-2 font-mono truncate max-w-[140px]">{r.tag_id}</td>
                      <td className="p-2 whitespace-nowrap">{r.scanned_at}</td>
                      <td className="p-2">{r.has_location ? "Y" : "—"}</td>
                    </AdminTableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="미등록 NFC 시도" subtitle="DB에 없는 UID" icon={ShieldAlert}>
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
                {unknownAccess.length === 0 ? (
                  <AdminTableRow>
                    <td colSpan={3} className="p-4 text-slate-400 text-center">
                      기록 없음
                    </td>
                  </AdminTableRow>
                ) : (
                  unknownAccess.map((r) => (
                    <AdminTableRow key={r.id}>
                      <td className="p-2 font-mono truncate max-w-[160px]">{r.tag_uid}</td>
                      <td className="p-2 whitespace-nowrap">{r.created_at}</td>
                      <td className="p-2 font-mono truncate max-w-[120px]">{r.ip_address ?? "—"}</td>
                    </AdminTableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="랜딩 자동 진입 로그" subtitle="source · mode · 로그인 여부" icon={Search}>
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
                {autoRouteEvents.length === 0 ? (
                  <AdminTableRow>
                    <td colSpan={4} className="p-4 text-slate-400 text-center">
                      기록 없음
                    </td>
                  </AdminTableRow>
                ) : (
                  autoRouteEvents.map((r) => (
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
        </Section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="저전력 후보 (30일)" subtitle="battery_low 유형 이벤트 기준" icon={BatteryWarning}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] lg:text-xs">
              <thead>
                <AdminTableHeadRow>
                  <AdminTableHeadCell>pet_id</AdminTableHeadCell>
                  <AdminTableHeadCell>이름(참고)</AdminTableHeadCell>
                  <AdminTableHeadCell>마지막 시각</AdminTableHeadCell>
                </AdminTableHeadRow>
              </thead>
              <tbody>
                {lowBattery.length === 0 ? (
                  <AdminTableRow>
                    <td colSpan={3} className="p-4 text-slate-400 text-center">
                      해당 없음
                    </td>
                  </AdminTableRow>
                ) : (
                  lowBattery.map((r) => (
                    <AdminTableRow key={r.pet_id}>
                      <td className="p-2 font-mono truncate max-w-[160px]">{r.pet_id}</td>
                      <td className="p-2">{r.pet_name ?? "—"}</td>
                      <td className="p-2 whitespace-nowrap">{r.last_at}</td>
                    </AdminTableRow>
                  ))
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
                  recentBle.map((r) => (
                    <AdminTableRow key={r.id}>
                      <td className="p-2 font-mono">{r.event_type}</td>
                      <td className="p-2 whitespace-nowrap">{r.created_at}</td>
                      <td className="p-2 truncate max-w-[120px]">{r.pet_name ?? r.pet_id}</td>
                    </AdminTableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <AdminCard variant="subtle" className="p-5 border border-dashed border-slate-200">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">개인정보·위치</strong>: 위치는 발견자 동의 후에만
          저장됩니다. 관리자 화면은 UID·기기 식별자 중심으로 두고, 이용약관에 위치·모니터링 범위를
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
