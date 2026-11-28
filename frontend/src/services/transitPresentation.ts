import type { Arrival, FeedStatus } from "../types/transit";

// Format arrival time
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

// Display arrival countdown
export function arrivalLabel(arrival: Arrival, nowMs: number): string {
  const time = arrival.arrivalTime ?? arrival.departureTime;

  if (!time) return "Time unavailable";

  const remaining = Date.parse(time) - nowMs;

  if (!Number.isFinite(remaining)) return "Time unavailable";
  if (remaining < 0) return "Passed";
  if (remaining < 60000) return "Due";

  return `${Math.ceil(remaining / 60000)} min`;
}

// Check whether feed data is stale
export function isFeedStale(feed: FeedStatus, nowMs: number): boolean {
  const source = Date.parse(feed.sourceUpdatedAt);
  const fetched = Date.parse(feed.fetchedAt);

  return (
    feed.stale ||
    feed.refreshFailed ||
    !Number.isFinite(source) ||
    !Number.isFinite(fetched) ||
    nowMs - source > 5 * 60000 ||
    nowMs - fetched >= 10 * 60000
  );
}

// Check whether feed data has expired
export function isFeedExpired(feed: FeedStatus, nowMs: number): boolean {
  return [feed.sourceUpdatedAt, feed.fetchedAt].some(
    (time) =>
      !Number.isFinite(Date.parse(time)) ||
      nowMs - Date.parse(time) >= 10 * 60000,
  );
}

// MTA subway line colors
const ROUTE_COLORS: Record<string, string> = {
  A: "#0039A6",
  C: "#0039A6",
  E: "#0039A6",

  B: "#FF6319",
  D: "#FF6319",
  F: "#FF6319",
  FX: "#FF6319",
  M: "#FF6319",

  G: "#6CBE45",

  J: "#996633",
  Z: "#996633",

  L: "#A7A9AC",

  N: "#FCCC0A",
  Q: "#FCCC0A",
  R: "#FCCC0A",
  W: "#FCCC0A",

  "1": "#EE352E",
  "2": "#EE352E",
  "3": "#EE352E",

  "4": "#00933C",
  "5": "#00933C",
  "5X": "#00933C",
  "6": "#00933C",
  "6X": "#00933C",

  "7": "#B933AD",
  "7X": "#B933AD",

  S: "#808183",
  GS: "#808183",
  FS: "#808183",
  H: "#808183",

  SI: "#0039A6",
};

// Return subway line background color
export function getRouteColor(routeId: string): string {
  const normalizedId = routeId.trim().toUpperCase();

  return ROUTE_COLORS[normalizedId] ?? "#64748B";
}

// Return readable subway line text color
export function getRouteTextColor(routeId: string): string {
  const color = getRouteColor(routeId);

  const lightColors = ["#FCCC0A", "#A7A9AC", "#6CBE45", "#FF6319", "#808183"];

  return lightColors.includes(color) ? "#000000" : "#FFFFFF";
}
