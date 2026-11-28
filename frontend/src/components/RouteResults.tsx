import { useId } from "react";
import { Link } from "react-router";

import type { JourneyResult, JourneyStation } from "../types/journey";

import { getRouteColor } from "../services/transitPresentation";

import JourneyMap from "./JourneyMap";

import Card from "./ui/Card";
import RouteBadge from "./ui/RouteBadge";

// Component properties
type RouteResultsProps = {
  from: string;
  to: string;
  journey?: JourneyResult;
};

// Station link properties
type StationLinkProps = {
  station: JourneyStation;
  emphasized?: boolean;
  isDemo: boolean;
};

// Journey statistic properties
type JourneyStatisticProps = {
  label: string;
  value: string | number;
};

// Reusable journey statistic
function JourneyStatistic({ label, value }: JourneyStatisticProps) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-100 p-2 text-center sm:p-4">
      <p className="text-xs text-app-muted sm:text-sm">{label}</p>

      <p className="mt-1 break-words text-lg font-bold text-app-text sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

// Display a station name with optional navigation
function StationLink({
  station,
  emphasized = false,
  isDemo,
}: StationLinkProps) {
  const textClass = emphasized
    ? "text-sm font-semibold sm:text-base"
    : "text-xs sm:text-sm";

  // Mock stations do not have real backend records
  if (isDemo || !station.id.trim() || station.id.startsWith("demo-")) {
    return (
      <span
        className={`break-words ${
          emphasized ? "text-app-text" : "text-app-muted"
        } ${textClass}`}
      >
        {station.name}
      </span>
    );
  }

  // Navigate to a real station detail page
  return (
    <Link
      to={`/stations/${encodeURIComponent(station.id)}`}
      className={`break-words text-nyu underline underline-offset-2 hover:text-nyu-hover focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-nyu ${textClass}`}
      aria-label={`View station details and arrivals for ${station.name}`}
    >
      {station.name}
    </Link>
  );
}

