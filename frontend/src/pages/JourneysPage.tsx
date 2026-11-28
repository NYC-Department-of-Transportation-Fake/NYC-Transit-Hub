import { useEffect, useMemo, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router";

import { rankJourneys } from "../services/journeyRanking";

import {
  loadJourneyDraft,
  saveJourneyDraft,
  clearJourneyDraft,
  DEFAULT_JOURNEY_PREFERENCES,
} from "../services/journeyStorage";

import useJourneySearch from "../hooks/useJourneySearch";

import StationAutocomplete from "../components/StationAutocomplete";
import RouteResults from "../components/RouteResults";
import RoutePreferences from "../components/RoutePreferences";
import RouteOptions from "../components/RouteOptions";
import JourneySearchStatus from "../components/JourneySearchStatus";

import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";

import type { Station } from "../types/transit";

import type { JourneyDemoScenario } from "../services/journey";

import type {
  JourneyDraft,
  JourneyPreferences,
  JourneyNavigationState,
  JourneyRequest,
  JourneyStationSelection,
} from "../types/journey";

// User-friendly preference labels
const PREFERENCE_LABELS = {
  fastest: "Fastest Route",
  fewestTransfers: "Fewest Transfers",
  fewestStops: "Fewest Stops",
};

// Form validation errors
type JourneyFormErrors = {
  from?: string;
  to?: string;
};

// Available focus targets
type JourneyFocusTarget = "from" | "to" | "find-route" | null;

// Validate incoming station information
function isValidNavigationStation(
  value: unknown,
): value is JourneyStationSelection {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const station = value as Partial<JourneyStationSelection>;

  return (
    typeof station.id === "string" &&
    station.id.trim().length > 0 &&
    typeof station.name === "string" &&
    station.name.trim().length > 0
  );
}

// Initialize journey planner and consume navigation state
export default function JourneysPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationState = location.state as JourneyNavigationState | null;

  // Preserve the merged draft during navigation replacement
  const [pendingDraft, setPendingDraft] = useState<JourneyDraft | null>(null);

  // Consume incoming navigation state only once
  useEffect(() => {
    if (!navigationState) {
      return;
    }

    const savedDraft = loadJourneyDraft();

    // Validate and merge incoming station selections
    const mergedDraft: JourneyDraft = {
      from: isValidNavigationStation(navigationState.from)
        ? navigationState.from
        : savedDraft.from,

      to: isValidNavigationStation(navigationState.to)
        ? navigationState.to
        : savedDraft.to,

      preferences: savedDraft.preferences,
    };

    // Preserve the merged information in memory
    setPendingDraft(mergedDraft);

    // Persist the merged journey draft
    saveJourneyDraft(mergedDraft);

    // Remove consumed navigation state
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
      {
        replace: true,
        state: null,
        preventScrollReset: true,
      },
    );
  }, [
    navigationState,
    navigate,
    location.pathname,
    location.search,
    location.hash,
  ]);

  // Clear the temporary draft after the planner receives it
  useEffect(() => {
    if (!navigationState) {
      setPendingDraft(null);
    }
  }, [navigationState, location.key]);

  // Wait until navigation state has been consumed
  if (navigationState) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-3 p-6 text-center text-sm text-gray-600"
      >
        <div
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-purple-100 border-t-purple-700 motion-reduce:animate-none"
        />

        <span>Preparing your journey...</span>
      </div>
    );
  }

  return (
    <JourneyPlanner
      key={location.key}
      initialJourneyDraft={pendingDraft ?? undefined}
    />
  );
}

type JourneyPlannerProps = {
  initialJourneyDraft?: JourneyDraft;
};

