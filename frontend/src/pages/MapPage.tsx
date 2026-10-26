import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { fetchRoutes, fetchStations } from "../services/transit";
import "leaflet/dist/leaflet.css";

export default function MapPage() {
  const [routeId, setRouteId] = useState('');
  const stations = useQuery({ queryKey: ['transit', 'stations', '', routeId],
    queryFn: ({ signal }) => fetchStations('', routeId, signal), staleTime: 300000, retry: 1 });
  const routes = useQuery({ queryKey: ['transit', 'routes'],
    queryFn: ({ signal }) => fetchRoutes(signal), staleTime: 300000, retry: 1 });
  return (
    <section>
      <h2 className="text-2xl font-bold">Subway Map</h2>

      <p className="mt-2 text-slate-600">Select a station marker to view upcoming trains, or <Link to="/stations" className="text-nyu underline">search the station list</Link>.</p>
      <label htmlFor="map-route" className="mt-4 block font-semibold">Filter by line
        <select id="map-route" value={routeId} onChange={event => setRouteId(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-400 bg-white p-3 sm:w-72">
          <option value="">All lines</option>
          {routes.data?.data.map(route => <option key={route.id} value={route.id}>{route.id} · {route.longName}</option>)}
        </select>
      </label>
      {routes.isError && <p role="alert" className="mt-3 text-red-800">Line filters unavailable. <button className="underline" onClick={() => void routes.refetch()}>Retry lines</button></p>}
      {stations.isPending && <p role="status" className="mt-3">Loading stations…</p>}
      {stations.isError && <p role="alert" className="mt-3 text-red-800">Unable to load stations. <button className="underline" onClick={() => void stations.refetch()}>Try again</button></p>}
      {stations.data && <p className="mt-3 text-sm text-slate-600">{stations.data.total} station records. Line coverage follows the regular schedule, not current service conditions.</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <MapContainer
          center={[40.73, -73.99]}
          zoom={12}
          style={{ height: "min(65vh, 550px)", minHeight: "320px", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {stations.data?.data.map(station => <CircleMarker key={station.id} center={[station.latitude, station.longitude]}
            radius={5} pathOptions={{ color: '#57068c', fillOpacity: 0.8, weight: 2 }}>
            <Popup><strong>{station.name}</strong><p>{station.routeIds.join(' · ')} · Station {station.id}</p>
              <Link to={`/stations/${encodeURIComponent(station.id)}`}>View arrivals</Link></Popup>
          </CircleMarker>)}
        </MapContainer>
      </div>
    </section>
  );
}