// Journey results component
export default function RouteResults({ from, to, journey }: RouteResultsProps) {
  // Generate unique accessibility IDs
  const componentId = useId();

  const headingId = `${componentId}-heading`;

  const detailsHeadingId = `${componentId}-details`;

  // Identify mock journeys
  const isDemo = journey?.id.startsWith("demo-") ?? false;

  return (
    <section aria-labelledby={headingId} className="mt-6 min-w-0">
      {/* Shared Results Card */}
      <Card variant="default" padding="lg">
        {/* Section Title */}
        <h2 id={headingId} className="app-section-title">
          Route Results
        </h2>

        {/* Starting and Destination Stations */}
        <div className="mt-4 space-y-2 break-words text-sm text-app-text sm:space-y-3 sm:text-base">
          <p>
            <strong>From:</strong>{" "}
            {journey ? (
              <StationLink station={journey.from} emphasized isDemo={isDemo} />
            ) : (
              from
            )}
          </p>

          <p>
            <strong>To:</strong>{" "}
            {journey ? (
              <StationLink station={journey.to} emphasized isDemo={isDemo} />
            ) : (
              to
            )}
          </p>
        </div>

        {/* No Route Data */}
        {!journey ? (
          <div role="status" className="app-info-panel mt-4">
            Route details will appear here once route planning is connected.
          </div>
        ) : (
          <div className="mt-5 sm:mt-6">
            {/* Journey Overview */}
            <div
              role="group"
              aria-label="Journey overview"
              className="grid grid-cols-3 gap-2 sm:gap-4"
            >
              {/* Estimated Duration */}
              <JourneyStatistic
                label="Duration"
                value={`${journey.totalDurationMinutes} min`}
              />

              {/* Total Stops */}
              <JourneyStatistic label="Stops" value={journey.totalStops} />

              {/* Total Transfers */}
              <JourneyStatistic label="Transfers" value={journey.transfers} />
            </div>

            {/* Journey Map */}
            <JourneyMap journey={journey} />

            {/* Journey Details */}
            <section
              aria-labelledby={detailsHeadingId}
              className="mt-6 min-w-0"
            >
              <h3 id={detailsHeadingId} className="app-section-title">
                Journey Details
              </h3>

              {/* Station Navigation Information */}
              {!isDemo ? (
                <p className="app-helper-text mt-1">
                  Select a station name to view station details and live arrival
                  information.
                </p>
              ) : (
                <div className="app-warning-panel mt-3">
                  Demo stations are for UI testing only. Station detail links
                  are unavailable.
                </div>
              )}

              {/* Journey Legs */}
              <ol className="mt-4 list-none space-y-4">
                {journey.legs.map((leg, index) => {
                  const routeColor = getRouteColor(leg.routeId);

                  const isFirstLeg = index === 0;

                  const isLastLeg = index === journey.legs.length - 1;

                  return (
                    <li key={`${journey.id}-${index}`} className="min-w-0">
                      {/* Transfer Information */}
                      {!isFirstLeg && (
                        <div className="app-warning-panel mb-4 flex flex-wrap items-center gap-2">
                          <svg
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0"
                          >
                            <path d="M7 7h14" />
                            <path d="m17 3 4 4-4 4" />
                            <path d="M17 17H3" />
                            <path d="m7 13-4 4 4 4" />
                          </svg>

                          <span className="font-medium">Transfer to</span>

                          {/* Shared Transfer Route Badge */}
                          <RouteBadge
                            routeId={leg.routeId}
                            size="sm"
                            className="h-7 min-w-7"
                          />

                          <span>train at</span>

                          <StationLink
                            station={leg.from}
                            emphasized
                            isDemo={isDemo}
                          />
                        </div>
                      )}

                      {/* Shared Journey Leg Card */}
                      <Card variant="outlined" padding="sm" className="sm:p-4">
                        {/* Subway Line Header */}
                        <div className="flex items-center gap-3">
                          {/* Shared Route Badge */}
                          <RouteBadge
                            routeId={leg.routeId}
                            size="md"
                            className="sm:h-9 sm:min-w-9 sm:text-base"
                          />

                          <div className="min-w-0 flex-1">
                            <h4 className="break-words text-sm font-semibold text-app-text sm:text-base">
                              Take the {leg.routeId} train
                            </h4>

                            <p className="app-helper-text mt-1">
                              {leg.durationMinutes} min
                            </p>
                          </div>

                          {/* Journey Step Number */}
                          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-app-muted">
                            Step {index + 1}
                          </span>
                        </div>

                        {/* Station List */}
                        <ol
                          aria-label={`Stations on the ${leg.routeId} train`}
                          className="ml-2 mt-4 list-none border-l-4 pl-3 sm:ml-4 sm:pl-5"
                          style={{
                            borderColor: routeColor,
                          }}
                        >
                          {/* Starting Station */}
                          <li className="relative">
                            {/* Station Marker */}
                            <span
                              aria-hidden="true"
                              className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 bg-white sm:-left-[29px]"
                              style={{
                                borderColor: routeColor,
                              }}
                            />

                            <StationLink
                              station={leg.from}
                              emphasized
                              isDemo={isDemo}
                            />

                            <p className="app-helper-text mt-1">
                              {isFirstLeg
                                ? "Board the train"
                                : "Board connecting train"}
                            </p>
                          </li>

                          {/* Intermediate Stops */}
                          {leg.stops
                            .filter(
                              (station) =>
                                station.id !== leg.from.id &&
                                station.id !== leg.to.id,
                            )
                            .map((station, stopIndex) => (
                              <li
                                key={`${station.id}-${stopIndex}`}
                                className="relative mt-3"
                              >
                                {/* Intermediate Station Marker */}
                                <span
                                  aria-hidden="true"
                                  className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-white sm:-left-[27px]"
                                  style={{
                                    border: `2px solid ${routeColor}`,
                                  }}
                                />

                                <StationLink
                                  station={station}
                                  isDemo={isDemo}
                                />
                              </li>
                            ))}

                          {/* Destination or Transfer Station */}
                          <li className="relative mt-3">
                            {/* Final Station Marker */}
                            <span
                              aria-hidden="true"
                              className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 bg-white sm:-left-[29px]"
                              style={{
                                borderColor: routeColor,
                              }}
                            />

                            <StationLink
                              station={leg.to}
                              emphasized
                              isDemo={isDemo}
                            />

                            <p
                              className={`mt-1 text-xs font-medium ${
                                isLastLeg
                                  ? "text-app-success"
                                  : "text-app-muted"
                              }`}
                            >
                              {isLastLeg
                                ? "Arrive at destination"
                                : "Transfer to another line"}
                            </p>
                          </li>
                        </ol>
                      </Card>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        )}
      </Card>
    </section>
  );
}
