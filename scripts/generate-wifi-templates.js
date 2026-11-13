/**
 * Wi-Fi 스튜디오 전면 아트 SVG 10종 생성
 * node scripts/generate-wifi-templates.js
 */
const fs = require("fs");
const path = require("path");

const dir = path.join("public", "images", "studio", "wifi");
const thumb = path.join(dir, "thumb");
fs.mkdirSync(thumb, { recursive: true });

const designs = [
  { id: "01", bg: "#E0F2FE", accent: "#0284C7", text: "#0C4A6E", sub: "#0369A1", title: "FREE Wi-Fi", subtext: "NFC로 바로 연결", motif: "arc" },
  { id: "02", bg: "#0B1B3A", accent: "#38BDF8", text: "#F8FAFC", sub: "#94A3B8", title: "Wi-Fi", subtext: "TOUCH TO CONNECT", motif: "grid" },
  { id: "03", bg: "#FFFBEB", accent: "#D97706", text: "#78350F", sub: "#92400E", title: "Guest Wi-Fi", subtext: "태그하고 접속하세요", motif: "wave" },
  { id: "04", bg: "#FFFFFF", accent: "#00A896", text: "#0F172A", sub: "#64748B", title: "Wi-Fi", subtext: "비밀번호 없이 연결", motif: "frame" },
  { id: "05", bg: "#CCEDEA", accent: "#00655A", text: "#004D45", sub: "#0F766E", title: "FREE Wi-Fi", subtext: "LINK-U NFC", motif: "circle" },
  { id: "06", bg: "#1C1917", accent: "#FBBF24", text: "#FAFAF9", sub: "#D6D3D1", title: "Hotel Wi-Fi", subtext: "Tap your phone", motif: "line" },
  { id: "07", bg: "#083344", accent: "#22D3EE", text: "#ECFEFF", sub: "#A5F3FC", title: "CONNECT", subtext: "FREE Wi-Fi ZONE", motif: "bars" },
  { id: "08", bg: "#F0FDFA", accent: "#14B8A6", text: "#134E4A", sub: "#0F766E", title: "Wi-Fi 안내", subtext: "휴대폰을 대세요", motif: "dots" },
  { id: "09", bg: "#F1F5F9", accent: "#334155", text: "#0F172A", sub: "#475569", title: "Office Wi-Fi", subtext: "SCAN · CONNECT", motif: "corner" },
  { id: "10", bg: "#FFF1F2", accent: "#E11D48", text: "#881337", sub: "#9F1239", title: "Cafe Wi-Fi", subtext: "무료 와이파이", motif: "wave" },
];

function wifiIcon(cx, cy, color, scale = 1) {
  const r = 18 * scale;
  return `
  <g fill="none" stroke="${color}" stroke-width="${3.2 * scale}" stroke-linecap="round">
    <path d="M ${cx - r} ${cy} a ${r} ${r} 0 0 1 ${r * 2} 0" />
    <path d="M ${cx - r * 0.62} ${cy + 4 * scale} a ${r * 0.62} ${r * 0.62} 0 0 1 ${r * 1.24} 0" />
    <path d="M ${cx - r * 0.28} ${cy + 8 * scale} a ${r * 0.28} ${r * 0.28} 0 0 1 ${r * 0.56} 0" />
  </g>
  <circle cx="${cx}" cy="${cy + 14 * scale}" r="${3.5 * scale}" fill="${color}"/>`;
}

function motif(d, W, H) {
  const a = d.accent;
  switch (d.motif) {
    case "arc":
      return `<circle cx="${W / 2}" cy="48" r="70" fill="none" stroke="${a}" stroke-width="10" opacity="0.18"/>
              <circle cx="${W / 2}" cy="48" r="48" fill="none" stroke="${a}" stroke-width="8" opacity="0.28"/>`;
    case "grid":
      return (
        Array.from({ length: 6 }, (_, i) => `<line x1="0" y1="${40 + i * 28}" x2="${W}" y2="${40 + i * 28}" stroke="${a}" stroke-width="1" opacity="0.2"/>`).join("") +
        Array.from({ length: 5 }, (_, i) => `<line x1="${30 + i * 50}" y1="0" x2="${30 + i * 50}" y2="${H}" stroke="${a}" stroke-width="1" opacity="0.15"/>`).join("")
      );
    case "wave":
      return `<path d="M0 ${H - 70} Q ${W / 4} ${H - 110} ${W / 2} ${H - 70} T ${W} ${H - 70} V ${H} H0 Z" fill="${a}" opacity="0.9"/>
              <path d="M0 ${H - 50} Q ${W / 4} ${H - 20} ${W / 2} ${H - 50} T ${W} ${H - 50} V ${H} H0 Z" fill="${a}" opacity="0.55"/>`;
    case "frame":
      return `<rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="16" fill="none" stroke="${a}" stroke-width="3"/>
              <rect x="28" y="28" width="${W - 56}" height="${H - 56}" rx="12" fill="none" stroke="${a}" stroke-width="1.5" opacity="0.45"/>`;
    case "circle":
      return `<circle cx="${W - 40}" cy="40" r="56" fill="${a}" opacity="0.15"/>
              <circle cx="36" cy="${H - 36}" r="40" fill="${a}" opacity="0.12"/>`;
    case "line":
      return `<rect x="0" y="0" width="${W}" height="14" fill="${a}"/>
              <rect x="0" y="${H - 14}" width="${W}" height="14" fill="${a}"/>`;
    case "bars":
      return [0, 1, 2, 3]
        .map((i) => `<rect x="${28 + i * 18}" y="${H - 90 - i * 10}" width="12" height="${40 + i * 10}" rx="3" fill="${a}" opacity="${0.35 + i * 0.15}"/>`)
        .join("");
    case "dots":
      return Array.from({ length: 24 }, (_, i) => `<circle cx="${24 + (i % 6) * 40}" cy="${30 + Math.floor(i / 6) * 40}" r="3" fill="${a}" opacity="0.25"/>`).join("");
    case "corner":
      return `<path d="M0 0 H70 L0 70 Z" fill="${a}" opacity="0.85"/>
              <path d="M${W} ${H} H${W - 70} L${W} ${H - 70} Z" fill="${a}" opacity="0.85"/>`;
    default:
      return "";
  }
}

function svgFor(d, W = 400, H = 500) {
  const iconY = d.motif === "wave" ? 150 : 130;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="24" fill="${d.bg}"/>
  ${motif(d, W, H)}
  ${wifiIcon(W / 2, iconY, d.accent, 1.35)}
  <text x="${W / 2}" y="${iconY + 78}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="36" font-weight="900" fill="${d.text}">${d.title}</text>
  <text x="${W / 2}" y="${iconY + 112}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${d.sub}">${d.subtext}</text>
  <rect x="${W / 2 - 54}" y="${H - 78}" width="108" height="32" rx="16" fill="${d.accent}"/>
  <text x="${W / 2}" y="${H - 56}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="800" fill="#FFFFFF">NFC · TAP</text>
</svg>`;
}

for (const d of designs) {
  fs.writeFileSync(path.join(dir, `wifi-${d.id}.svg`), svgFor(d, 400, 500));
  fs.writeFileSync(path.join(thumb, `wifi-${d.id}.svg`), svgFor(d, 240, 300));
  console.log("wrote", d.id);
}
