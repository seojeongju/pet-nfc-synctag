/**
 * 서버(Cloudflare Edge 등)와 브라우저에서 동일한 한국어 날짜 문자열을 만들기 위해
 * locale·timeZone을 고정합니다. (React #418 텍스트 불일치 방지)
 */
const TZ_SEOUL = "Asia/Seoul";
const KO = "ko-KR";

function parseSqlOrIso(value: string): Date | null {
  const raw = value.trim();
  const d = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** 스캔 히스토리 등 — 날짜+시각 전체 */
export function formatDateTimeKoSeoul(iso: string): string {
  const d = parseSqlOrIso(iso);
  if (!d) return iso;
  return new Intl.DateTimeFormat(KO, {
    timeZone: TZ_SEOUL,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
}

/** 앨범 등 — medium / short */
export function formatDateTimeMediumShortKoSeoul(iso: string): string {
  const d = parseSqlOrIso(iso);
  if (!d) return iso;
  return new Intl.DateTimeFormat(KO, {
    timeZone: TZ_SEOUL,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/** 펫 상세 최근 스캔 줄 — 월·일·시각 */
export function formatMonthDayTimeKoSeoul(iso: string): string {
  const d = parseSqlOrIso(iso);
  if (!d) return iso;
  return new Intl.DateTimeFormat(KO, {
    timeZone: TZ_SEOUL,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** 정수 카운트(총 스캔 등) — 로케일 고정 */
export function formatIntegerKo(n: number): string {
  return Math.trunc(n).toLocaleString(KO, { useGrouping: true, maximumFractionDigits: 0 });
}
