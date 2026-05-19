import { WAYFINDER_SERVICE_SECTION_IDS } from "@/lib/wayfinder/accessible-routing-links";

export { WAYFINDER_SERVICE_SECTION_IDS };

export function scrollToWayfinderServiceSection(sectionId: string): void {
  if (typeof document === "undefined") return;
  const target = document.getElementById(sectionId);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (sectionId === WAYFINDER_SERVICE_SECTION_IDS.kakao) {
    document
      .getElementById(WAYFINDER_SERVICE_SECTION_IDS.linku)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
