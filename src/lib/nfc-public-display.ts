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
 * 발견자·보호자 공통: 보호자가 정보공개용으로 입력한 이름은 모드와 관계없이 그대로 표시한다.
 * (함수명은 기존 호출부 유지용 — 마스킹은 하지 않음.)
 */
export function maskNameForPublicViewer(
  name: string,
  _kind: SubjectKind,
  _isPublicViewer: boolean
): string {
  return typeof name === "string" ? name.trim() : String(name ?? "").trim();
}

/**
 * breed 등 보조 필드: 보호자 입력값을 마스킹하지 않고 표시. 비어 있을 때만 emptyFallback.
 */
export function maskBreedFieldForPublic(
  breed: string | null | undefined,
  _kind: SubjectKind,
  _isPublicViewer: boolean,
  emptyFallback: string
): string {
  const s = breed?.trim();
  if (!s) return emptyFallback;
  return s;
}
