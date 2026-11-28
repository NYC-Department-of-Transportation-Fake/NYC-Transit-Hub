import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Link, useParams, useSearchParams, useNavigate } from "react-router";

import { fetchArrivals, fetchStation } from "../services/transit";

import {
  arrivalLabel,
  formatTime,
  isFeedStale,
  isFeedExpired,
} from "../services/transitPresentation";

import type { StationDetail } from "../types/transit";
import type { JourneyNavigationState } from "../types/journey";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

import RouteBadge, { RouteBadgeGroup } from "../components/ui/RouteBadge";

// Shared loading indicator
function LoadingIndicator({ message }: { message: string }) {
  return (
    <Card>
      <div
        role="status"
        className="flex items-center gap-3 text-sm text-app-muted"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 shrink-0 animate-spin text-nyu motion-reduce:animate-none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            className="opacity-25"
          />

          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        <span>{message}</span>
      </div>
    </Card>
  );
}

// Live arrival information
function Arrivals({ station }: { station: StationDetail }) {
  const [routeId, setRouteId] = useState("");
  const [stopId, setStopId] = useState("");

  const [now, setNow] = useState(() => Date.now());

  // Update the current time every 15 seconds
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);

    return () => window.clearInterval(timer);
  }, []);

  // Fetch live arrival predictions
  const result = useQuery({
    queryKey: ["transit", "arrivals", station.id, routeId, stopId],

    queryFn: ({ signal }) =>
      fetchArrivals(
        station.id,
        {
          routeId,
          stopId,
          limit: 20,
        },
        signal,
      ),

    refetchInterval: 30000,
    staleTime: 15000,
    retry: 1,
  });

  // Check whether arrival data has expired
  const expired = result.data?.meta.feeds.some((feed) =>
    isFeedExpired(feed, now),
  );

  // Filter out previous arrival predictions
  const arrivals = expired
    ? []
    : (result.data?.data.filter((arrival) => {
        const time = arrival.arrivalTime ?? arrival.departureTime;

        return time && Date.parse(time) >= now;
      }) ?? []);

  // Check whether arrival data is outdated
  const stale = result.data?.meta.feeds.some((feed) => isFeedStale(feed, now));

  // Clear all arrival filters
  const handleClearFilters = () => {
    setRouteId("");
    setStopId("");
  };

  return (
    <section aria-labelledby="arrivals-title" className="min-w-0 space-y-4">
      {/* Shared Arrivals Filter Card */}
      <Card variant="default" padding="md">
        {/* Arrivals Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="arrivals-title" className="app-section-title">
            Upcoming Trains
          </h2>

          {/* Manual Refresh Button */}
          <Button
            variant="primary"
            size="sm"
            loading={result.isFetching}
            loadingText="Refreshing..."
            onClick={() => void result.refetch()}
            leftIcon={
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
                strokeLinejoin="round"
              >
                <path d="M20 7v5h-5" />

                <path d="M20 12a8 8 0 1 0-2.3 5.7" />
              </svg>
            }
          >
            Refresh arrivals
          </Button>
        </div>

        {/* Automatic Refresh Information */}
        <p className="app-helper-text mt-2">
          Refreshes every 30 seconds while this page is active. Times are
          estimates, shown in New York time.
        </p>

        {/* Arrival Filters */}
        <div className="mt-4 grid gap-4 border-t border-app-border pt-4 sm:grid-cols-2">
          {/* Subway Line Filter */}
          <div className="min-w-0">
            <label htmlFor="arrival-route" className="app-label">
              Line
            </label>

            <select
              id="arrival-route"
              value={routeId}
              onChange={(event) => setRouteId(event.target.value)}
              className="app-input mt-2 block"
            >
              <option value="">All lines at this station</option>

              {station.routeIds.map((id) => (
                <option key={id} value={id}>
                  {id} train
                </option>
              ))}
            </select>
          </div>

          {/* Boarding Stop Filter */}
          <div className="min-w-0">
            <label htmlFor="arrival-stop" className="app-label">
              Boarding stop
            </label>

            <select
              id="arrival-stop"
              value={stopId}
              onChange={(event) => setStopId(event.target.value)}
              className="app-input mt-2 block"
            >
              <option value="">All boarding stops</option>

              {station.stops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.directionLabel
                    ? `${stop.directionLabel} · ${stop.id}`
                    : `Boarding stop ${stop.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(routeId || stopId) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="app-helper-text">Active filters:</span>

              {routeId && <RouteBadge routeId={routeId} size="sm" />}

              {stopId && (
                <span className="break-words rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-app-text">
                  Stop {stopId}
                </span>
              )}
            </div>

            <Button variant="secondary" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Loading State */}
      {result.isPending && (
        <LoadingIndicator message="Loading arrival predictions..." />
      )}

      {/* Error State */}
      {result.isError && (
        <div role="alert" className="app-error-panel">
          <p className="font-semibold">Could not refresh arrivals.</p>

          <p className="mt-1">
            {result.data
              ? expired
                ? "Previously received predictions have expired and are not displayed."
                : "Previously received predictions are shown and may be outdated."
              : "Arrival information is unavailable. Please try refreshing."}
          </p>

          <Button
            variant="secondary"
            size="sm"
            loading={result.isFetching}
            loadingText="Retrying..."
            onClick={() => void result.refetch()}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Stale Data Warning */}
      {stale && (
        <div role="status" className="app-warning-panel">
          <p className="font-semibold">Arrival data may be outdated</p>

          <p className="mt-1">
            Some arrival data is outdated or could not be refreshed. Check
            station displays before travelling.
          </p>
        </div>
      )}

      {/* Arrival Results */}
      {result.data && (
        <>
          {/* Arrival Results Summary */}
          <Card variant="outlined" padding="sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p role="status" className="text-sm font-semibold text-app-text">
                {expired
                  ? "Predictions expired"
                  : `${arrivals.length} upcoming ${
                      arrivals.length === 1 ? "prediction" : "predictions"
                    }`}
              </p>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  expired
                    ? "bg-amber-100 text-amber-900"
                    : stale || result.isError
                      ? "bg-amber-100 text-amber-900"
                      : result.isFetching
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                }`}
              >
                {expired
                  ? "Expired"
                  : stale
                    ? "Outdated data"
                    : result.isError
                      ? "Refresh failed"
                      : result.isFetching
                        ? "Refreshing"
                        : "Data received"}
              </span>
            </div>

            <p className="app-helper-text mt-2">
              Last response: {formatTime(result.data.meta.servedAt)}
            </p>
          </Card>

          {/* Expired Predictions */}
          {expired ? (
            <div role="status" className="app-warning-panel">
              <p className="font-semibold">Arrival predictions have expired</p>

              <p className="mt-1">
                These predictions are too old to display. Refresh to get updated
                arrivals.
              </p>

              <Button
                variant="secondary"
                size="sm"
                loading={result.isFetching}
                loadingText="Refreshing..."
                onClick={() => void result.refetch()}
                className="mt-3"
              >
                Refresh arrivals
              </Button>
            </div>
          ) : (
            arrivals.length === 0 && (
              <Card variant="outlined" padding="lg">
                <div className="flex flex-col items-center py-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-nyu-light text-nyu">
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="9" />

                      <path d="M12 7v5l3 2" />
                    </svg>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-app-text">
                    No upcoming predictions
                  </h3>

                  <p className="app-helper-text mt-2 max-w-md">
                    No upcoming predictions match these filters in the retrieved
                    data. This does not confirm normal service or that trains
                    have stopped running.
                  </p>

                  {(routeId || stopId) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </Card>
            )
          )}

          {/* Arrival Cards */}
          {arrivals.length > 0 && (
            <ul className="grid list-none gap-3 sm:grid-cols-2">
              {arrivals.map((arrival, index) => (
                <li
                  key={`${arrival.tripId}-${arrival.startDate}-${arrival.stopId}-${arrival.stopSequence}-${index}`}
                  className="min-w-0"
                >
                  <Card variant="default" padding="md" className="h-full">
                    <article className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                      {/* Arrival Information */}
                      <div className="min-w-0 flex-1">
                        {/* Subway Line */}
                        <div className="flex items-center gap-2">
                          <RouteBadge routeId={arrival.routeId} size="md" />

                          <h3 className="break-words text-base font-bold text-app-text sm:text-lg">
                            {arrival.routeId} train
                          </h3>
                        </div>

                        {/* Direction */}
                        <p className="mt-2 break-words text-sm font-medium text-app-text">
                          {arrival.directionLabel ??
                            `Boarding stop ${arrival.stopId}`}
                        </p>

                        {/* Destination */}
                        {arrival.destination && (
                          <p className="app-helper-text mt-1 break-words">
                            To {arrival.destination}
                          </p>
                        )}

                        {/* Estimated Clock Time */}
                        <p className="app-helper-text mt-2">
                          {arrival.arrivalTime ? "Arrives" : "Departs"}{" "}
                          {formatTime(
                            (arrival.arrivalTime ?? arrival.departureTime)!,
                          )}
                        </p>
                      </div>

                      {/* Estimated Arrival Countdown */}
                      <div className="max-w-full shrink-0 rounded-lg bg-nyu-light px-3 py-3 text-right sm:px-4">
                        <p className="break-words text-xl font-bold tabular-nums text-nyu sm:text-2xl">
                          {arrivalLabel(arrival, now)}
                        </p>

                        <p className="mt-1 text-xs text-app-muted">
                          {arrival.arrivalTime
                            ? "Estimated arrival"
                            : "Estimated departure"}
                        </p>
                      </div>
                    </article>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          {/* Data Freshness Details */}
          <Card variant="outlined" padding="md">
            <details className="text-sm text-app-muted">
              <summary className="cursor-pointer rounded-sm font-semibold text-app-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nyu">
                Data freshness and cache status
              </summary>

              <div className="mt-4 space-y-3">
                {result.data.meta.feeds.map((feed) => (
                  <div
                    key={feed.feedId}
                    className="min-w-0 rounded-lg border border-app-border bg-slate-50 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Feed ID */}
                      <p className="break-words font-semibold text-app-text">
                        {feed.feedId}
                      </p>

                      {/* Cache State */}
                      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-app-muted">
                        {feed.cached
                          ? "Cached response"
                          : "Newly fetched response"}
                      </span>
                    </div>

                    {/* Expired Feed */}
                    {isFeedExpired(feed, now) ? (
                      <p className="mt-2 text-xs font-medium text-app-error">
                        Expired data
                      </p>
                    ) : isFeedStale(feed, now) ? (
                      <p className="mt-2 text-xs font-medium text-app-warning">
                        Outdated data
                      </p>
                    ) : null}

                    {/* Refresh Failure */}
                    {feed.refreshFailed && (
                      <p className="mt-2 text-xs font-medium text-app-warning">
                        Refresh failed; using older data
                      </p>
                    )}

                    {/* Source Update Time */}
                    <p className="app-helper-text mt-3">
                      MTA updated: {formatTime(feed.sourceUpdatedAt)}
                    </p>

                    {/* Retrieval Time */}
                    <p className="app-helper-text mt-1">
                      Retrieved: {formatTime(feed.fetchedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          </Card>
        </>
      )}
    </section>
  );
}

// Station details page
export default function StationDetailPage() {
  const { stationId = "" } = useParams();

  const [params] = useSearchParams();

  const navigate = useNavigate();

  // Preserve station search parameters
  const searchString = params.toString();

  const backToStations = searchString
    ? `/stations?${searchString}`
    : "/stations";

  // Fetch station details
  const station = useQuery({
    queryKey: ["transit", "station", stationId],

    queryFn: ({ signal }) => fetchStation(stationId, signal),

    enabled: !!stationId,
    staleTime: 300000,
    retry: 1,
  });

  // Use this station as the starting point
  const handleSetAsStart = () => {
    if (!station.data) {
      return;
    }

    const state: JourneyNavigationState = {
      from: {
        id: station.data.id,
        name: station.data.name,
      },
    };

    navigate("/journeys", { state });
  };

  // Use this station as the destination
  const handleSetAsDestination = () => {
    if (!station.data) {
      return;
    }

    const state: JourneyNavigationState = {
      to: {
        id: station.data.id,
        name: station.data.name,
      },
    };

    navigate("/journeys", { state });
  };

  return (
    <section className="app-page">
      {/* Back to Stations */}
      <Link
        to={backToStations}
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-nyu hover:text-nyu-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nyu"
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
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />

          <path d="m12 19-7-7 7-7" />
        </svg>
        Back to stations
      </Link>

      {/* Station Loading */}
      {station.isPending && (
        <>
          <PageHeader title="Station Details" />

          <LoadingIndicator message="Loading station..." />
        </>
      )}

      {/* Station Error */}
      {station.isError && (
        <div role="alert" className="app-error-panel mb-4">
          <p className="font-semibold">Unable to load station.</p>

          <p className="mt-2 break-words">{station.error.message}</p>

          <Button
            variant="secondary"
            size="sm"
            loading={station.isFetching}
            loadingText="Retrying..."
            onClick={() => void station.refetch()}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Station Details */}
      {station.data && (
        <>
          {/* Shared Station Page Header */}
          <PageHeader
            eyebrow={`Station ${station.data.id}`}
            title={station.data.name}
            description="View subway lines, upcoming trains, and plan your journey from this station."
          >
            {station.data.routeIds.length > 0 ? (
              <RouteBadgeGroup routeIds={station.data.routeIds} size="lg" />
            ) : (
              <p className="app-helper-text">No scheduled lines listed.</p>
            )}
          </PageHeader>

          {/* Station Overview Card */}
          <Card variant="default" padding="md" className="mb-4 sm:mb-6">
            <h2 className="app-section-title">Station Overview</h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Scheduled Subway Lines */}
              <div className="min-w-0 rounded-lg bg-slate-100 p-3 sm:p-4">
                <p className="app-helper-text">Scheduled lines</p>

                <p className="mt-1 text-2xl font-bold text-app-text">
                  {station.data.routeIds.length}
                </p>
              </div>

              {/* Boarding Stops */}
              <div className="min-w-0 rounded-lg bg-slate-100 p-3 sm:p-4">
                <p className="app-helper-text">Boarding stops</p>

                <p className="mt-1 text-2xl font-bold text-app-text">
                  {station.data.stops.length}
                </p>
              </div>
            </div>

            <p className="app-helper-text mt-3">
              Scheduled lines may differ from current service conditions.
            </p>
          </Card>

          {/* Trip Planning Integration */}
          <section
            aria-labelledby="station-journey-title"
            className="mb-4 sm:mb-6"
          >
            <Card variant="default" padding="md">
              <h2 id="station-journey-title" className="app-section-title">
                Plan a Trip
              </h2>

              <p className="app-helper-text mt-1">
                Use this station as your starting point or destination.
              </p>

              {/* Journey Navigation Buttons */}
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleSetAsStart}
                >
                  Set as Start
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={handleSetAsDestination}
                >
                  Set as Destination
                </Button>
              </div>
            </Card>
          </section>

          {/* Live Arrivals */}
          <Arrivals key={stationId} station={station.data} />
        </>
      )}
    </section>
  );
}
