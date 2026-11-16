/**
 * Wi-Fi 스탠드 플레이트(80×100×5mm, 4:5) 고도화 전면 아트 SVG 10종 생성
 * - 원본(800×1000): wifi-XX.svg (바탕 + 전경 디자인 + 기본 문구 완성본)
 * - 바탕(800×1000): blank/wifi-XX.svg (순수 배경 플레이트 — 그라데이션·은은한 배경 글로우만)
 * - 전경(800×1000): fg/wifi-XX.svg (양각·음각 입체 적용 대상 — 프레임·아치·Wi-Fi 아이콘·NFC 터치링·NFC·TAP 배지 및 글씨)
 * - 썸네일(240×300, viewBox 800×1000 유지): thumb/wifi-XX.svg
 *
 * 실행: node scripts/generate-wifi-templates.js
 */
const fs = require("fs");
const path = require("path");

const dir = path.join("public", "images", "studio", "wifi");
const blankDir = path.join(dir, "blank");
const fgDir = path.join(dir, "fg");
const thumbDir = path.join(dir, "thumb");
fs.mkdirSync(blankDir, { recursive: true });
fs.mkdirSync(fgDir, { recursive: true });
fs.mkdirSync(thumbDir, { recursive: true });

const W = 800;
const H = 1000;
const RX = 56;
// 실제 stand_plate NFC 칩 중심(cy = -22mm -> textArea 96mm 기준 y ≈ 729)
const CHIP_Y = 735;

const designs = [
  {
    id: "01",
    theme: "sky_air",
    bg1: "#F0F9FF",
    bg2: "#BAE6FD",
    accent: "#0284C7",
    accent2: "#38BDF8",
    titleColor: "#0C4A6E",
    subColor: "#0369A1",
    badgeBg: "#0284C7",
    badgeText: "#FFFFFF",
    title: "FREE Wi-Fi",
    subtext: "태그하여 바로 연결",
    tapLabel: "NFC · TAP HERE",
    dark: false,
  },
  {
    id: "02",
    theme: "midnight_tech",
    bg1: "#09152B",
    bg2: "#0F294A",
    accent: "#38BDF8",
    accent2: "#22D3EE",
    titleColor: "#F8FAFC",
    subColor: "#94A3B8",
    badgeBg: "#0EA5E9",
    badgeText: "#082F49",
    title: "Wi-Fi ZONE",
    subtext: "TOUCH TO CONNECT",
    tapLabel: "TAP PHONE",
    dark: true,
  },
  {
    id: "03",
    theme: "cafe_cream",
    bg1: "#FFFDF7",
    bg2: "#FDE68A",
    accent: "#B45309",
    accent2: "#D97706",
    titleColor: "#451A03",
    subColor: "#78350F",
    badgeBg: "#B45309",
    badgeText: "#FFFBEB",
    title: "CAFE Wi-Fi",
    subtext: "스마트폰을 태그하세요",
    tapLabel: "NFC · CONNECT",
    dark: false,
  },
  {
    id: "04",
    theme: "modern_minimal",
    bg1: "#FFFFFF",
    bg2: "#F8FAFC",
    accent: "#00A896",
    accent2: "#0F766E",
    titleColor: "#0F172A",
    subColor: "#64748B",
    badgeBg: "#0F172A",
    badgeText: "#FFFFFF",
    title: "FREE Wi-Fi",
    subtext: "비밀번호 없이 즉시 연결",
    tapLabel: "NFC · TAP",
    dark: false,
  },
  {
    id: "05",
    theme: "linku_signature",
    bg1: "#0F766E",
    bg2: "#00A896",
    accent: "#CCFBF1",
    accent2: "#5EEAD4",
    titleColor: "#FFFFFF",
    subColor: "#CCFBF1",
    badgeBg: "#FFFFFF",
    badgeText: "#0F766E",
    title: "LINK-U Wi-Fi",
    subtext: "NFC로 간편하게 접속",
    tapLabel: "TAP TO JOIN",
    dark: true,
  },
  {
    id: "06",
    theme: "boutique_gold",
    bg1: "#18181B",
    bg2: "#27272A",
    accent: "#F59E0B",
    accent2: "#FDE68A",
    titleColor: "#FAFAF9",
    subColor: "#D4D4D8",
    badgeBg: "#F59E0B",
    badgeText: "#18181B",
    title: "GUEST Wi-Fi",
    subtext: "Tap your phone here",
    tapLabel: "NFC · TOUCH",
    dark: true,
  },
  {
    id: "07",
    theme: "aurora_glass",
    bg1: "#082F49",
    bg2: "#1E1B4B",
    accent: "#22D3EE",
    accent2: "#A78BFA",
    titleColor: "#FFFFFF",
    subColor: "#BAE6FD",
    badgeBg: "#22D3EE",
    badgeText: "#082F49",
    title: "CONNECT Wi-Fi",
    subtext: "FREE HIGH-SPEED",
    tapLabel: "NFC · TAP",
    dark: true,
  },
  {
    id: "08",
    theme: "botanical_mint",
    bg1: "#F0FDFA",
    bg2: "#CCFBF1",
    accent: "#0D9488",
    accent2: "#2DD4BF",
    titleColor: "#134E4A",
    subColor: "#0F766E",
    badgeBg: "#0D9488",
    badgeText: "#FFFFFF",
    title: "와이파이 안내",
    subtext: "휴대폰 뒷면을 대주세요",
    tapLabel: "NFC · 터치",
    dark: false,
  },
  {
    id: "09",
    theme: "architect_slate",
    bg1: "#F1F5F9",
    bg2: "#E2E8F0",
    accent: "#1E293B",
    accent2: "#0284C7",
    titleColor: "#0F172A",
    subColor: "#475569",
    badgeBg: "#1E293B",
    badgeText: "#FFFFFF",
    title: "OFFICE Wi-Fi",
    subtext: "GUEST NETWORK",
    tapLabel: "NFC · ACCESS",
    dark: false,
  },
  {
    id: "10",
    theme: "rose_blush",
    bg1: "#FFF1F2",
    bg2: "#FFE4E6",
    accent: "#E11D48",
    accent2: "#FB7185",
    titleColor: "#881337",
    subColor: "#9F1239",
    badgeBg: "#E11D48",
    badgeText: "#FFFFFF",
    title: "STORE Wi-Fi",
    subtext: "무료 와이파이 연결",
    tapLabel: "NFC · TAP",
    dark: false,
  },
];

