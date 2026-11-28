import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchJourneys,
  fetchDemoJourneys,
  validateJourneyRequest,
} from "../services/journey";

import type { JourneyDemoScenario } from "../services/journey";

import type { JourneyRequest } from "../types/journey";

// Available journey search states
export type JourneySearchState =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "error"
  | "cancelled";

// Search configuration
type SearchConfig = {
  request: JourneyRequest;
  mode: "real" | "demo";
  scenario: JourneyDemoScenario;
  searchId: number;
};

export default function useJourneySearch() {
  const queryClient = useQueryClient();

  // Current search configuration
  const [searchConfig, setSearchConfig] = useState<SearchConfig | null>(null);

  // Track cancelled requests
  const [cancelled, setCancelled] = useState(false);

  // Input validation error
  const [validationError, setValidationError] = useState<string | null>(null);

  // Unique query key for the current search
  const queryKey = ["journey-search", searchConfig] as const;

  // Execute the journey search
  const query = useQuery({
    queryKey,

    queryFn: ({ signal }) => {
      if (!searchConfig) {
        throw new Error("No journey request available.");
      }

      if (searchConfig.mode === "demo") {
        return fetchDemoJourneys(
          searchConfig.request,
          searchConfig.scenario,
          signal,
        );
      }

      return fetchJourneys(searchConfig.request, signal);
    },

    enabled: searchConfig !== null && !cancelled && !validationError,

    retry: false,

    staleTime: 0,

    gcTime: 0,

    refetchOnWindowFocus: false,

    refetchOnReconnect: false,

    refetchOnMount: false,
  });

  // Start a new journey search
  const startSearch = (
    request: JourneyRequest,
    mode: "real" | "demo" = "real",
    scenario: JourneyDemoScenario = "success",
  ) => {
    // Cancel the previous request
    if (searchConfig) {
      void queryClient.cancelQueries({
        queryKey,
        exact: true,
      });
    }

    setValidationError(null);
    setCancelled(false);

    try {
      validateJourneyRequest(request);
    } catch (error) {
      setSearchConfig(null);

      setValidationError(
        error instanceof Error ? error.message : "Invalid journey request.",
      );

      return;
    }

    // Create a new search configuration
    setSearchConfig((previous) => ({
      request,
      mode,
      scenario,
      searchId: (previous?.searchId ?? 0) + 1,
    }));
  };

  // Cancel the current request
  const cancelSearch = () => {
    if (!searchConfig) {
      return;
    }

    setCancelled(true);

    void queryClient.cancelQueries({
      queryKey,
      exact: true,
    });
  };

  // Retry the previous request
  const retrySearch = () => {
    if (!searchConfig) {
      return;
    }

    startSearch(searchConfig.request, searchConfig.mode, searchConfig.scenario);
  };

  // Reset the search state
  const resetSearch = () => {
    if (searchConfig) {
      void queryClient.cancelQueries({
        queryKey,
        exact: true,
      });
    }

    setSearchConfig(null);
    setCancelled(false);
    setValidationError(null);
  };

  // Determine the current search state
  let status: JourneySearchState = "idle";

  if (validationError) {
    status = "error";
  } else if (cancelled) {
    status = "cancelled";
  } else if (searchConfig) {
    if (query.isError) {
      status = "error";
    } else if (query.isFetching || query.isPending) {
      status = "loading";
    } else if (query.isSuccess) {
      status = query.data.journeys.length === 0 ? "empty" : "success";
    }
  }

  // Extract the error message
  const errorMessage =
    validationError ??
    (query.error instanceof Error ? query.error.message : null);

  return {
    status,

    journeys: status === "success" ? (query.data?.journeys ?? []) : [],

    errorMessage,

    isDemo: searchConfig?.mode === "demo",

    canRetry: searchConfig !== null,

    startSearch,
    cancelSearch,
    retrySearch,
    resetSearch,
  };
}
