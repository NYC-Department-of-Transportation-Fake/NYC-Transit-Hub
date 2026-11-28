import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { useQuery } from "@tanstack/react-query";

import { fetchStations } from "../services/transit";

import useDebounce from "../hooks/useDebounce";

import Button from "./ui/Button";
import { RouteBadgeGroup } from "./ui/RouteBadge";

import type { Station } from "../types/transit";

// Component properties
type StationAutocompleteProps = {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  selectedStationId: string;
  error?: string;
  onChange: (value: string) => void;
  onSelect: (station: Station) => void;
};

// Search configuration
const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_RESULTS = 5;
const STATION_CACHE_TIME = 300000;
const SEARCH_DEBOUNCE_DELAY = 300;

// Highlight matching search keywords
function HighlightedText({ text, query }: { text: string; query: string }) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return <>{text}</>;
  }

  const matchIndex = text.toLowerCase().indexOf(normalizedQuery.toLowerCase());

  if (matchIndex === -1) {
    return <>{text}</>;
  }

  const matchEnd = matchIndex + normalizedQuery.length;

  return (
    <>
      {text.slice(0, matchIndex)}

      <mark className="rounded-sm bg-nyu-light font-semibold text-nyu">
        {text.slice(matchIndex, matchEnd)}
      </mark>

      {text.slice(matchEnd)}
    </>
  );
}

