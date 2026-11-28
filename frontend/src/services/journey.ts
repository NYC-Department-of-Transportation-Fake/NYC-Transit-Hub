import type { JourneyRequest, JourneySearchResult } from "../types/journey";

import { demoJourneys } from "../data/journeyDemo";
import { rankJourneys } from "./journeyRanking";

// Available development testing scenarios
export type JourneyDemoScenario = "success" | "empty" | "error";

// Validate journey request parameters
export function validateJourneyRequest(request: JourneyRequest): void {
  if (!request.fromStationId.trim()) {
    throw new Error("Please select a starting station.");
  }

  if (!request.toStationId.trim()) {
    throw new Error("Please select a destination station.");
  }

  if (request.fromStationId === request.toStationId) {
    throw new Error("Starting and destination stations must be different.");
  }
}

// Simulate network latency with cancellation support
function simulateDelay(
  milliseconds: number,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Request cancelled.", "AbortError"));
      return;
    }

    const handleAbort = () => {
      window.clearTimeout(timer);

      signal?.removeEventListener("abort", handleAbort);

      reject(new DOMException("Request cancelled.", "AbortError"));
    };

    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);

      resolve();
    }, milliseconds);

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

// Development-only mock journey planning
export async function fetchDemoJourneys(
  request: JourneyRequest,
  scenario: JourneyDemoScenario = "success",
  signal?: AbortSignal,
): Promise<JourneySearchResult> {
  if (!import.meta.env.DEV) {
    throw new Error("Demo journey planning is unavailable in production.");
  }

  // Validate the request
  validateJourneyRequest(request);

  // Simulate a network request
  await simulateDelay(1000, signal);

  // Simulate a backend error
  if (scenario === "error") {
    throw new Error("Unable to plan a journey. Please try again.");
  }

  // Simulate an empty response
  if (scenario === "empty") {
    return {
      journeys: [],
    };
  }

  // Accessibility cannot be verified using mock data
  if (request.preferences.accessibleOnly) {
    throw new Error(
      "Accessibility filtering is unavailable for demo journeys.",
    );
  }

  // Rank available mock journeys
  const rankedJourneys = rankJourneys(
    demoJourneys,
    request.preferences.optimization,
  );

  return {
    journeys: rankedJourneys,
  };
}

// Real journey planning service
// Waiting for the confirmed backend API contract
export async function fetchJourneys(
  request: JourneyRequest,
  signal?: AbortSignal,
): Promise<JourneySearchResult> {
  validateJourneyRequest(request);

  if (signal?.aborted) {
    throw new DOMException("Request cancelled.", "AbortError");
  }

  // TODO: Connect the shared API client after
  // the backend endpoint and response format
  // have been confirmed.

  throw new Error("Route planning is not connected yet.");
}
