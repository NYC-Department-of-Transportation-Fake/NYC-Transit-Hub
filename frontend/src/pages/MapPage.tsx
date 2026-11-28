import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Link, useNavigate } from "react-router";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import { fetchRoutes, fetchStations } from "../services/transit";

import type {
  JourneyNavigationState,
  JourneyStationSelection,
} from "../types/journey";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

import { RouteBadgeGroup } from "../components/ui/RouteBadge";

import "leaflet/dist/leaflet.css";

// Subway map page
export default function MapPage() {
  const [routeId, setRouteId] = useState("");

  const navigate = useNavigate();

  // Fetch stations according to the selected subway line
  const stations = useQuery({
    queryKey: ["transit", "stations", "", routeId],

    queryFn: ({ signal }) => fetchStations("", routeId, signal),

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

  // Use a map station as the starting point
  const handleSetAsStart = (station: JourneyStationSelection) => {
    const state: JourneyNavigationState = {
      from: {
        id: station.id,
        name: station.name,
      },
    };

    navigate("/journeys", { state });
  };

  // Use a map station as the destination
  const handleSetAsDestination = (station: JourneyStationSelection) => {
    const state: JourneyNavigationState = {
      to: {
        id: station.id,
        name: station.name,
      },
    };

    navigate("/journeys", { state });
  };

  return (
    <section className="app-page">
      {/* Shared Page Header */}
      <PageHeader
        title="Subway Map"
        description="Explore NYC subway stations, filter by line, and plan your next trip."
      >
        <p className="app-helper-text">
          Select a station marker to view upcoming trains, plan a trip, or{" "}
          <Link
            to="/stations"
            className="font-medium text-nyu underline underline-offset-2 hover:text-nyu-hover focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-nyu"
          >
            search the station list
          </Link>
          .
        </p>
      </PageHeader>

      {/* Shared Subway Filter Card */}
      <Card variant="default" padding="md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {/* Subway Line Filter */}
          <div className="min-w-0 flex-1">
            <label htmlFor="map-route" className="app-label">
              Filter by line
            </label>

            <select
              id="map-route"
              value={routeId}
              onChange={(event) => setRouteId(event.target.value)}
              className="app-input mt-2 block sm:max-w-xs"
            >
              <option value="">All lines</option>

              {routes.data?.data.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.id} · {route.longName}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filter Button */}
          {routeId && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setRouteId("")}
              className="w-full sm:w-auto"
            >
              Clear Filter
            </Button>
          )}
        </div>

        {/* Route Filter Error */}
        {routes.isError && (
          <div role="alert" className="app-error-panel mt-4">
            <p className="font-medium">Line filters unavailable.</p>

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

        {/* Station Loading */}
        {stations.isPending && !stations.isError && (
          <div
            role="status"
            className="app-info-panel mt-4 flex items-center gap-3"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0 animate-spin motion-reduce:animate-none"
              viewBox="0 0 24 24"
              fill="none"
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
        )}

        {/* Station Error */}
        {stations.isError && (
          <div role="alert" className="app-error-panel mt-4">
            <p className="font-medium">Unable to load stations.</p>

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

        {/* Station Count */}
        {stations.data && (
          <div className="mt-4 border-t border-app-border pt-4">
            <div role="status" className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-nyu-light px-3 py-1.5 text-sm font-semibold text-nyu">
                {stations.data.total}{" "}
                {stations.data.total === 1 ? "station" : "stations"}
              </span>

              {routeId && <RouteBadgeGroup routeIds={[routeId]} size="sm" />}
            </div>

            <p className="app-helper-text mt-2">
              Line coverage follows the regular schedule, not current service
              conditions.
            </p>
          </div>
        )}

        {/* Empty Station Results */}
        {stations.data?.data.length === 0 &&
          !stations.isFetching &&
          !stations.isError && (
            <div className="app-info-panel mt-4">
              <p className="font-medium">No stations found for this line.</p>

              <p className="mt-1">
                Select another subway line or clear the current filter.
              </p>
            </div>
          )}
      </Card>

      {/* Shared Interactive Subway Map Card */}
      <Card variant="default" padding="sm" className="mt-4 sm:mt-6">
        {/* Map Header */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="app-section-title">Interactive Map</h2>

          {/* Station Marker Legend */}
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full border-2 border-nyu bg-nyu"
            />

            <span className="app-helper-text">Subway station</span>
          </div>
        </div>

        {/* Interactive Subway Map */}
        <div className="relative isolate overflow-hidden rounded-lg border border-app-border">
          <MapContainer
            center={[40.73, -73.99]}
            zoom={12}
            className="z-0 h-[420px] w-full sm:h-[480px] lg:h-[550px]"
          >
            {/* OpenStreetMap Base Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Subway Station Markers */}
            {stations.data?.data.map((station) => (
              <CircleMarker
                key={station.id}
                center={[station.latitude, station.longitude]}
                radius={5}
                pathOptions={{
                  color: "#57068c",
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                {/* Station Popup */}
                <Popup minWidth={180} maxWidth={260}>
                  <div className="min-w-0">
                    {/* Station Name */}
                    <h3 className="break-words text-base font-bold text-app-text">
                      {station.name}
                    </h3>

                    {/* Station ID */}
                    <p className="!my-1 text-xs text-app-muted">
                      Station {station.id}
                    </p>

                    {/* Shared Subway Line Badges */}
                    <RouteBadgeGroup
                      routeIds={station.routeIds}
                      size="sm"
                      className="mt-3"
                    />

                    {/* Trip Planning Actions */}
                    <div className="mt-4 space-y-2 border-t border-app-border pt-3">
                      {/* Set Starting Station */}
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => handleSetAsStart(station)}
                      >
                        Set as Start
                      </Button>

                      {/* Set Destination Station */}
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => handleSetAsDestination(station)}
                      >
                        Set as Destination
                      </Button>
                    </div>

                    {/* Station Details Link */}
                    <Link
                      to={`/stations/${encodeURIComponent(station.id)}`}
                      className="mt-3 block rounded-sm text-center text-sm font-semibold !text-nyu underline underline-offset-2 hover:!text-nyu-hover focus-visible:outline-2 focus-visible:outline-nyu"
                    >
                      View Station Details & Arrivals
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Map Usage Information */}
        <div className="mt-3 flex items-start gap-2">
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
            className="mt-0.5 shrink-0 text-app-muted"
          >
            <circle cx="12" cy="12" r="10" />

            <path d="M12 11v5" />

            <path d="M12 8h.01" />
          </svg>

          <p className="app-helper-text">
            Select any station on the map to view its subway lines, upcoming
            trains, or use it as the starting point or destination of your
            journey.
          </p>
        </div>
      </Card>
    </section>
  );
}