// Reusable station autocomplete component
export default function StationAutocomplete({
  id,
  label,
  placeholder = "Enter station name",
  value,
  selectedStationId,
  error,
  onChange,
  onSelect,
}: StationAutocompleteProps) {
  // Reference to the search input
  const inputRef = useRef<HTMLInputElement>(null);

  // Dropdown visibility
  const [isOpen, setIsOpen] = useState(false);

  // Currently highlighted station
  const [activeIndex, setActiveIndex] = useState(-1);

  // Normalize and debounce the search input
  const searchQuery = value.trim();

  const debouncedQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_DELAY);

  const isTyping = searchQuery !== debouncedQuery;

  const canSearch =
    searchQuery.length >= MIN_SEARCH_LENGTH && !selectedStationId;

  const shouldSearch = canSearch && !isTyping && isOpen;

  // Fetch matching subway stations
  const stationsQuery = useQuery({
    queryKey: ["transit", "stations", debouncedQuery, ""],

    queryFn: ({ signal }) => fetchStations(debouncedQuery, "", signal),

    enabled: shouldSearch,

    staleTime: STATION_CACHE_TIME,
  });

  // Limit displayed search results
  const stations = stationsQuery.data?.data.slice(0, MAX_SEARCH_RESULTS) ?? [];

  // Total number of matching stations
  const totalResults = stationsQuery.data?.total ?? stations.length;

  // Determine whether results should be visible
  const showResults =
    shouldSearch &&
    !stationsQuery.isPending &&
    !stationsQuery.isError &&
    stations.length > 0;

  // Accessibility IDs
  const listboxId = `${id}-station-results`;

  const errorId = `${id}-error`;

  // Currently highlighted station
  const activeStation =
    showResults && activeIndex >= 0 ? stations[activeIndex] : undefined;

  // Handle input changes
  const handleChange = (newValue: string) => {
    onChange(newValue);

    setActiveIndex(-1);
    setIsOpen(true);
  };

  // Select a station
  const handleSelect = (station: Station) => {
    onSelect(station);

    setActiveIndex(-1);
    setIsOpen(false);
  };

  // Clear the current search input
  const handleClear = () => {
    onChange("");

    setActiveIndex(-1);

    inputRef.current?.focus();

    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Do not interrupt IME text composition
    if (event.nativeEvent.isComposing) {
      return;
    }

    // Close search results
    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();

        setIsOpen(false);
        setActiveIndex(-1);
      }

      return;
    }

    // Allow normal keyboard focus navigation
    if (event.key === "Tab") {
      setIsOpen(false);
      setActiveIndex(-1);

      return;
    }

    if (!canSearch || isTyping) {
      return;
    }

    // Move to the next station
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(-1);

        return;
      }

      if (!showResults) {
        return;
      }

      setActiveIndex((previous) =>
        previous < 0 || previous >= stations.length - 1 ? 0 : previous + 1,
      );

      return;
    }

    // Move to the previous station
    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(-1);

        return;
      }

      if (!showResults) {
        return;
      }

      setActiveIndex((previous) =>
        previous <= 0 || previous >= stations.length
          ? stations.length - 1
          : previous - 1,
      );

      return;
    }

    // Confirm the highlighted station
    if (event.key === "Enter" && activeStation) {
      event.preventDefault();

      handleSelect(activeStation);
    }
  };

  return (
    <div
      className="relative w-full min-w-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
          setActiveIndex(-1);
        }
      }}
    >
      {/* Shared Input Label */}
      <label htmlFor={id} className="app-label">
        {label}
      </label>

      {/* Input Container */}
      <div className="relative mt-2">
        {/* Accessible Search Input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={showResults}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          aria-controls={showResults ? listboxId : undefined}
          aria-activedescendant={
            activeStation ? `${id}-option-${activeIndex}` : undefined
          }
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`app-input pr-12 ${error ? "app-input-error" : ""}`}
        />

        {/* Clear Input Button */}
        {value && (
          <button
            type="button"
            aria-label={`Clear ${label} station`}
            onClick={handleClear}
            className="absolute inset-y-0 right-1 my-auto flex h-11 w-11 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-slate-100 hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 motion-reduce:transition-none"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m6 6 12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>

      {/* Form Validation Error */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="app-error-text mt-2 flex items-start gap-2"
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>

          <span>{error}</span>
        </p>
      )}

      {/* Selected Station */}
      {selectedStationId && !error && (
        <p role="status" className="mt-2 text-xs font-medium text-app-success">
          ✓{" "}
          {label === "From"
            ? "Starting station selected"
            : label === "To"
              ? "Destination station selected"
              : "Station selected"}
        </p>
      )}

      {/* Minimum Search Length */}
      {isOpen &&
        !selectedStationId &&
        searchQuery.length > 0 &&
        searchQuery.length < MIN_SEARCH_LENGTH && (
          <p className="app-helper-text mt-2">Enter at least two characters.</p>
        )}

      {/* Debouncing State */}
      {isOpen && canSearch && isTyping && (
        <p role="status" className="app-helper-text mt-2">
          Searching stations...
        </p>
      )}

      {/* Loading State */}
      {shouldSearch && stationsQuery.isPending && !stationsQuery.isError && (
        <div
          role="status"
          className="mt-2 flex items-center gap-2 rounded-lg border border-app-border bg-app-surface p-3"
        >
          <div
            aria-hidden="true"
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-nyu-light border-t-nyu motion-reduce:animate-none"
          />

          <span className="text-sm text-app-muted">Searching stations...</span>
        </div>
      )}

      {/* API Error State */}
      {shouldSearch && stationsQuery.isError && (
        <div role="alert" className="app-error-panel mt-2">
          <p className="app-error-text">Unable to load stations.</p>

          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => void stationsQuery.refetch()}
            loading={stationsQuery.isFetching}
            loadingText="Retrying..."
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Empty Results */}
      {shouldSearch && stationsQuery.isSuccess && stations.length === 0 && (
        <p
          role="status"
          className="mt-2 rounded-lg border border-app-border bg-app-surface p-4 text-sm text-app-muted"
        >
          No stations found.
        </p>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="mt-2 overflow-hidden rounded-lg border border-app-border bg-app-surface shadow-sm">
          {/* Result Count */}
          <div
            role="status"
            className="border-b border-app-border bg-slate-50 px-3 py-2 text-xs text-app-muted"
          >
            Showing {stations.length} of {totalResults} matching{" "}
            {totalResults === 1 ? "station" : "stations"}
          </div>

          {/* Available Stations */}
          <div
            id={listboxId}
            role="listbox"
            aria-label={`${label} station results`}
          >
            {stations.map((station, index) => (
              <div
                key={station.id}
                id={`${id}-option-${index}`}
                role="option"
                aria-label={`${station.name}${
                  station.routeIds.length
                    ? `, routes ${station.routeIds.join(", ")}`
                    : ""
                }`}
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(station)}
                className={`flex min-h-14 w-full min-w-0 cursor-pointer items-start gap-3 border-b border-slate-100 p-3 transition-colors last:border-b-0 motion-reduce:transition-none ${
                  index === activeIndex
                    ? "bg-nyu-light ring-2 ring-inset ring-nyu"
                    : "bg-app-surface hover:bg-purple-50"
                }`}
              >
                {/* Station Icon */}
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-1 shrink-0 text-app-muted"
                >
                  <rect x="5" y="3" width="14" height="16" rx="4" />

                  <path d="M5 11h14" />
                  <path d="m8 19-2 3" />
                  <path d="m16 19 2 3" />

                  <circle cx="9" cy="15" r="1" />

                  <circle cx="15" cy="15" r="1" />
                </svg>

                {/* Station Information */}
                <div className="min-w-0 flex-1">
                  {/* Highlighted Station Name */}
                  <p className="break-words text-sm font-medium text-app-text sm:text-base">
                    <HighlightedText text={station.name} query={searchQuery} />
                  </p>

                  {/* Shared Subway Route Badges */}
                  {station.routeIds.length > 0 && (
                    <RouteBadgeGroup
                      routeIds={station.routeIds}
                      size="sm"
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Selection Indicator */}
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`mt-1 shrink-0 ${
                    index === activeIndex ? "text-nyu" : "text-slate-400"
                  }`}
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            ))}
          </div>

          {/* Keyboard Instructions */}
          <div
            aria-hidden="true"
            className="hidden border-t border-app-border bg-slate-50 px-3 py-2 text-xs text-app-muted sm:block"
          >
            ↑ ↓ Navigate · Enter Select · Esc Close
          </div>
        </div>
      )}
    </div>
  );
}
