import { useEffect, useMemo } from "react";
import { Link } from "react-router";

import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";

import type { LatLngTuple } from "leaflet";

import type { JourneyResult, JourneyStation } from "../types/journey";

import {
  getRouteColor,
  getRouteTextColor,
} from "../services/transitPresentation";

import "leaflet/dist/leaflet.css";

type JourneyMapProps = {
  journey: JourneyResult;
};

type JourneyStationPopupProps = {
  station: JourneyStation;
  title: string;
  routeIds?: string[];
  description?: string;
  isDemo: boolean;
};

// Convert station information into map coordinates
function getCoordinates(station: JourneyStation): LatLngTuple {
  return [station.latitude, station.longitude];
}

// Reusable station popup
function JourneyStationPopup({
  station,
  title,
  routeIds = [],
  description,
  isDemo,
}: JourneyStationPopupProps) {
  const canNavigate =
    !isDemo && station.id.trim() !== "" && !station.id.startsWith("demo-");

  return (
    <Popup minWidth={180} maxWidth={260}>
      <div className="min-w-0">
        {/* Station Type */}
        <p className="!my-1 text-xs font-medium text-gray-500">{title}</p>

        {/* Station Name */}
        <h3 className="break-words text-base font-bold text-gray-900">
          {station.name}
        </h3>

        {/* Station ID */}
        {canNavigate && (
          <p className="!my-1 text-xs text-gray-500">Station {station.id}</p>
        )}

        {/* Subway Line Badges */}
        {routeIds.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {[...new Set(routeIds)].map((routeId) => (
              <span
                key={routeId}
                aria-label={`${routeId} train`}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  backgroundColor: getRouteColor(routeId),
                  color: getRouteTextColor(routeId),
                }}
              >
                {routeId}
              </span>
            ))}
          </div>
        )}

        {/* Journey Instructions */}
        {description && (
          <p className="!my-2 break-words text-sm text-gray-600">
            {description}
          </p>
        )}

        {/* Station Details Navigation */}
        {canNavigate ? (
          <div className="mt-3 border-t border-gray-200 pt-3">
            <Link
              to={`/stations/${encodeURIComponent(station.id)}`}
              className="block rounded-lg bg-purple-700 px-3 py-2.5 text-center text-xs font-semibold !text-white no-underline transition-colors hover:bg-purple-800 focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              View Station Details & Arrivals
            </Link>
          </div>
        ) : (
          <p className="!mb-0 !mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
            Station details are unavailable for this preview.
          </p>
        )}
      </div>
    </Popup>
  );
}

// Automatically adjust map bounds and provide reset controls
function JourneyMapControls({ journey }: JourneyMapProps) {
  const map = useMap();

  const coordinates = useMemo(
    () => [
      getCoordinates(journey.from),

      ...journey.legs.flatMap((leg) => [
        getCoordinates(leg.from),
        ...leg.stops.map(getCoordinates),
        getCoordinates(leg.to),
      ]),

      getCoordinates(journey.to),
    ],
    [journey],
  );

  // Automatically adjust the map when its size changes
  useEffect(() => {
    const container = map.getContainer();

    const updateMapView = () => {
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        return;
      }

      map.invalidateSize({
        pan: false,
      });

      if (coordinates.length > 0) {
        map.fitBounds(coordinates, {
          padding: [24, 24],
          maxZoom: 15,
          animate: false,
        });
      }
    };

    // Fit the journey when the map first loads
    updateMapView();

    // Observe map container size changes
    const observer = new ResizeObserver(() => {
      updateMapView();
    });

    observer.observe(container);

    // Clean up observer
    return () => {
      observer.disconnect();
    };
  }, [coordinates, map]);

  // Restore the complete journey view
  const handleResetView = () => {
    map.invalidateSize({
      pan: false,
    });

    map.fitBounds(coordinates, {
      padding: [24, 24],
      maxZoom: 15,
      animate: true,
    });
  };

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control">
        <button
          type="button"
          onClick={handleResetView}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-md hover:bg-gray-100 sm:text-sm"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}

