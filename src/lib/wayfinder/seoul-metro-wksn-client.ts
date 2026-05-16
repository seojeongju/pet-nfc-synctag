/**
 * 서울교통공사 교통약자이용정보 (data.go.kr · B553766/wksn)
 * @see https://www.data.go.kr/data/15143843/openapi.do
 */

import type { WayfinderFacilityType } from "@/lib/wayfinder/facility-types";

const WKSN_BASE = "http://apis.data.go.kr/B553766/wksn";

export type WksnOperationSpec = {
  operation: string;
  facilityType: WayfinderFacilityType;
  kindLabel: string;
};

/** 공공데이터포털 스펙 기준 operation (404 시 sync에서 건너뜀) */
export const WKSN_FACILITY_OPERATIONS: WksnOperationSpec[] = [
  { operation: "getWksnElvtr", facilityType: "elevator", kindLabel: "엘리베이터" },
  { operation: "getWksnWhlchrLift", facilityType: "wheelchair_lift", kindLabel: "휠체어리프트" },
  { operation: "getWksnDsbltToilet", facilityType: "accessible_toilet", kindLabel: "장애인 화장실" },
  { operation: "getWksnSgnLngVidTel", facilityType: "sign_language_phone", kindLabel: "수어영상전화" },
  { operation: "getWksnWhlchrRpidChrg", facilityType: "wheelchair_charger", kindLabel: "휠체어 급속충전" },
  { operation: "getWksnSftyStp", facilityType: "safety_step", kindLabel: "안전발판" },
  { operation: "getWksnMvmtPath", facilityType: "movement_path", kindLabel: "이동통로" },
  { operation: "getWksnTrfcWeakAssnt", facilityType: "traffic_weak_assistant", kindLabel: "교통약자 도우미" },
];

export function normalizeStationNameForWksn(name: string): string {
  return name.replace(/역$/u, "").trim();
}

type WksnFetchParams = {
  stnNm?: string;
  lineNm?: string;
  stnCd?: string;
  pageNo?: number;
  numOfRows?: number;
};

function pickString(item: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = item[k];
    if (v == null || v === "") continue;
    return String(v).trim();
  }
  return null;
}

