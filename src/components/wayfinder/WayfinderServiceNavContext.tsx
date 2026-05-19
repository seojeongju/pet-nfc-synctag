"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  WAYFINDER_SERVICE_SECTION_IDS,
  type WayfinderServiceRoleId,
} from "@/lib/wayfinder/accessible-routing-links";
import { scrollToWayfinderServiceSection } from "@/lib/wayfinder/service-section-scroll";

type WayfinderServiceNavContextValue = {
  expanded: WayfinderServiceRoleId | null;
  openSection: (id: WayfinderServiceRoleId) => void;
  isSectionOpen: (id: WayfinderServiceRoleId) => boolean;
};

const WayfinderServiceNavContext = createContext<WayfinderServiceNavContextValue | null>(null);

const FALLBACK_NAV: WayfinderServiceNavContextValue = {
  expanded: null,
  openSection: (id) => scrollToWayfinderServiceSection(WAYFINDER_SERVICE_SECTION_IDS[id]),
  isSectionOpen: () => true,
};

export function WayfinderServiceNavProvider({
  children,
  defaultExpanded = null,
}: {
  children: ReactNode;
  defaultExpanded?: WayfinderServiceRoleId | null;
}) {
  const [expanded, setExpanded] = useState<WayfinderServiceRoleId | null>(defaultExpanded);

  const isSectionOpen = useCallback(
    (id: WayfinderServiceRoleId) => {
      if (id === "linku" || id === "kakao") {
        return expanded === "linku" || expanded === "kakao";
      }
      return expanded === id;
    },
    [expanded]
  );

  const openSection = useCallback((id: WayfinderServiceRoleId) => {
    setExpanded((prev) => {
      const next = prev === id ? null : id;
      if (next !== null) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToWayfinderServiceSection(WAYFINDER_SERVICE_SECTION_IDS[id]);
          });
        });
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ expanded, openSection, isSectionOpen }),
    [expanded, openSection, isSectionOpen]
  );

  return (
    <WayfinderServiceNavContext.Provider value={value}>{children}</WayfinderServiceNavContext.Provider>
  );
}

export function useWayfinderServiceNav(): WayfinderServiceNavContextValue {
  return useContext(WayfinderServiceNavContext) ?? FALLBACK_NAV;
}
