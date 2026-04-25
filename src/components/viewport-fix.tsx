"use client";

/**
 * ViewportFix — 앱 전역에서 viewport를 능동적으로 보호하는 보조 컴포넌트
 *
 * 문제: Google OAuth 등 외부 도메인에서 복귀 시
 *       Android Chrome이 이전 도메인의 zoom/scale 값을 승계하는 버그 존재
 *
 * 해결: 두 가지 이벤트를 감지하여 viewport 메타를 강제 재설정
 *  1. visibilitychange: 탭/앱 전환 후 복귀 시
 *  2. pageshow: 브라우저 뒤로가기/앞으로가기(BFCache) 복원 시
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VIEWPORT_CONTENT =
  "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

function resetViewportMeta() {
  try {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (meta && meta.getAttribute("content") !== VIEWPORT_CONTENT) {
      meta.setAttribute("content", VIEWPORT_CONTENT);
    }
  } catch {
    // SSR 환경에서는 실행하지 않음
  }
}

function forceViewportRecalc() {
  try {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;

    // 일부 모바일 브라우저는 동일 content 재설정만으로는 반응하지 않아
    // 임시 값 -> 원복 순서로 강제 재계산을 유도합니다.
    meta.setAttribute("content", "width=1");
    requestAnimationFrame(() => {
      meta.setAttribute("content", VIEWPORT_CONTENT);
      window.dispatchEvent(new Event("resize"));
      // 키보드/주소창 애니메이션과 겹치는 기기를 위해 한 번 더 보정
      setTimeout(() => {
        meta.setAttribute("content", VIEWPORT_CONTENT);
        window.dispatchEvent(new Event("resize"));
      }, 120);
    });
  } catch {
    // no-op
  }
}

export function ViewportFix() {
  const pathname = usePathname();

  useEffect(() => {
    // 초기 마운트 시 1회 실행
    resetViewportMeta();
    forceViewportRecalc();

    // 탭 포커스 복귀 시 (OAuth 외부 페이지에서 돌아올 때 포함)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetViewportMeta();
        forceViewportRecalc();
      }
    };

    // 브라우저 히스토리 이동으로 페이지가 BFCache에서 복원될 때
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      resetViewportMeta();
      forceViewportRecalc();
    };

    const handleWindowFocus = () => {
      resetViewportMeta();
      forceViewportRecalc();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  useEffect(() => {
    // OAuth 콜백 후 router.replace로 들어온 "첫 화면"에서도 즉시 보정
    resetViewportMeta();
    forceViewportRecalc();
  }, [pathname]);

  // 렌더링 없음 — 동작만 수행하는 순수 효과 컴포넌트
  return null;
}