function pickNumber(item: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = item[k];
    if (v == null || v === "") continue;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function parseWksnItems(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const response = (root.response ?? root) as Record<string, unknown>;
  const body = response.body as Record<string, unknown> | undefined;
  if (!body?.items) return [];
  const items = body.items as Record<string, unknown>;
  const item = items.item;
  if (item == null) return [];
  if (Array.isArray(item)) return item.filter((x) => x && typeof x === "object") as Record<string, unknown>[];
  if (typeof item === "object") return [item as Record<string, unknown>];
  return [];
}

export function mapWksnItemToDraft(
  item: Record<string, unknown>,
  spec: WksnOperationSpec,
  stationId: string
): {
  stationId: string;
  facilityType: WayfinderFacilityType;
  label: string;
  description: string | null;
  lineName: string | null;
  floorText: string | null;
  entranceNo: string | null;
  operationStatus: string | null;
  latitude: number | null;
  longitude: number | null;
  externalRef: string | null;
} {
  const stnNm = pickString(item, ["stnNm", "STN_NM", "stn_nm", "stationNm"]);
  const lineNm = pickString(item, ["lineNm", "LINE_NM", "line_nm", "subwayLineNm"]);
  const floor = pickString(item, ["flrNm", "FLR_NM", "flr_nm", "floorNm", "flrNo", "floor"]);
  const entrance = pickString(item, ["vcntEntrcNo", "VCNT_ENTRC_NO", "entrcNo", "gateNo", "exitNo"]);
  const fcltNm = pickString(item, ["fcltNm", "elvtrNm", "elvtrNo", "liftNm", "toiletNm", "fcltyNm"]);
  const stnCd = pickString(item, ["stnCd", "STN_CD", "stn_cd"]);
  const oper = pickString(item, ["useYn", "operYn", "oprYn", "operAt", "useAt", "status", "runYn"]);
  const lat = pickNumber(item, ["lat", "latitude", "mapY", "y"]);
  const lng = pickNumber(item, ["lng", "longitude", "mapX", "x"]);

  const parts = [spec.kindLabel];
  if (entrance) parts.push(`${entrance}번 출입구`);
  if (floor) parts.push(floor);
  const label = fcltNm ? `${spec.kindLabel} · ${fcltNm}` : parts.join(" ");

  const descBits: string[] = [];
  if (stnNm) descBits.push(stnNm);
  if (lineNm) descBits.push(lineNm);
  const description = descBits.length ? descBits.join(" · ") : null;

  const externalRef = stnCd
    ? `${spec.operation}:${stnCd}:${entrance ?? ""}:${floor ?? ""}:${fcltNm ?? label}`
    : `${spec.operation}:${label}:${entrance ?? ""}:${floor ?? ""}`;

  return {
    stationId,
    facilityType: spec.facilityType,
    label,
    description,
    lineName: lineNm,
    floorText: floor,
    entranceNo: entrance,
    operationStatus: oper,
    latitude: lat,
    longitude: lng,
    externalRef: externalRef.slice(0, 240),
  };
}

function stableFacilityId(stationId: string, externalRef: string): string {
  let h = 0;
  const s = `${stationId}|${externalRef}`;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return `fac-${stationId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24)}-${(h >>> 0).toString(36)}`;
}

export function draftToFacilityId(
  stationId: string,
  externalRef: string
): string {
  return stableFacilityId(stationId, externalRef);
}

export async function fetchWksnOperationPage(
  apiKey: string,
  operation: string,
  params: WksnFetchParams
): Promise<{ items: Record<string, unknown>[]; totalCount: number; pageNo: number; numOfRows: number }> {
  const url = new URL(`${WKSN_BASE}/${operation}`);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("dataType", "json");
  url.searchParams.set("pageNo", String(params.pageNo ?? 1));
  url.searchParams.set("numOfRows", String(params.numOfRows ?? 100));
  if (params.stnNm) url.searchParams.set("stnNm", params.stnNm);
  if (params.lineNm) url.searchParams.set("lineNm", params.lineNm);
  if (params.stnCd) url.searchParams.set("stnCd", params.stnCd);

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });

  const text = await res.text();
  if (!res.ok) {
    if (text.includes("API not found")) {
      throw new WksnApiError("NOT_FOUND", operation);
    }
    if (res.status === 401 || text.includes("Unauthorized") || text.includes("SERVICE_KEY")) {
      throw new WksnApiError("AUTH", text.slice(0, 120) || "Unauthorized");
    }
    throw new WksnApiError("HTTP", `${res.status}: ${text.slice(0, 120)}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    throw new WksnApiError("PARSE", text.slice(0, 120));
  }

  const header = (json as { response?: { header?: { resultCode?: string; resultMsg?: string } } })?.response
    ?.header;
  const code = header?.resultCode ?? "";
  if (code && code !== "00" && code !== "0") {
    const msg = header?.resultMsg ?? code;
    if (msg.includes("SERVICE_KEY") || msg.includes("인증") || code === "30") {
      throw new WksnApiError("AUTH", msg);
    }
    throw new WksnApiError("API", msg);
  }

  const body = (json as { response?: { body?: { totalCount?: number; pageNo?: number; numOfRows?: number } } })
    ?.response?.body;
  const items = parseWksnItems(json);
  return {
    items,
    totalCount: Number(body?.totalCount ?? items.length) || items.length,
    pageNo: Number(body?.pageNo ?? params.pageNo ?? 1),
    numOfRows: Number(body?.numOfRows ?? params.numOfRows ?? 100),
  };
}

export class WksnApiError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "HTTP" | "PARSE" | "AUTH" | "API",
    message: string
  ) {
    super(message);
    this.name = "WksnApiError";
  }
}

export async function fetchAllWksnForStation(
  apiKey: string,
  operation: string,
  stnNm: string,
  maxPages = 5
): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let pageNo = 1;
  const numOfRows = 100;

  while (pageNo <= maxPages) {
    const page = await fetchWksnOperationPage(apiKey, operation, {
      stnNm,
      pageNo,
      numOfRows,
    });
    all.push(...page.items);
    if (page.items.length < numOfRows || all.length >= page.totalCount) break;
    pageNo += 1;
  }
  return all;
}
