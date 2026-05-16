/**
 * CC0 gist → src/lib/wayfinder/seoul-metro-stations.generated.ts
 * Source: https://gist.github.com/nemorize/ac5f39ff62b6bf82dc496d10c69b2b46
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gistPath = process.argv[2];
if (!gistPath) {
  console.error("Usage: node scripts/build-seoul-metro-stations.mjs <path-to-gist-json5>");
  process.exit(1);
}

const raw = fs.readFileSync(gistPath, "utf8");
const json = raw
  .replace(/\/\/[^\n]*/g, "")
  .replace(/'/g, '"')
  .replace(/,\s*]/g, "]")
  .replace(/,\s*}/g, "}");

/** 수도권 지하철 (서울·인천·경기 광역) */
const METRO_CITIES = new Set(["서울", "인천", "경기"]);

function slugify(name) {
  const base = name.replace(/역$/u, "").trim();
  return (
    "stn-" +
    base
      .normalize("NFKD")
      .replace(/[^\w\uAC00-\uD7A3]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 48) || "unknown"
  );
}

function linesLabel(lines) {
  return lines
    .map((l) => l.replace(/\s+/g, ""))
    .join("·");
}

const parsed = JSON.parse(json);
const byKey = new Map();

for (const s of parsed) {
  if (!METRO_CITIES.has(s.city)) continue;
  if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) continue;
  const name = String(s.name).trim();
  if (!name) continue;
  const key = `${s.lat.toFixed(5)}|${s.lng.toFixed(5)}|${name}`;
  const lines = Array.isArray(s.lines) ? s.lines : [];
  const existing = byKey.get(key);
  if (existing) {
    for (const l of lines) {
      if (!existing.lines.includes(l)) existing.lines.push(l);
    }
  } else {
    byKey.set(key, { name, lat: s.lat, lng: s.lng, lines: [...lines], city: s.city });
  }
}

const stations = [...byKey.values()].map((s) => ({
  id: slugify(s.name),
  name: s.name.endsWith("역") ? s.name : `${s.name}역`,
  lines: linesLabel(s.lines),
  latitude: Math.round(s.lat * 1e6) / 1e6,
  longitude: Math.round(s.lng * 1e6) / 1e6,
}));

const usedIds = new Set();
for (const s of stations) {
  let id = s.id;
  let n = 0;
  while (usedIds.has(id)) {
    n += 1;
    id = `${s.id}-${n}`;
  }
  s.id = id;
  usedIds.add(id);
}

stations.sort((a, b) => a.name.localeCompare(b.name, "ko"));

const outPath = path.join(__dirname, "../src/lib/wayfinder/seoul-metro-stations.ts");
const body = `/**
 * 수도권 지하철역 좌표 (GPS 근처 역 검색용).
 * CC0-1.0 — https://gist.github.com/nemorize/ac5f39ff62b6bf82dc496d10c69b2b46
 * 재생성: node scripts/build-seoul-metro-stations.mjs <gist-json5-path>
 */
export type SeoulMetroStationRecord = {
  id: string;
  name: string;
  lines: string;
  latitude: number;
  longitude: number;
};

export const SEOUL_METRO_STATIONS: SeoulMetroStationRecord[] = ${JSON.stringify(
  stations.map(({ id, name, lines, latitude, longitude }) => ({
    id,
    name,
    lines,
    latitude,
    longitude,
  })),
  null,
  2
)};
`;

fs.writeFileSync(outPath, body, "utf8");
console.log(`Wrote ${stations.length} stations to ${outPath}`);