function defsFor(d) {
  return `
  <defs>
    <linearGradient id="bg-${d.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${d.bg1}"/>
      <stop offset="100%" stop-color="${d.bg2}"/>
    </linearGradient>
    <linearGradient id="acc-${d.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${d.accent}"/>
      <stop offset="100%" stop-color="${d.accent2}"/>
    </linearGradient>
    <radialGradient id="glow-${d.id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${d.accent2}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${d.accent2}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="clip-${d.id}">
      <rect width="${W}" height="${H}" rx="${RX}"/>
    </clipPath>
  </defs>`;
}

/** 플레이트 바닥에 깔리는 순수 배경 요소 (그라데이션·부드러운 면) */
function basePlateDecor(d) {
  switch (d.theme) {
    case "sky_air":
      return `<circle cx="400" cy="140" r="240" fill="url(#glow-${d.id})"/>
              <path d="M0 860 Q 200 790 400 850 T 800 830 V 1000 H 0 Z" fill="#FFFFFF" opacity="0.45"/>`;
    case "midnight_tech":
      return `<circle cx="400" cy="230" r="260" fill="url(#glow-${d.id})"/>`;
    case "cafe_cream":
      return `<rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="${RX - 18}" fill="#FFFFFF" opacity="0.55"/>`;
    case "linku_signature":
      return `<circle cx="690" cy="110" r="190" fill="#FFFFFF" opacity="0.08"/>
              <circle cx="110" cy="890" r="210" fill="#FFFFFF" opacity="0.07"/>`;
    case "boutique_gold":
      return `<circle cx="400" cy="230" r="140" fill="url(#glow-${d.id})"/>`;
    case "aurora_glass":
      return `<circle cx="160" cy="180" r="240" fill="${d.accent2}" opacity="0.18"/>
              <circle cx="660" cy="760" r="260" fill="${d.accent}" opacity="0.16"/>`;
    case "botanical_mint":
      return `<path d="M 0 0 H 800 V 180 Q 600 240 400 180 T 0 210 Z" fill="${d.accent2}" opacity="0.18"/>
              <path d="M 0 850 Q 220 790 420 845 T 800 815 V 1000 H 0 Z" fill="${d.accent}" opacity="0.12"/>`;
    case "architect_slate":
      return `<rect x="52" y="52" width="${W - 104}" height="${H - 104}" rx="28" fill="#FFFFFF" opacity="0.72"/>`;
    case "rose_blush":
      return `<circle cx="400" cy="230" r="210" fill="#FFFFFF" opacity="0.55"/>
              <path d="M 0 840 Q 200 780 400 835 T 800 810 V 1000 H 0 Z" fill="${d.accent2}" opacity="0.22"/>`;
    default:
      return "";
  }
}