function JourneyPlanner({ initialJourneyDraft }: JourneyPlannerProps) {
  // Restore the merged or previously saved journey draft
  const [initialDraft] = useState<JourneyDraft>(
    () => initialJourneyDraft ?? loadJourneyDraft(),
  );

  // Station names
  const [from, setFrom] = useState(initialDraft.from?.name ?? "");

  const [to, setTo] = useState(initialDraft.to?.name ?? "");

  // Selected station IDs
  const [selectedFromId, setSelectedFromId] = useState(
    initialDraft.from?.id ?? "",
  );

  const [selectedToId, setSelectedToId] = useState(initialDraft.to?.id ?? "");

  // Route preferences
  const [preferences, setPreferences] = useState<JourneyPreferences>(
    initialDraft.preferences,
  );

  // Field-specific validation errors
  const [formErrors, setFormErrors] = useState<JourneyFormErrors>({});

  // Selected candidate journey
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(
    null,
  );

  // Development testing scenario
  const [demoScenario, setDemoScenario] =
    useState<JourneyDemoScenario>("success");

  // Asynchronous journey search
  const journeySearch = useJourneySearch();

  const isSearching = journeySearch.status === "loading";

  // Track the next element that should receive focus
  const pendingFocus = useRef<JourneyFocusTarget>(null);

  // Apply pending focus after React updates the page
  useEffect(() => {
    if (!pendingFocus.current) {
      return;
    }

    document.getElementById(pendingFocus.current)?.focus();

    pendingFocus.current = null;
  });

  // Save selected stations and preferences
  useEffect(() => {
    const draft: JourneyDraft = {
      from: selectedFromId
        ? {
            id: selectedFromId,
            name: from,
          }
        : null,

      to: selectedToId
        ? {
            id: selectedToId,
            name: to,
          }
        : null,

      preferences,
    };

    const isEmpty =
      !draft.from &&
      !draft.to &&
      preferences.optimization === "fastest" &&
      !preferences.accessibleOnly;

    if (isEmpty) {
      clearJourneyDraft();
    } else {
      saveJourneyDraft(draft);
    }
  }, [from, to, selectedFromId, selectedToId, preferences]);

  // Focus the first invalid input after rendering
  useEffect(() => {
    const fieldId = formErrors.from ? "from" : formErrors.to ? "to" : null;

    if (fieldId) {
      document.getElementById(fieldId)?.focus();
    }
  }, [formErrors]);

  // Rank returned candidate journeys
  const rankedJourneys = useMemo(
    () => rankJourneys(journeySearch.journeys, preferences.optimization),
    [journeySearch.journeys, preferences.optimization],
  );

  // Find the selected or recommended journey
  const selectedJourney =
    rankedJourneys.find((journey) => journey.id === selectedJourneyId) ??
    rankedJourneys[0];

  // Reset previous search results
  const clearSearchResults = () => {
    setFormErrors({});
    setSelectedJourneyId(null);

    journeySearch.resetSearch();
  };

  // Update starting station input
  const handleFromChange = (value: string) => {
    setFrom(value);
    setSelectedFromId("");

    clearSearchResults();
  };

  // Select starting station
  const handleFromSelect = (station: Station) => {
    setFrom(station.name);
    setSelectedFromId(station.id);

    clearSearchResults();

    // Move focus to destination if not selected
    if (!selectedToId) {
      pendingFocus.current = "to";
    }
  };

  // Update destination station input
  const handleToChange = (value: string) => {
    setTo(value);
    setSelectedToId("");

    clearSearchResults();
  };

  // Select destination station
  const handleToSelect = (station: Station) => {
    setTo(station.name);
    setSelectedToId(station.id);

    clearSearchResults();

    // Focus the next required element
    if (!selectedFromId) {
      pendingFocus.current = "from";
    } else if (selectedFromId !== station.id) {
      pendingFocus.current = "find-route";
    }
  };

  // Update route preferences
  const handlePreferencesChange = (newPreferences: JourneyPreferences) => {
    const accessibilityChanged =
      preferences.accessibleOnly !== newPreferences.accessibleOnly;

    setPreferences(newPreferences);
    setSelectedJourneyId(null);

    // Completed demo results can be ranked locally.
    // Other changes require a new search.
    if (
      accessibilityChanged ||
      !journeySearch.isDemo ||
      journeySearch.status !== "success"
    ) {
      journeySearch.resetSearch();
    }
  };

  // Swap starting and destination stations
  const handleSwap = () => {
    setFrom(to);
    setTo(from);

    setSelectedFromId(selectedToId);
    setSelectedToId(selectedFromId);

    clearSearchResults();
  };

  // Reset all stations, preferences, and results
  const handleClear = () => {
    setFrom("");
    setTo("");

    setSelectedFromId("");
    setSelectedToId("");

    setPreferences({
      ...DEFAULT_JOURNEY_PREFERENCES,
    });

    setDemoScenario("success");

    clearSearchResults();
    clearJourneyDraft();

    // Return focus to the starting station input
    pendingFocus.current = "from";
  };

  // Validate the journey form
  const validateForm = (): JourneyFormErrors => {
    const errors: JourneyFormErrors = {};

    // Validate starting station
    if (!selectedFromId) {
      errors.from = from.trim()
        ? "Please select a starting station from the search results."
        : "Please select a starting station.";
    }

    // Validate destination station
    if (!selectedToId) {
      errors.to = to.trim()
        ? "Please select a destination station from the search results."
        : "Please select a destination station.";
    }

    // Prevent identical starting and destination stations
    if (selectedFromId && selectedToId && selectedFromId === selectedToId) {
      errors.to = "Starting and destination stations must be different.";
    }

    return errors;
  };

  // Start a real journey search
  const handleFindRoute = () => {
    clearSearchResults();

    const errors = validateForm();

    setFormErrors(errors);

    // Stop if form validation fails
    if (errors.from || errors.to) {
      return;
    }

    const request: JourneyRequest = {
      fromStationId: selectedFromId,
      toStationId: selectedToId,

      preferences: {
        ...preferences,
      },
    };

    // Submit a valid journey request
    journeySearch.startSearch(request, "real");
  };

  // Start a development-only mock search
  const handleDemoSearch = () => {
    if (!import.meta.env.DEV) {
      return;
    }

    setFormErrors({});
    setSelectedJourneyId(null);

    // Demo searches intentionally use fixed mock stations
    const request: JourneyRequest = {
      fromStationId: "demo-start",
      toStationId: "demo-destination",

      preferences: {
        ...preferences,
      },
    };

    journeySearch.startSearch(request, "demo", demoScenario);
  };

  // Retry journey search
  const handleRetrySearch = () => {
    setSelectedJourneyId(null);

    if (journeySearch.isDemo) {
      handleDemoSearch();
    } else {
      journeySearch.retrySearch();
    }
  };

  // Cancel current request
  const handleCancelSearch = () => {
    journeySearch.cancelSearch();
    setSelectedJourneyId(null);
  };

  // Update development scenario
  const handleScenarioChange = (scenario: JourneyDemoScenario) => {
    setDemoScenario(scenario);

    clearSearchResults();
  };

  return (
    <div className="app-page">
      {/* Shared Page Header */}
      <PageHeader
        title="Plan a Trip"
        description="Find the best subway route for your journey."
      >
        <p className="app-helper-text">
          Selected stations and preferences are saved temporarily in this
          browser tab.
        </p>
      </PageHeader>

      <div className="space-y-4">
        {/* Journey Search Form */}
        <form
          aria-label="Plan a subway trip"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();

            if (!isSearching) {
              handleFindRoute();
            }
          }}
          className="space-y-4"
        >
          {/* Starting Station */}
          <StationAutocomplete
            id="from"
            label="From"
            placeholder="Enter starting station"
            value={from}
            selectedStationId={selectedFromId}
            error={formErrors.from}
            onChange={handleFromChange}
            onSelect={handleFromSelect}
          />

          {/* Shared Swap and Clear Buttons */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Button variant="primary" size="sm" onClick={handleSwap}>
              ⇅ Swap Stations
            </Button>

            <Button variant="secondary" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>

          {/* Destination Station */}
          <StationAutocomplete
            id="to"
            label="To"
            placeholder="Enter destination station"
            value={to}
            selectedStationId={selectedToId}
            error={formErrors.to}
            onChange={handleToChange}
            onSelect={handleToSelect}
          />

          {/* Route Preferences */}
          <RoutePreferences
            preferences={preferences}
            onChange={handlePreferencesChange}
          />

          {/* Shared Find Route Button */}
          <div className="mt-6">
            <Button
              id="find-route"
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSearching}
              loading={isSearching && !journeySearch.isDemo}
              loadingText="Finding Route..."
            >
              Find Route
            </Button>
          </div>
        </form>

        {/* Development-only Testing Panel */}
        {import.meta.env.DEV && (
          <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-5">
            <h2 className="text-sm font-semibold text-amber-900 sm:text-base">
              Development Tools
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-amber-800 sm:text-sm">
              Test asynchronous route searches using mock data. These routes are
              not real subway recommendations.
            </p>

            {/* Test Scenario */}
            <label
              htmlFor="demo-scenario"
              className="mt-4 block text-sm font-medium text-amber-900"
            >
              Test Scenario
            </label>

            <select
              id="demo-scenario"
              value={demoScenario}
              onChange={(event) =>
                handleScenarioChange(event.target.value as JourneyDemoScenario)
              }
              disabled={isSearching}
              className="mt-2 w-full rounded-lg border border-amber-300 bg-white p-3 text-base text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-60"
            >
              <option value="success">Success — Multiple Routes</option>

              <option value="empty">Empty — No Routes Found</option>

              <option value="error">Error — Request Failed</option>
            </select>

            {/* Shared Run Demo Search Button */}
            <Button
              variant="outline"
              fullWidth
              className="mt-3"
              onClick={handleDemoSearch}
              disabled={isSearching}
              loading={isSearching && journeySearch.isDemo}
              loadingText="Running Demo Search..."
            >
              Run Demo Search
            </Button>

            {/* Shared Clear Demo Results Button */}
            {journeySearch.isDemo && !isSearching && (
              <Button
                variant="ghost"
                fullWidth
                className="mt-2 underline"
                onClick={clearSearchResults}
              >
                Clear Demo Results
              </Button>
            )}
          </section>
        )}

        {/* Demo Result Warning */}
        {journeySearch.isDemo && journeySearch.status !== "idle" && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 sm:text-sm">
            Demo Mode: This search uses fixed mock stations and routes. Results
            do not represent the real stations selected above.
          </div>
        )}

        {/* Loading State */}
        {journeySearch.status === "loading" && (
          <JourneySearchStatus status="loading" onCancel={handleCancelSearch} />
        )}

        {/* Error State */}
        {journeySearch.status === "error" && (
          <JourneySearchStatus
            status="error"
            message={journeySearch.errorMessage ?? undefined}
            onRetry={journeySearch.canRetry ? handleRetrySearch : undefined}
          />
        )}

        {/* Empty Result State */}
        {journeySearch.status === "empty" && (
          <JourneySearchStatus status="empty" onRetry={handleRetrySearch} />
        )}

        {/* Cancelled State */}
        {journeySearch.status === "cancelled" && (
          <JourneySearchStatus status="cancelled" onRetry={handleRetrySearch} />
        )}

        {/* Successful Journey Search */}
        {journeySearch.status === "success" && (
          <section aria-label="Journey search results">
            {/* Search Summary */}
            <div
              role="status"
              className="mt-4 rounded-lg border border-nyu-border bg-nyu-light p-3 text-sm text-nyu"
            >
              <h2 className="font-semibold text-nyu">Search Results</h2>

              <p className="mt-2">
                Ranking Preference:{" "}
                {PREFERENCE_LABELS[preferences.optimization]}
              </p>

              <p className="mt-1">
                {rankedJourneys.length} candidate{" "}
                {rankedJourneys.length === 1 ? "route" : "routes"} found.
              </p>
            </div>

            {/* Candidate Route Options */}
            <RouteOptions
              journeys={rankedJourneys}
              selectedJourneyId={selectedJourney?.id ?? null}
              onSelect={setSelectedJourneyId}
            />

            {/* Selected Journey Details and Map */}
            {selectedJourney && (
              <RouteResults
                from={selectedJourney.from.name}
                to={selectedJourney.to.name}
                journey={selectedJourney}
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