export default function JourneyMap({ journey }: JourneyMapProps) {
  const center = getCoordinates(journey.from);

  // Identify mock journeys
  const isDemo = journey.id.startsWith("demo-");

  // Get unique subway lines
  const routeIds = [...new Set(journey.legs.map((leg) => leg.routeId))];

  // Identify the first and last subway lines
  const firstLeg = journey.legs[0];

  const lastLeg = journey.legs[journey.legs.length - 1];

  // Identify transfer stations
  const transferIds = new Set(journey.legs.slice(1).map((leg) => leg.from.id));

  // Identify special stations
  const specialStationIds = new Set([
    journey.from.id,
    journey.to.id,
    ...transferIds,
  ]);

  return (
    <section className="mt-6 min-w-0">
      {/* Map Title */}
      <h3 className="text-base font-semibold sm:text-lg">Journey Map</h3>

      <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
        Schematic connections between journey stations. Select a station to view
        details.
      </p>

      {/* Responsive Map Container */}
      <div className="relative isolate mt-4 overflow-hidden rounded-xl border border-gray-200">
        <MapContainer
          center={center}
          zoom={12}
          zoomSnap={0.25}
          scrollWheelZoom={false}
          className="h-[320px] w-full sm:h-[380px] lg:h-[450px]"
        >
          {/* OpenStreetMap Base Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Automatic Bounds and Reset Controls */}
          <JourneyMapControls journey={journey} />

          {/* Draw Subway Routes */}
          {journey.legs.map((leg, index) => {
            const positions: LatLngTuple[] = [
              getCoordinates(leg.from),

              ...leg.stops
                .filter(
                  (station) =>
                    station.id !== leg.from.id && station.id !== leg.to.id,
                )
                .map(getCoordinates),

              getCoordinates(leg.to),
            ];

            return (
              <Polyline
                key={`${journey.id}-leg-${index}`}
                positions={positions}
                pathOptions={{
                  color: getRouteColor(leg.routeId),
                  weight: 6,
                  opacity: 0.85,
                }}
              />
            );
          })}

          {/* Intermediate Station Markers */}
          {journey.legs.map((leg, legIndex) =>
            leg.stops
              .filter((station) => !specialStationIds.has(station.id))
              .map((station, stopIndex) => (
                <CircleMarker
                  key={`${journey.id}-${legIndex}-${station.id}-${stopIndex}`}
                  center={getCoordinates(station)}
                  radius={5}
                  pathOptions={{
                    color: getRouteColor(leg.routeId),
                    fillColor: "#FFFFFF",
                    fillOpacity: 1,
                    weight: 3,
                  }}
                >
                  <Tooltip direction="top">{station.name}</Tooltip>

                  <JourneyStationPopup
                    station={station}
                    title="Intermediate Stop"
                    routeIds={[leg.routeId]}
                    description={`Continue on the ${leg.routeId} train.`}
                    isDemo={isDemo}
                  />
                </CircleMarker>
              )),
          )}

          {/* Transfer Station Markers */}
          {journey.legs.slice(1).map((leg, index) => {
            const previousLeg = journey.legs[index];

            return (
              <CircleMarker
                key={`${journey.id}-transfer-${leg.from.id}-${index}`}
                center={getCoordinates(leg.from)}
                radius={8}
                pathOptions={{
                  color: "#111827",
                  fillColor: "#FFFFFF",
                  fillOpacity: 1,
                  weight: 3,
                }}
              >
                <Tooltip direction="top">Transfer: {leg.from.name}</Tooltip>

                <JourneyStationPopup
                  station={leg.from}
                  title="Transfer Station"
                  routeIds={[previousLeg.routeId, leg.routeId]}
                  description={`Transfer from the ${previousLeg.routeId} train to the ${leg.routeId} train.`}
                  isDemo={isDemo}
                />
              </CircleMarker>
            );
          })}

          {/* Starting Station Marker */}
          <CircleMarker
            key={`${journey.id}-start`}
            center={getCoordinates(journey.from)}
            radius={9}
            pathOptions={{
              color: "#15803D",
              fillColor: "#22C55E",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip direction="top">Start: {journey.from.name}</Tooltip>

            <JourneyStationPopup
              station={journey.from}
              title="Starting Station"
              routeIds={firstLeg ? [firstLeg.routeId] : []}
              description={
                firstLeg
                  ? `Board the ${firstLeg.routeId} train here.`
                  : "Start your journey here."
              }
              isDemo={isDemo}
            />
          </CircleMarker>

          {/* Destination Station Marker */}
          <CircleMarker
            key={`${journey.id}-destination`}
            center={getCoordinates(journey.to)}
            radius={9}
            pathOptions={{
              color: "#B91C1C",
              fillColor: "#EF4444",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip direction="top">Destination: {journey.to.name}</Tooltip>

            <JourneyStationPopup
              station={journey.to}
              title="Destination Station"
              routeIds={lastLeg ? [lastLeg.routeId] : []}
              description="Arrive at your destination."
              isDemo={isDemo}
            />
          </CircleMarker>
        </MapContainer>
      </div>

      {/* Station Legend */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 text-xs sm:flex sm:flex-wrap sm:gap-4 sm:text-sm">
        {/* Starting Station */}
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full bg-green-500" />

          <span>Starting Station</span>
        </div>

        {/* Destination Station */}
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full bg-red-500" />

          <span>Destination Station</span>
        </div>

        {/* Transfer Station */}
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full border-2 border-gray-900 bg-white" />

          <span>Transfer Station</span>
        </div>

        {/* Intermediate Stop */}
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full border-2 border-gray-500 bg-white" />

          <span>Intermediate Stop</span>
        </div>
      </div>

      {/* Dynamic Subway Line Legend */}
      <div className="mt-4 rounded-lg bg-slate-100 p-3">
        <p className="text-xs font-medium text-gray-600 sm:text-sm">
          Subway Lines in This Journey
        </p>

        <div className="mt-3 flex flex-wrap gap-3 sm:gap-4">
          {routeIds.map((routeId) => (
            <div key={routeId} className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm"
                style={{
                  backgroundColor: getRouteColor(routeId),
                  color: getRouteTextColor(routeId),
                }}
              >
                {routeId}
              </span>

              <span className="text-xs font-medium sm:text-sm">
                {routeId} Train
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
