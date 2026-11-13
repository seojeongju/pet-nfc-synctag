/**
 * 디지털 명함 템플릿 전면 아트의 문구 슬롯.
 * 원본 아트(card-XX)에는 NAME / SHORT TEXT 자리표시 글자가 그려져 있어,
 * 글자를 지운 배경(blank/card-XX)을 깔고 사용자 문구를 슬롯 위치에 그린다.
 * 좌표는 카드 크기 대비 비율(0..1). 1번째 문구 → slots[0], 2번째 → slots[1].
 */

export type CardTextSlot = {
  x: number;
  y: number;
  w: number;
  h: number;
  align: "left" | "center";
  color: string;
};

export type CardFaceLayout = {
  blankSrc: string;
  slots: readonly CardTextSlot[];
};

const DARK = "#0B0B0F";
const LIGHT = "#FFFFFF";

const SLOTS: Record<string, readonly CardTextSlot[]> = {
  "01": [
    { x: 0.151, y: 0.2625, w: 0.5167, h: 0.25, align: "left", color: LIGHT },
    { x: 0.151, y: 0.67, w: 0.5485, h: 0.135, align: "left", color: LIGHT },
  ],
  "02": [
    { x: 0.0811, y: 0.25, w: 0.5994, h: 0.27, align: "left", color: DARK },
    { x: 0.159, y: 0.57, w: 0.4261, h: 0.11, align: "left", color: DARK },
  ],
  "03": [
    { x: 0.2989, y: 0.67, w: 0.3959, h: 0.1475, align: "center", color: LIGHT },
    { x: 0.3529, y: 0.825, w: 0.2957, h: 0.0675, align: "center", color: LIGHT },
  ],
  "04": [
    { x: 0.1971, y: 0.395, w: 0.6105, h: 0.235, align: "center", color: DARK },
    { x: 0.2512, y: 0.645, w: 0.4928, h: 0.1225, align: "center", color: DARK },
  ],
  "05": [
    { x: 0.1622, y: 0.2325, w: 0.4467, h: 0.2125, align: "center", color: DARK },
    { x: 0.2035, y: 0.4575, w: 0.3816, h: 0.1125, align: "center", color: DARK },
  ],
  "06": [
    { x: 0.2512, y: 0.305, w: 0.5024, h: 0.24, align: "center", color: DARK },
    { x: 0.3227, y: 0.675, w: 0.3514, h: 0.095, align: "center", color: LIGHT },
  ],
  "07": [
    { x: 0.3847, y: 0.305, w: 0.5501, h: 0.25, align: "center", color: DARK },
    { x: 0.4086, y: 0.62, w: 0.5024, h: 0.1225, align: "center", color: DARK },
  ],
  "08": [
    { x: 0.1399, y: 0.295, w: 0.4706, h: 0.21, align: "center", color: LIGHT },
    { x: 0.1161, y: 0.6075, w: 0.4944, h: 0.1225, align: "left", color: LIGHT },
  ],
  "09": [
    { x: 0.0747, y: 0.495, w: 0.4626, h: 0.21, align: "left", color: DARK },
    { x: 0.0747, y: 0.7325, w: 0.4149, h: 0.11, align: "left", color: DARK },
  ],
  "10": [
    { x: 0.1876, y: 0.345, w: 0.5564, h: 0.235, align: "center", color: DARK },
    { x: 0.2114, y: 0.62, w: 0.5087, h: 0.11, align: "center", color: DARK },
  ],
};

const CARD_ART_RE = /^\/images\/studio\/card\/(?:thumb\/)?card-(\d{2})\.(?:webp|png)$/;

/** 명함 템플릿 아트 경로면 글자 없는 배경과 문구 슬롯을 돌려준다 */
export function getCardFaceLayout(faceArtSrc: string | null | undefined): CardFaceLayout | null {
  if (!faceArtSrc) return null;
  const m = CARD_ART_RE.exec(faceArtSrc);
  const slots = m ? SLOTS[m[1]!] : undefined;
  if (!m || !slots) return null;
  return { blankSrc: `/images/studio/card/blank/card-${m[1]}.webp`, slots };
}
