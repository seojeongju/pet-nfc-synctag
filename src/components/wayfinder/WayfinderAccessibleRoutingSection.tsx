import { isInSeoulMetroBounds } from "@/lib/wayfinder/accessible-routing-links";
import { WayfinderSeoulCompanionPromo } from "@/components/wayfinder/WayfinderSeoulCompanionPromo";
import { cn } from "@/lib/utils";

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  stationName?: string;
  variant?: "main" | "station";
  className?: string;
};

export function WayfinderAccessibleRoutingSection({
  latitude = null,
  longitude = null,
  stationName,
  variant = "main",
  className,
}: Props) {
  const showSeoul =
    variant === "main" ||
    (latitude != null && longitude != null && isInSeoulMetroBounds(latitude, longitude));

  if (!showSeoul) return null;

  return (
    <WayfinderSeoulCompanionPromo
      variant={variant}
      stationName={stationName}
      className={cn(className)}
    />
  );
}
