/**
 * 커스텀 태그 폼팩터(외형) 정의. 치수 단위는 mm.
 * P2는 코드 상수, 이후 D1 `form_factors`로 이전 (docs/NFC_PLATFORM_DEV_PLAN.md §5.2, §7).
 */
import type { PlatformServiceId } from "@/lib/platform/services";

export type FormFactorId = "keyring_round" | "pendant_bone" | "stand_plate";

export type NfcChipType = "NTAG213" | "NTAG215" | "NTAG216";

export type FormFactor = {
  id: FormFactorId;
  name: string;
  description: string;
  /** 외곽 크기 (가로 × 세로 × 두께) */
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  /** 칩 포켓 지름·깊이 (윗면 기준 중심) */
  chip: { type: NfcChipType; diameterMm: number; depthMm: number };
  /** 문구를 넣을 수 있는 최대 줄 수 */
  maxTextLines: number;
  allowedServices: readonly PlatformServiceId[];
  /** 기본 단가 — 내부 예상가(Q0) 산정용, 1개 기준 */
  basePriceKrw: number;
};

export const FORM_FACTORS: readonly FormFactor[] = [
  {
    id: "keyring_round",
    name: "원형 키링",
    description: "열쇠·가방·반려동물 목줄에 다는 기본형. 고리 구멍 포함.",
    widthMm: 40,
    heightMm: 48,
    thicknessMm: 4,
    chip: { type: "NTAG213", diameterMm: 25, depthMm: 1.2 },
    maxTextLines: 2,
    allowedServices: ["linku", "card", "custom"],
    basePriceKrw: 9900,
  },
  {
    id: "pendant_bone",
    name: "뼈다귀 펜던트",
    description: "반려동물 인식표로 쓰기 좋은 뼈다귀 모양.",
    widthMm: 46,
    heightMm: 26,
    thicknessMm: 4,
    chip: { type: "NTAG213", diameterMm: 20, depthMm: 1.2 },
    maxTextLines: 2,
    allowedServices: ["linku", "custom"],
    basePriceKrw: 11900,
  },
  {
    id: "stand_plate",
    name: "스탠드 플레이트",
    description: "카운터·테이블에 세워 두는 매장용 안내판.",
    widthMm: 80,
    heightMm: 100,
    thicknessMm: 5,
    chip: { type: "NTAG215", diameterMm: 30, depthMm: 1.4 },
    maxTextLines: 3,
    allowedServices: ["wifi", "store", "card", "asset", "custom"],
    basePriceKrw: 19900,
  },
] as const;

export function getFormFactor(id: string): FormFactor | null {
  return FORM_FACTORS.find((f) => f.id === id) ?? null;
}

export function formFactorsForService(serviceId: PlatformServiceId): FormFactor[] {
  return FORM_FACTORS.filter((f) => f.allowedServices.includes(serviceId));
}
