import AdminMonitoringClient from "@/components/admin/AdminMonitoringClient";
import {
  getMapTelemetryAlertState,
  getMapTelemetryThresholdAudits,
  getLandingAutoRouteEvents,
  getMapTelemetryHealthSummary,
  getMapTelemetryThresholds,
  getMapTelemetryTrend,
  getNativeRejectTopReasons,
  getLowBatteryCandidates,
  getMonitoringSummary,
  getRecentBleEvents,
  getRecentNfcScans,
  getUnknownTagAccesses,
} from "@/lib/admin-monitoring-data";

export const runtime = "edge";

export default async function AdminMonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const period = sp.period === "1h" || sp.period === "7d" ? sp.period : "24h";
  const [summary, mapHealth, mapThresholds, mapAlertState, mapThresholdAudits, mapTrend, recentNfc, unknownAccess, autoRouteEvents, recentBle, lowBattery, nativeRejectTop] = await Promise.all([
    getMonitoringSummary().catch(() => ({
      nfcScans24h: 0,
      nfcScans7d: 0,
      nfcWithLocation24h: 0,
      unknownUidAccess7d: 0,
      landingAutoRoutes7d: 0,
      bleEvents24h: 0,
      bleEvents7d: 0,
      bleLostEvents7d: 0,
      distinctPetsBatteryLow30d: 0,
      nativeWriteFail24h: 0,
      nativeWriteFail7d: 0,
      nativeHandoff7d: 0,
      nativeRejected24h: 0,
      nativeRejected7d: 0,
      tagsTotal: 0,
      tagsActive: 0,
      tagsUnsold: 0,
    })),
    getMapTelemetryHealthSummary(period).catch(() => ({
      windowLabel: period === "1h" ? "최근 1시간" : period === "7d" ? "최근 7일" : "최근 24시간",
      samples24h: 0,
      avgRefreshMs24h: 0,
      errorRatePercent24h: 0,
      timeoutRatePercent24h: 0,
      offlineRatePercent24h: 0,
      autoRefreshOnRatePercent24h: 0,
      errorSamples: 0,
      timeoutSamples: 0,
      offlineSamples: 0,
      topFailureReason: "none" as const,
      lastReceivedAt: null,
    })),
    getMapTelemetryThresholds().catch(() => ({
      warningErrorRate: 8,
      warningTimeoutRate: 5,
      warningOfflineRate: 8,
      dangerErrorRate: 20,
      dangerTimeoutRate: 15,
      dangerOfflineRate: 20,
    })),
    getMapTelemetryAlertState().catch(() => ({ acknowledgedUntil: null })),
    getMapTelemetryThresholdAudits(10).catch(() => []),
    getMapTelemetryTrend(period).catch(() => []),
    getRecentNfcScans(40).catch(() => []),
    getUnknownTagAccesses(30).catch(() => []),
    getLandingAutoRouteEvents(30).catch(() => []),
    getRecentBleEvents(40).catch(() => []),
    getLowBatteryCandidates(30).catch(() => []),
    getNativeRejectTopReasons(5).catch(() => []),
  ]);

  return (
    <AdminMonitoringClient
      summary={summary}
      mapHealth={mapHealth}
      mapThresholds={mapThresholds}
      mapAlertState={mapAlertState}
      mapThresholdAudits={mapThresholdAudits}
      mapTrend={mapTrend}
      period={period}
      recentNfc={recentNfc}
      unknownAccess={unknownAccess}
      autoRouteEvents={autoRouteEvents}
      recentBle={recentBle}
      lowBattery={lowBattery}
      nativeRejectTop={nativeRejectTop}
    />
  );
}
