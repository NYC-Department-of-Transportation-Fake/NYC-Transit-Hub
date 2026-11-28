import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";

import type { FormEvent } from "react";

import { fetchRoutes, fetchStations } from "../services/transit";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

import { RouteBadgeGroup } from "../components/ui/RouteBadge";

// Station search page
export default function StationsPage() {
  const [params, setParams] = useSearchParams();

  // Read search filters from URL parameters
  const query = params.get("query") ?? "";
  const routeId = params.get("routeId") ?? "";

  // Fetch matching subway stations
  const stations = useQuery({
    queryKey: ["transit", "stations", query, routeId],

    queryFn: ({ signal }) => fetchStations(query, routeId, signal),

    staleTime: 300000,
    retry: 1,
  });

  // Fetch available subway lines
  const routes = useQuery({
    queryKey: ["transit", "routes"],

    queryFn: ({ signal }) => fetchRoutes(signal),

    staleTime: 300000,
    retry: 1,
  });

  // Handle station search submission
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const next = new URLSearchParams();

    const name = String(form.get("query") ?? "").trim();

    const line = String(form.get("routeId") ?? "");

    if (name) {
      next.set("query", name);
    }

    if (line) {
      next.set("routeId", line);
    }

    setParams(next);
  };

  // Preserve the selected line if route data is unavailable
  const selectedRouteUnavailable =
    routeId !== "" && !routes.data?.data.some((route) => route.id === routeId);

  // Preserve search filters when navigating to station details
  const searchString = params.toString();

  return (
    <section className="app-page">
      {/* Shared Page Header */}
      <PageHeader
        title="Find a Station"
        description="Search NYC subway stations by name or line, then check upcoming trains and station details."
      />

      {/* Shared Station Search Card */}
      <Card variant="default" padding="md">
        <form
          key={params.toString()}
          onSubmit={handleSearch}
          aria-label="Search subway stations"
          className="flex flex-col gap-4 lg:flex-row lg:items-end"
        >
          {/* Station Name Search */}
          <div className="min-w-0 flex-1">
            <label htmlFor="station-search" className="app-label">
              Station name
            </label>

            <input
              id="station-search"
              name="query"
              type="search"
              defaultValue={query}
              placeholder="e.g. Times Sq"
              className="app-input mt-2 block"
            />
          </div>

          {/* Subway Line Filter */}
          <div className="min-w-0 lg:w-64">
            <label htmlFor="station-line" className="app-label">
              Subway line
            </label>

            <select
              id="station-line"
              name="routeId"
              defaultValue={routeId}
              className="app-input mt-2 block"
            >
              <option value="">All lines</option>

              {/* Preserve unavailable selected route */}
              {selectedRouteUnavailable && (
                <option value={routeId}>{routeId}</option>
              )}

              {/* Available subway lines */}
              {routes.data?.data.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.id} · {route.longName}
                </option>
              ))}
            </select>
          </div>

          {/* Search Actions */}
          <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
            {/* Search Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
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
                  <circle cx="11" cy="11" r="8" />

                  <path d="m21 21-4.35-4.35" />
                </svg>
              }
            >
              Search
            </Button>

            {/* Clear Search Link */}
            <Link
              to="/stations"
              onClick={(event) => {
                if (!searchString) {
                  event.currentTarget.closest("form")?.reset();
                }
              }}
              className="app-btn-secondary"
            >
              Clear
            </Link>
          </div>
        </form>

        {/* Route Filter Error */}
        {routes.isError && (
          <div role="alert" className="app-error-panel mt-4">
            <p className="font-medium">Line filters could not load.</p>

            <Button
              variant="secondary"
              size="sm"
              loading={routes.isFetching}
              loadingText="Retrying..."
              onClick={() => void routes.refetch()}
              className="mt-3"
            >
              Retry lines
            </Button>
          </div>
        )}
      </Card>

      {/* Station Loading State */}
      {stations.isPending && (
        <Card className="mt-4 sm:mt-6">
          <div
            role="status"
            className="flex items-center gap-3 text-sm text-app-muted"
          >
            {/* Loading Spinner */}
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

            <span>Loading stations...</span>
          </div>

          {/* Loading Skeleton */}
          <div
            aria-hidden="true"
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-xl border border-app-border p-4 motion-reduce:animate-none"
              >
                <div className="h-5 w-3/4 rounded bg-slate-200" />

                <div className="mt-3 flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-slate-200" />

                  <div className="h-6 w-6 rounded-full bg-slate-200" />

                  <div className="h-6 w-6 rounded-full bg-slate-200" />
                </div>

                <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Station Error State */}
      {stations.isError && (
        <div role="alert" className="app-error-panel mt-4 sm:mt-6">
          <p className="font-semibold">Unable to load stations.</p>

          <p className="mt-2 break-words">{stations.error.message}</p>

          <Button
            variant="secondary"
            size="sm"
            loading={stations.isFetching}
            loadingText="Retrying..."
            onClick={() => void stations.refetch()}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Station Search Results */}
      {stations.data && (
        <section
          aria-labelledby="station-results-heading"
          className="mt-4 min-w-0 sm:mt-6"
        >
          {/* Results Header */}
          <Card variant="default" padding="md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="station-results-heading" className="app-section-title">
                Station Results
              </h2>

              {/* Matching Station Count */}
              <span
                role="status"
                className="rounded-full bg-nyu-light px-3 py-1.5 text-sm font-semibold text-nyu"
              >
                {stations.data.total} matching{" "}
                {stations.data.total === 1
                  ? "station record"
                  : "station records"}
              </span>
            </div>

            {/* Active Search Filters */}
            {(query || routeId) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="app-helper-text">Active filters:</span>

                {/* Search Query */}
                {query && (
                  <span className="max-w-full break-words rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-app-text sm:text-sm">
                    {query}
                  </span>
                )}

                {/* Selected Subway Line */}
                {routeId && <RouteBadgeGroup routeIds={[routeId]} size="sm" />}
              </div>
            )}

            {/* Station Data Information */}
            <p className="app-helper-text mt-3">
              Same-name stations may serve different platforms or lines. Line
              coverage follows the regular schedule.
            </p>
          </Card>

          {/* Empty Search Results */}
          {stations.data.total === 0 && (
            <Card variant="outlined" padding="lg" className="mt-4">
              <div className="flex flex-col items-center py-4 text-center">
                {/* Empty Search Icon */}
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
                    <circle cx="11" cy="11" r="8" />

                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-app-text">
                  No stations found
                </h3>

                <p className="app-helper-text mt-2 max-w-sm">
                  No stations match your current search. Try another station
                  name or clear the subway line filter.
                </p>

                <Link to="/stations" className="app-btn-outline mt-4">
                  Clear Search Filters
                </Link>
              </div>
            </Card>
          )}

          {/* Station Cards */}
          <ul className="mt-4 grid list-none gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {stations.data.data.map((station) => (
              <li key={station.id} className="min-w-0">
                {/* Entire Station Card Is Clickable */}
                <Link
                  to={`/stations/${encodeURIComponent(
                    station.id,
                  )}${searchString ? `?${searchString}` : ""}`}
                  className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nyu"
                >
                  <Card
                    variant="default"
                    padding="md"
                    className="flex h-full flex-col transition-colors group-hover:border-nyu motion-reduce:transition-none"
                  >
                    {/* Station Name */}
                    <h3 className="break-words text-base font-bold text-app-text group-hover:text-nyu sm:text-lg">
                      {station.name}
                    </h3>

                    {/* Shared Subway Route Badges */}
                    {station.routeIds.length > 0 ? (
                      <RouteBadgeGroup
                        routeIds={station.routeIds}
                        size="md"
                        className="mt-3"
                      />
                    ) : (
                      <p className="app-helper-text mt-3">
                        No scheduled lines listed
                      </p>
                    )}

                    {/* Station ID */}
                    <p className="app-helper-text mt-3 break-words">
                      Station {station.id}
                    </p>

                    {/* View Arrivals Action */}
                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between gap-2 border-t border-app-border pt-3">
                        <span className="text-sm font-semibold text-nyu">
                          View arrivals
                        </span>

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
                          className="shrink-0 text-nyu transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:transform-none"
                        >
                          <path d="M5 12h14" />

                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
