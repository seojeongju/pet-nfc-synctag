/** Next.js `export const viewport` 및 클라이언트 보정과 동일한 값 */
export const VIEWPORT_CONTENT =
  "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

export function resetViewportMeta(): void {
  if (typeof document === "undefined") return;
  try {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (meta && meta.getAttribute("content") !== VIEWPORT_CONTENT) {
      meta.setAttribute("content", VIEWPORT_CONTENT);
    } else if (!meta) {
      const created = document.createElement("meta");
      created.name = "viewport";
      created.content = VIEWPORT_CONTENT;
      document.head.appendChild(created);
    }
  } catch {
    /* no-op */
  }
}

export function forceViewportRecalc(): void {
  if (typeof document === "undefined") return;
  try {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;

    meta.setAttribute("content", "width=1");
    requestAnimationFrame(() => {
      meta.setAttribute("content", VIEWPORT_CONTENT);
      window.dispatchEvent(new Event("resize"));
      window.setTimeout(() => {
        meta.setAttribute("content", VIEWPORT_CONTENT);
        window.dispatchEvent(new Event("resize"));
      }, 120);
    });
  } catch {
    /* no-op */
  }
}

/** OAuth 복귀·BFCache 등에서 단계적으로 viewport를 재계산 */
export function runViewportFixBurst(): () => void {
  if (typeof window === "undefined") return () => {};
  const steps = [0, 120, 320, 800] as const;
  const timers: number[] = [];
  steps.forEach((ms) => {
    const id = window.setTimeout(() => {
      resetViewportMeta();
      forceViewportRecalc();
    }, ms);
    timers.push(id);
  });
  return () => {
    timers.forEach((id) => window.clearTimeout(id));
  };
}

/** HTML 파싱 직후(React 이전) 실행용 — layout `<head>` 인라인 스크립트 */
export const VIEWPORT_BOOTSTRAP_SCRIPT = `(function(){try{var c=${JSON.stringify(VIEWPORT_CONTENT)};var m=document.querySelector('meta[name="viewport"]');if(!m){m=document.createElement('meta');m.name='viewport';document.head.appendChild(m);}m.setAttribute('content',c);}catch(e){}})();`;
