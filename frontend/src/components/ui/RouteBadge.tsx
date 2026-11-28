import {
  getRouteColor,
  getRouteTextColor,
} from "../../services/transitPresentation";

// Available route badge sizes
export type RouteBadgeSize = "sm" | "md" | "lg";

// Shared route badge properties
export interface RouteBadgeProps {
  routeId: string;
  size?: RouteBadgeSize;
  className?: string;
}

// Shared badge size styles
const SIZE_STYLES: Record<RouteBadgeSize, string> = {
  sm: "h-6 min-w-6 text-xs",

  md: "h-8 min-w-8 text-sm",

  lg: "h-10 min-w-10 text-base",
};

// Reusable subway route badge
export default function RouteBadge({
  routeId,
  size = "md",
  className = "",
}: RouteBadgeProps) {
  const normalizedRouteId = routeId.trim().toUpperCase();

  // Do not display an empty route badge
  if (!normalizedRouteId) {
    return null;
  }

  // Reuse existing route presentation utilities
  const backgroundColor = getRouteColor(normalizedRouteId);

  const textColor = getRouteTextColor(normalizedRouteId);

  const badgeClassName = [
    "inline-flex shrink-0 items-center",
    "justify-center rounded-full px-1",
    "font-bold leading-none",
    "select-none whitespace-nowrap",
    SIZE_STYLES[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      role="img"
      aria-label={`${normalizedRouteId} train`}
      title={`${normalizedRouteId} train`}
      className={badgeClassName}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {normalizedRouteId}
    </span>
  );
}

// Shared route badge group properties
export interface RouteBadgeGroupProps {
  routeIds: readonly string[];
  size?: RouteBadgeSize;
  maxVisible?: number;
  className?: string;
}

// Reusable group of subway route badges
export function RouteBadgeGroup({
  routeIds,
  size = "md",
  maxVisible,
  className = "",
}: RouteBadgeGroupProps) {
  // Normalize route IDs and remove duplicates
  const uniqueRouteIds = Array.from(
    new Set(
      routeIds.map((routeId) => routeId.trim().toUpperCase()).filter(Boolean),
    ),
  );

  // Determine how many route badges to display
  const visibleLimit =
    maxVisible === undefined || !Number.isFinite(maxVisible)
      ? uniqueRouteIds.length
      : Math.max(0, Math.floor(maxVisible));

  const visibleRouteIds = uniqueRouteIds.slice(0, visibleLimit);

  const hiddenRouteIds = uniqueRouteIds.slice(visibleLimit);

  const remainingCount = hiddenRouteIds.length;

  // Do not render an empty badge group
  if (uniqueRouteIds.length === 0) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label="Subway routes"
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
    >
      {/* Visible subway route badges */}
      {visibleRouteIds.map((routeId) => (
        <RouteBadge key={routeId} routeId={routeId} size={size} />
      ))}

      {/* Additional routes indicator */}
      {remainingCount > 0 && (
        <span
          role="img"
          aria-label={`Additional routes: ${hiddenRouteIds.join(", ")}`}
          title={hiddenRouteIds.join(", ")}
          className={[
            "inline-flex shrink-0 items-center",
            "justify-center rounded-full",
            "bg-slate-200 px-2 font-semibold",
            "text-slate-700 whitespace-nowrap",
            SIZE_STYLES[size],
          ].join(" ")}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
