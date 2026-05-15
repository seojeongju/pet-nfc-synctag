export type GuideStep = {
  number: number;
  text: string;
};

const NUMBERED_LINE = /^(\d{1,2})[.)]\s+(.+)$/;
const BULLET_LINE = /^([①②③④⑤⑥⑦⑧⑨⑩⑪⑫])\s*(.+)$/;

/**
 * guide_text에서 번호·원문자 단계 목록을 추출합니다.
 * 2개 이상 단계가 있으면 단계 UI용, 나머지 줄은 상세 본문으로 반환합니다.
 */
export function parseGuideSteps(guideText: string | null | undefined): {
  steps: GuideStep[];
  remainder: string | null;
} {
  const raw = (guideText ?? "").trim();
  if (!raw) return { steps: [], remainder: null };

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const steps: GuideStep[] = [];
  const rest: string[] = [];

  for (const line of lines) {
    const num = line.match(NUMBERED_LINE);
    if (num) {
      steps.push({ number: Number(num[1]), text: num[2].trim() });
      continue;
    }
    const bullet = line.match(BULLET_LINE);
    if (bullet) {
      const idx = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫".indexOf(bullet[1]) + 1;
      steps.push({ number: idx > 0 ? idx : steps.length + 1, text: bullet[2].trim() });
      continue;
    }
    rest.push(line);
  }

  if (steps.length >= 2) {
    return {
      steps: steps.sort((a, b) => a.number - b.number),
      remainder: rest.length > 0 ? rest.join("\n\n") : null,
    };
  }

  return { steps: [], remainder: raw };
}
