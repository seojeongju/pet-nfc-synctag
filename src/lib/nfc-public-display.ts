import type { SubjectKind } from "@/lib/subject-kind";

/** 공개 방문자용 발견 안내 (소유자 화면은 PetProfileClient 기존 분기 유지) */
export const nfcPublicFinderIntro: Record<SubjectKind, string> = {
  pet:
    "발견해 주셔서 감사합니다. 아래 연락처로 연락해 주시면 보호자에게 바로 전달됩니다. 위치 공유는 보호자에게 큰 도움이 됩니다.",
  elder:
    "가족에게 연결이 필요합니다. 아래 연락처로 연락해 주시고, 필요하면 위치 공유를 눌러 주세요.",
  child:
    "보호자 연락을 우선해 주세요. 아래 버튼으로 연락하시거나 위치를 공유해 주시면 감사하겠습니다.",
  luggage:
    "분실물을 발견하셨나요? 등록자에게 연락해 주시면 감사하겠습니다. 위치 공유로 단서를 남길 수 있어요.",
};

export const nfcPublicEmergencyBadge: Record<SubjectKind, string> = {
  pet: "긴급",
  elder: "도움",
  child: "연락",
  luggage: "분실",
};

/**
 * 기억 동행·어린이 모드: 공개 열람 시 이름 일부만 표시
 */
export function maskNameForPublicViewer(
  name: string,
  kind: SubjectKind,
  isPublicViewer: boolean
): string {
  if (!isPublicViewer) return name;
  if (kind !== "child" && kind !== "elder") return name;
  const t = name.trim();
  if (t.length <= 1) return t;
  if (t.length === 2) return `${t[0]}*`;
  return `${t[0]}${"*".repeat(Math.min(t.length - 1, 3))}${t.length > 4 ? "…" : ""}`;
}

/**
 * 기억 동행·어린이: 공개 시 비고(breed 필드) 마스킹. 반려·수화물은 식별에 필요해 그대로 둠.
 */
export function maskBreedFieldForPublic(
  breed: string | null | undefined,
  kind: SubjectKind,
  isPublicViewer: boolean,
  emptyFallback: string
): string {
  if (!isPublicViewer) {
    return breed?.trim() ? breed.trim() : emptyFallback;
  }
  const s = breed?.trim();
  if (!s) return emptyFallback;
  if (kind !== "child" && kind !== "elder") return s;
  if (s.length <= 2) return "· · ·";
  return `${s.slice(0, 1)}··· (일부만 표시)`;
}