/** 양각·음각이 적용될 전경 프레임·라인·장식 요소 */
function foregroundDecor(d) {
  switch (d.theme) {
    case "sky_air":
      return `
        <circle cx="400" cy="120" r="190" fill="none" stroke="${d.accent}" stroke-width="5" opacity="0.35"/>
        <circle cx="400" cy="120" r="145" fill="none" stroke="${d.accent}" stroke-width="4" opacity="0.45"/>`;
    case "midnight_tech":
      return `
        <rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="${RX - 18}" fill="none" stroke="${d.accent}" stroke-width="4" opacity="0.65"/>
        <path d="M 34 120 H 95 M 705 120 H 766 M 34 880 H 95 M 705 880 H 766" stroke="${d.accent2}" stroke-width="5" stroke-linecap="round"/>`;
    case "cafe_cream":
      return `
        <path d="M 100 940 V 280 A 300 300 0 0 1 700 280 V 940" fill="none" stroke="${d.accent}" stroke-width="5" stroke-linecap="round" opacity="0.55"/>
        <line x1="100" y1="940" x2="700" y2="940" stroke="${d.accent}" stroke-width="5" stroke-linecap="round" opacity="0.55"/>`;
    case "modern_minimal":
      return `
        <rect x="32" y="32" width="${W - 64}" height="${H - 64}" rx="${RX - 16}" fill="none" stroke="${d.accent}" stroke-width="6"/>
        <rect x="52" y="52" width="${W - 104}" height="${H - 104}" rx="${RX - 24}" fill="none" stroke="${d.accent}" stroke-width="3" opacity="0.55"/>
        <rect x="320" y="28" width="160" height="12" rx="6" fill="${d.accent}"/>`;
    case "linku_signature":
      return `
        <rect x="44" y="44" width="${W - 88}" height="${H - 88}" rx="${RX - 20}" fill="none" stroke="${d.accent}" stroke-width="4" opacity="0.55"/>`;
    case "boutique_gold":
      return `
        <rect x="28" y="28" width="${W - 56}" height="${H - 56}" rx="${RX - 14}" fill="none" stroke="${d.accent}" stroke-width="6"/>
        <rect x="46" y="46" width="${W - 92}" height="${H - 92}" rx="${RX - 22}" fill="none" stroke="${d.accent2}" stroke-width="2.5" opacity="0.7"/>
        <path d="M 28 110 H 110 M 690 110 H 772" stroke="${d.accent}" stroke-width="4"/>`;
    case "aurora_glass":
      return `
        <rect x="44" y="44" width="${W - 88}" height="${H - 88}" rx="${RX - 20}" fill="none" stroke="${d.accent}" stroke-width="4" opacity="0.65"/>`;
    case "botanical_mint":
      return `
        <rect x="38" y="38" width="${W - 76}" height="${H - 76}" rx="${RX - 18}" fill="none" stroke="${d.accent}" stroke-width="4" opacity="0.5"/>`;
    case "architect_slate":
      return `
        <rect x="0" y="0" width="28" height="${H}" fill="${d.accent2}"/>
        <line x1="100" y1="575" x2="700" y2="575" stroke="${d.accent}" stroke-width="4" opacity="0.35"/>`;
    case "rose_blush":
      return `
        <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="${RX - 18}" fill="none" stroke="${d.accent}" stroke-width="4.5" opacity="0.55"/>`;
    default:
      return "";
  }
}

function wifiEmblem(d) {
  const cx = 400;
  const cy = 225;
  const ringStroke = d.dark ? d.accent2 : d.accent;
  return `
    <circle cx="${cx}" cy="${cy}" r="88" fill="none" stroke="${ringStroke}" stroke-width="6"/>
    <g fill="none" stroke="${d.accent}" stroke-width="12" stroke-linecap="round">
      <path d="M ${cx - 50} ${cy - 4} A 68 68 0 0 1 ${cx + 50} ${cy - 4}"/>
      <path d="M ${cx - 33} ${cy + 14} A 45 45 0 0 1 ${cx + 33} ${cy + 14}"/>
      <path d="M ${cx - 16} ${cy + 32} A 22 22 0 0 1 ${cx + 16} ${cy + 32}"/>
    </g>
    <circle cx="${cx}" cy="${cy + 50}" r="10" fill="${d.accent}"/>`;
}

