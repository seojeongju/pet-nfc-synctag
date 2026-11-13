import { ContactRound, Link2, type LucideIcon, MapPinned, Store, Wifi, Wrench } from "lucide-react";
import type { PlatformServiceId } from "@/lib/platform/services";

export const platformServiceIcons: Record<PlatformServiceId, LucideIcon> = {
  linku: MapPinned,
  card: ContactRound,
  wifi: Wifi,
  store: Store,
  asset: Wrench,
  custom: Link2,
};
