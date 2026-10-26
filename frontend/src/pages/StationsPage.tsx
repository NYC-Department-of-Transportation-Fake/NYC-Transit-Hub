import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { fetchRoutes, fetchStations } from '../services/transit';

export default function StationsPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('query') ?? '', routeId = params.get('routeId') ?? '';
  const stations = useQuery({ queryKey: ['transit', 'stations', query, routeId],
    queryFn: ({ signal }) => fetchStations(query, routeId, signal), staleTime: 300000, retry: 1 });
  const routes = useQuery({ queryKey: ['transit', 'routes'],
    queryFn: ({ signal }) => fetchRoutes(signal), staleTime: 300000, retry: 1 });

  return <section className="space-y-6">
    <div><h2 className="text-3xl font-bold">Find a station</h2>
      <p className="mt-2 text-slate-600">Search by name, choose a line, then check upcoming trains.</p></div>
    <form key={params.toString()} onSubmit={event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const next = new URLSearchParams();
      const name = String(form.get('query') ?? '').trim(), line = String(form.get('routeId') ?? '');
      if (name) next.set('query', name);
      if (line) next.set('routeId', line);
      setParams(next);
    }} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-end">
      <label className="flex-1 font-semibold" htmlFor="station-search">Station name
        <input id="station-search" name="query" type="search" defaultValue={query} placeholder="e.g. Times Sq"
          className="mt-2 block w-full rounded-lg border border-slate-400 p-3 font-normal" />
      </label>
      <label className="font-semibold" htmlFor="station-line">Subway line
        <select id="station-line" name="routeId" defaultValue={routeId}
          className="mt-2 block w-full rounded-lg border border-slate-400 bg-white p-3 font-normal sm:w-64">
          <option value="">All lines</option>
          {routeId && !routes.data?.data.some(route => route.id === routeId) && <option value={routeId}>{routeId}</option>}
          {routes.data?.data.map(route => <option key={route.id} value={route.id}>{route.id} · {route.longName}</option>)}
        </select>
      </label>
      <button className="rounded-lg bg-nyu px-5 py-3 font-semibold text-white" type="submit">Search</button>
      <Link to="/stations" className="px-2 py-3 text-nyu underline">Clear</Link>
    </form>
    {routes.isError && <p role="alert" className="text-red-800">Line filters could not load. <button className="underline" onClick={() => void routes.refetch()}>Retry lines</button></p>}
    {stations.isPending && <p role="status">Loading stations…</p>}
    {stations.isError && <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-900">
      Unable to load stations. {stations.error.message} <button className="underline" onClick={() => void stations.refetch()}>Try again</button>
    </div>}
    {stations.data && <>
      <p role="status" className="text-sm text-slate-600">{stations.data.total} matching station records. Same-name stations may serve different platforms or lines. Line coverage follows the regular schedule.</p>
      {stations.data.total === 0 && <p className="rounded-xl bg-white p-5">No stations match. Try another name or clear the line filter.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stations.data.data.map(station => <Link key={station.id} to={`/stations/${encodeURIComponent(station.id)}?${params}`}
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-nyu focus-visible:outline-2 focus-visible:outline-nyu">
          <h3 className="text-lg font-bold">{station.name}</h3>
          <p className="mt-2 font-semibold text-nyu">{station.routeIds.join(' · ') || 'No scheduled lines listed'}</p>
          <p className="mt-2 text-sm text-slate-500">Station {station.id}</p>
          <span className="mt-4 inline-block text-sm font-semibold text-nyu">View arrivals →</span>
        </Link>)}
      </div>
    </>}
  </section>;
}
