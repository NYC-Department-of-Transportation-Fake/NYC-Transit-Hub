import type { JourneyResult, RoutePreference } from "../types/journey";

// Compare journeys by travel duration
function compareDuration(a: JourneyResult, b: JourneyResult): number {
  return a.totalDurationMinutes - b.totalDurationMinutes;
}

// Compare journeys by number of transfers
function compareTransfers(a: JourneyResult, b: JourneyResult): number {
  return a.transfers - b.transfers;
}

// Compare journeys by number of stops
function compareStops(a: JourneyResult, b: JourneyResult): number {
  return a.totalStops - b.totalStops;
}

// Rank candidate journeys according to user preference
export function rankJourneys(
  journeys: JourneyResult[],
  preference: RoutePreference,
): JourneyResult[] {
  return [...journeys].sort((a, b) => {
    switch (preference) {
      case "fastest":
        return (
          compareDuration(a, b) || compareTransfers(a, b) || compareStops(a, b)
        );

      case "fewestTransfers":
        return (
          compareTransfers(a, b) || compareDuration(a, b) || compareStops(a, b)
        );

      case "fewestStops":
        return (
          compareStops(a, b) || compareDuration(a, b) || compareTransfers(a, b)
        );

      default:
        return compareDuration(a, b);
    }
  });
}

// Return the highest-ranked journey
export function getRecommendedJourney(
  journeys: JourneyResult[],
  preference: RoutePreference,
): JourneyResult | undefined {
  return rankJourneys(journeys, preference)[0];
}

// Identify the optimization strengths of a journey
export function getJourneyLabels(
  journey: JourneyResult,
  journeys: JourneyResult[],
): string[] {
  if (journeys.length === 0) {
    return [];
  }

  const labels: string[] = [];

  const minDuration = Math.min(
    ...journeys.map((item) => item.totalDurationMinutes),
  );

  const minTransfers = Math.min(...journeys.map((item) => item.transfers));

  const minStops = Math.min(...journeys.map((item) => item.totalStops));

  if (journey.totalDurationMinutes === minDuration) {
    labels.push("Fastest");
  }

  if (journey.transfers === minTransfers) {
    labels.push("Fewest Transfers");
  }

  if (journey.totalStops === minStops) {
    labels.push("Fewest Stops");
  }

  return labels;
}
