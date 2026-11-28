import { useId } from "react";

import type { JourneyResult } from "../types/journey";

import { getJourneyLabels } from "../services/journeyRanking";

import Card from "./ui/Card";
import RouteBadge from "./ui/RouteBadge";

// Component properties
type RouteOptionsProps = {
  journeys: JourneyResult[];
  selectedJourneyId: string | null;
  onSelect: (journeyId: string) => void;
};

// Reusable route options component
export default function RouteOptions({
  journeys,
  selectedJourneyId,
  onSelect,
}: RouteOptionsProps) {
  // Generate unique accessibility IDs
  const componentId = useId();

  const headingId = `${componentId}-heading`;
  const descriptionId = `${componentId}-description`;

  // Handle empty route results
  if (journeys.length === 0) {
    return (
      <section aria-labelledby={headingId} className="mt-6 min-w-0">
        <Card>
          <h2 id={headingId} className="app-section-title">
            Route Options
          </h2>

          <p className="app-helper-text mt-2">
            No routes available for this journey.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId} className="mt-6 min-w-0">
      {/* Shared Card Container */}
      <Card variant="default" padding="md">
        {/* Section Title */}
        <h2 id={headingId} className="app-section-title">
          Route Options
        </h2>

        <p id={descriptionId} className="app-helper-text mt-1">
          {journeys.length} available{" "}
          {journeys.length === 1 ? "route" : "routes"}. Select a route to view
          details.
        </p>

        {/* Candidate Routes */}
        <fieldset aria-describedby={descriptionId} className="mt-4 min-w-0">
          <legend className="sr-only">Select a journey</legend>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-3 lg:gap-4">
            {journeys.map((journey, index) => {
              const isSelected = journey.id === selectedJourneyId;

              const isRecommended = index === 0;

              const labels = getJourneyLabels(journey, journeys);

              const optionId = `${componentId}-option-${index}`;

              const optionLabelId = `${optionId}-label`;

              const optionDescriptionId = `${optionId}-description`;

              const routeSequence = journey.legs
                .map((leg) => leg.routeId)
                .join(", then ");

              return (
                <label
                  key={journey.id}
                  htmlFor={optionId}
                  className={`flex min-w-0 cursor-pointer flex-col rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-nyu focus-within:ring-offset-2 motion-reduce:transition-none lg:p-4 ${
                    isSelected
                      ? "border-nyu bg-nyu-light"
                      : "border-app-border bg-app-surface hover:bg-slate-50"
                  }`}
                >
                  {/* Route Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Native Radio Button */}
                      <input
                        id={optionId}
                        type="radio"
                        name={`${componentId}-selectedJourney`}
                        value={journey.id}
                        checked={isSelected}
                        aria-labelledby={optionLabelId}
                        aria-describedby={optionDescriptionId}
                        onChange={() => onSelect(journey.id)}
                        className="h-5 w-5 shrink-0 cursor-pointer accent-nyu"
                      />

                      {/* Accessible Option Label */}
                      <span
                        id={optionLabelId}
                        className="text-xs font-semibold text-app-text lg:text-sm"
                      >
                        Option {index + 1}
                        {isRecommended && (
                          <span className="sr-only">, Recommended</span>
                        )}
                      </span>
                    </div>

                    {/* Recommended Badge */}
                    {isRecommended && (
                      <span
                        aria-hidden="true"
                        className="rounded-full bg-nyu-light px-2 py-1 text-[11px] font-semibold text-nyu lg:text-xs"
                      >
                        Recommended
                      </span>
                    )}
                  </div>

                  {/* Accessible Route Summary */}
                  <span id={optionDescriptionId} className="sr-only">
                    Estimated travel time: {journey.totalDurationMinutes}{" "}
                    minutes. {journey.totalStops}{" "}
                    {journey.totalStops === 1 ? "stop" : "stops"}.{" "}
                    {journey.transfers}{" "}
                    {journey.transfers === 1 ? "transfer" : "transfers"}.
                    {routeSequence ? ` Subway lines: ${routeSequence}.` : ""}
                    {labels.length > 0 ? ` ${labels.join(", ")}.` : ""}
                  </span>

                  {/* Duration and Subway Lines */}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 lg:mt-4 lg:flex-col lg:items-start lg:gap-4">
                    {/* Journey Duration */}
                    <div>
                      <p className="text-2xl font-bold leading-tight text-app-text lg:text-3xl">
                        {journey.totalDurationMinutes}

                        <span className="ml-1 text-xs font-medium text-app-muted lg:text-sm">
                          min
                        </span>
                      </p>

                      <p className="mt-1 hidden text-xs text-app-muted lg:block">
                        Estimated travel time
                      </p>
                    </div>

                    {/* Subway Line Sequence */}
                    <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
                      {journey.legs.map((leg, legIndex) => (
                        <div
                          key={`${journey.id}-${legIndex}`}
                          className="flex items-center gap-1.5 lg:gap-2"
                        >
                          {/* Transfer Direction */}
                          {legIndex > 0 && (
                            <span
                              aria-hidden="true"
                              className="text-xs text-app-muted lg:text-sm"
                            >
                              →
                            </span>
                          )}

                          {/* Shared Route Badge */}
                          <RouteBadge
                            routeId={leg.routeId}
                            size="sm"
                            className="h-7 min-w-7 lg:h-8 lg:min-w-8 lg:text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compact Mobile Statistics */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-app-muted lg:hidden">
                    <span>
                      {journey.totalStops}{" "}
                      {journey.totalStops === 1 ? "stop" : "stops"}
                    </span>

                    <span aria-hidden="true">·</span>

                    <span>
                      {journey.transfers}{" "}
                      {journey.transfers === 1 ? "transfer" : "transfers"}
                    </span>
                  </div>

                  {/* Detailed Desktop Statistics */}
                  <div className="mt-4 hidden grid-cols-2 gap-2 lg:grid">
                    {/* Total Stops */}
                    <div className="rounded-lg bg-slate-100 p-2">
                      <p className="text-xs text-app-muted">Stops</p>

                      <p className="mt-1 font-semibold text-app-text">
                        {journey.totalStops}
                      </p>
                    </div>

                    {/* Total Transfers */}
                    <div className="rounded-lg bg-slate-100 p-2">
                      <p className="text-xs text-app-muted">Transfers</p>

                      <p className="mt-1 font-semibold text-app-text">
                        {journey.transfers}
                      </p>
                    </div>
                  </div>

                  {/* Route Strengths and Mobile Selection Status */}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 lg:mt-3">
                    {/* Route Strength Labels */}
                    <div className="flex flex-wrap gap-1.5">
                      {labels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-app-muted lg:text-xs"
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                    {/* Mobile Selection Indicator */}
                    {isSelected && (
                      <span
                        aria-hidden="true"
                        className="text-xs font-semibold text-nyu lg:hidden"
                      >
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Desktop Selection Status */}
                  <div
                    aria-hidden="true"
                    className="mt-auto hidden pt-4 lg:block"
                  >
                    <div
                      className={`rounded-lg py-2 text-center text-sm font-medium ${
                        isSelected
                          ? "bg-nyu text-white"
                          : "border border-app-border text-app-muted"
                      }`}
                    >
                      {isSelected ? "Selected Route" : "View Route"}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
      </Card>
    </section>
  );
}