function nfcTouchZone(d) {
  const cx = 400;
  const cy = CHIP_Y;
  const ringColor = d.dark ? d.accent2 : d.accent;
  const labelColor = d.dark ? d.titleColor : d.accent;
  return `
    <!-- 실제 NFC 칩 위치(y=${CHIP_Y})에 맞춘 터치 가이드 존 (양각·음각 최적화 벡터) -->
    <circle cx="${cx}" cy="${cy}" r="128" fill="none" stroke="${ringColor}" stroke-width="4" stroke-dasharray="12 10" opacity="0.65"/>
    <circle cx="${cx}" cy="${cy}" r="98" fill="none" stroke="${ringColor}" stroke-width="4.5" opacity="0.85"/>
    <!-- NFC 전파 심볼 -->
    <g fill="none" stroke="${ringColor}" stroke-width="6.5" stroke-linecap="round">
      <path d="M ${cx - 18} ${cy - 34} A 26 26 0 0 1 ${cx - 18} ${cy - 2}" transform="rotate(-90 ${cx} ${cy - 18})"/>
      <path d="M ${cx - 10} ${cy - 46} A 42 42 0 0 1 ${cx - 10} ${cy + 10}" transform="rotate(-90 ${cx} ${cy - 18})"/>
    </g>
    <circle cx="${cx}" cy="${cy - 8}" r="5.5" fill="${ringColor}"/>
    <!-- 캡슐 테두리 + 양각/음각 텍스트 -->
    <rect x="${cx - 122}" y="${cy + 16}" width="244" height="54" rx="27" fill="none" stroke="${d.badgeBg}" stroke-width="6"/>
    <text x="${cx}" y="${cy + 51}" text-anchor="middle" font-family="Outfit, Arial, sans-serif" font-size="22" font-weight="900" letter-spacing="1.5" fill="${labelColor}">${d.tapLabel}</text>`;
}

function buildSvg(d, { includeBase, includeFg, includeText, thumb }) {
  const sizeAttrs = thumb ? `width="240" height="300"` : `width="${W}" height="${H}"`;
  const baseLayer = includeBase
    ? `
    <rect width="${W}" height="${H}" rx="${RX}" fill="url(#bg-${d.id})"/>
    ${basePlateDecor(d)}`
    : "";
  const fgLayer = includeFg
    ? `
    ${foregroundDecor(d)}
    ${wifiEmblem(d)}
    ${nfcTouchZone(d)}`
    : "";
  const textLayer = includeText
    ? `
    <text x="400" y="422" text-anchor="middle" font-family="Outfit, 'Noto Sans KR', Arial, sans-serif" font-size="60" font-weight="900" fill="${d.titleColor}">${d.title}</text>
    <text x="400" y="492" text-anchor="middle" font-family="'Noto Sans KR', Arial, sans-serif" font-size="28" font-weight="700" fill="${d.subColor}">${d.subtext}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" ${sizeAttrs} viewBox="0 0 ${W} ${H}">
  ${defsFor(d)}
  <g clip-path="url(#clip-${d.id})">
    ${baseLayer}
    ${fgLayer}
    ${textLayer}
  </g>
</svg>
`;
}

for (const d of designs) {
  fs.writeFileSync(path.join(dir, `wifi-${d.id}.svg`), buildSvg(d, { includeBase: true, includeFg: true, includeText: true, thumb: false }));
  fs.writeFileSync(path.join(blankDir, `wifi-${d.id}.svg`), buildSvg(d, { includeBase: true, includeFg: false, includeText: false, thumb: false }));
  fs.writeFileSync(path.join(fgDir, `wifi-${d.id}.svg`), buildSvg(d, { includeBase: false, includeFg: true, includeText: false, thumb: false }));
  fs.writeFileSync(path.join(thumbDir, `wifi-${d.id}.svg`), buildSvg(d, { includeBase: true, includeFg: true, includeText: true, thumb: true }));
  console.log("generated wifi template (full/blank/fg/thumb)", d.id);
}
