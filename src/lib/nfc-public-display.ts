import type { SubjectKind } from "@/lib/subject-kind";

/** 공개 방문자용 발견 안내 (소유자 화면은 PetProfileClient 기존 분기 유지) */
export const nfcPublicFinderIntro: Record<SubjectKind, string> = {
  pet:
    "감사합니다. 아래 번호로 가족에게 바로 알려 주세요. 전화·문자 모두 괜찮고, 가능하면 위치도 보내 주시면 큰 힘이 됩니다.",
  elder:
    "가족과 연락이 필요해요. 아래 전화(또는 문자)로 알려 주시고, 부담 없으시면 위치 보내기도 눌러 주세요.",
  child:
    "가족에게 먼저 연락해 주세요. 전화·문자로 알리시고, 위치를 보내 주시면 감사하겠습니다.",
  luggage:
    "주인을 찾을 수 있어요. 아래로 연락해 주시고, 위치를 남기시면 찾는 데 도움이 됩니다.",
  gold:
    "주인에게 연락해 주시면 감사합니다. 전화·문자로 알려 주시고, 필요하면 위치도 보내 주세요.",
};

export const nfcPublicEmergencyBadge: Record<SubjectKind, string> = {
  pet: "긴급",
  elder: "도움",
  child: "연락",
  luggage: "분실",
  gold: "안심",
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
