"use client";

/**
 * AuthCompleteBridge — OAuth 콜백 후 뷰포트를 강제 재설정하는 클라이언트 컴포넌트
 *
 * 동작 순서:
 *  1. 이 컴포넌트가 마운트되는 순간 브라우저는 우리 도메인의 HTML을 완전히 paint함
 *     → <meta name="viewport">가 재계산됨 (중간 브리지의 핵심 효과)
 *  2. useEffect에서 viewport 메타를 명시적으로 재주입하여 이전 zoom 상태를 초기화
 *  3. scrollTo(0,0)으로 스크롤 위치 초기화
 *  4. router.replace()로 최종 목적지로 이동 (히스토리 스택에 이 페이지가 남지 않도록)
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  next: string;
}

export function AuthCompleteBridge({ next }: Props) {
  const router = useRouter();

  useEffect(() => {
    // ① viewport 메타 태그 강제 재주입 — 이전 OAuth 페이지의 zoom 상태 초기화
    const resetViewport = () => {
      const existing = document.querySelector('meta[name="viewport"]');
      const content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
      if (existing) {
        existing.setAttribute("content", content);
      } else {
        const meta = document.createElement("meta");
        meta.name = "viewport";
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // ② 일부 브라우저는 viewport 재계산을 위해 content를 잠깐 변경 후 복원해야 함
    const forceViewportRecalc = () => {
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta) {
        // 잠시 다른 값으로 설정했다가 원래 값으로 되돌려 브라우저가 강제 재계산하도록 유도
        meta.setAttribute("content", "width=1");
        requestAnimationFrame(() => {
          meta.setAttribute(
            "content",
            "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
          );
        });
      }
    };

    resetViewport();
    forceViewportRecalc();

    // ③ 스크롤 위치 초기화
    window.scrollTo(0, 0);

    // ④ 한 프레임 후 최종 목적지로 이동 (replace: 히스토리에 이 페이지를 남기지 않음)
    const timer = requestAnimationFrame(() => {
      router.replace(next);
    });

    return () => cancelAnimationFrame(timer);
  }, [next, router]);

  // 리다이렉트 중 잠깐 보이는 로딩 UI — 배경만 표시
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #eef2ff 100%)",
      }}
      aria-hidden="true"
    >
      {/* 로딩 스피너 — 사용자가 깜빡임을 인식하지 못하도록 부드럽게 표시 */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid #e2e8f0",
          borderTopColor: "#14b8a6",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
