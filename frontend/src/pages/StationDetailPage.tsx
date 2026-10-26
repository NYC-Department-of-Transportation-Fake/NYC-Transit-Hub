import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router';
import { fetchArrivals, fetchStation } from '../services/transit';
import { arrivalLabel, formatTime, isFeedStale, isFeedExpired } from '../services/transitPresentation';
import type { StationDetail } from '../types/transit';

function Arrivals({ station }: { station: StationDetail }) {
  const [routeId, setRouteId] = useState(''), [stopId, setStopId] = useState('');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const result = useQuery({ queryKey: ['transit', 'arrivals', station.id, routeId, stopId],
    queryFn: ({ signal }) => fetchArrivals(station.id, { routeId, stopId, limit: 20 }, signal),
    refetchInterval: 30000, staleTime: 15000, retry: 1 });
  const expired = result.data?.meta.feeds.some(feed => isFeedExpired(feed, now));
  const arrivals = expired ? [] : result.data?.data.filter(arrival => {
    const time = arrival.arrivalTime ?? arrival.departureTime;
    return time && Date.parse(time) >= now;
  }) ?? [];
  const stale = result.data?.meta.feeds.some(feed => isFeedStale(feed, now));

  return <section className="space-y-4" aria-labelledby="arrivals-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 id="arrivals-title" className="text-2xl font-bold">Upcoming trains</h3>
      <button onClick={() => void result.refetch()} disabled={result.isFetching}
        className="rounded-lg bg-nyu px-4 py-2 font-semibold text-white disabled:opacity-50">{result.isFetching ? 'Refreshing…' : 'Refresh arrivals'}</button>
    </div>
    <p className="text-sm text-slate-600">Refreshes every 30 seconds while this page is open. Times are estimates, shown in New York time.</p>
    <div className="grid gap-4 rounded-xl bg-white p-5 sm:grid-cols-2">
      <label className="font-semibold" htmlFor="arrival-route">Line
        <select id="arrival-route" value={routeId} onChange={event => setRouteId(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-400 bg-white p-3 font-normal">
          <option value="">All lines at this station</option>
          {station.routeIds.map(id => <option key={id} value={id}>{id} train</option>)}
        </select>
      </label>
      <label className="font-semibold" htmlFor="arrival-stop">Boarding stop
        <select id="arrival-stop" value={stopId} onChange={event => setStopId(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-400 bg-white p-3 font-normal">
          <option value="">All boarding stops</option>
          {station.stops.map(stop => <option key={stop.id} value={stop.id}>{stop.directionLabel ? `${stop.directionLabel} · ${stop.id}` : `Boarding stop ${stop.id}`}</option>)}
        </select>
      </label>
    </div>
    {result.isPending && <p role="status">Loading arrival predictions…</p>}
    {result.isError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">Could not refresh arrivals. {result.data ? 'Previously received predictions are shown and may be outdated.' : 'Arrival information is unavailable. Please try refreshing.'}</p>}
    {stale && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">Some arrival data is outdated or could not be refreshed. Check station displays before travelling.</p>}
    {result.data && <>
      <p className="text-sm text-slate-600">Last response: {formatTime(result.data.meta.servedAt)}</p>
      {expired ? <p role="status" className="rounded-xl bg-amber-50 p-5 text-amber-950">These predictions are too old to display. Refresh to get updated arrivals.</p>
        : arrivals.length === 0 && <p className="rounded-xl bg-white p-5">No upcoming predictions match these filters in the retrieved data. This does not confirm normal service or that trains have stopped running.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {arrivals.map((arrival, index) => <article key={`${arrival.tripId}-${arrival.startDate}-${arrival.stopId}-${arrival.stopSequence}-${index}`}
          className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div><p className="text-xl font-bold text-nyu">{arrival.routeId} train</p>
            <p className="mt-1 text-sm">{arrival.directionLabel ?? `Boarding stop ${arrival.stopId}`}</p>
            {arrival.destination && <p className="mt-1 text-sm text-slate-600">To {arrival.destination}</p>}
            <p className="mt-2 text-sm text-slate-600">{arrival.arrivalTime ? 'Arrives' : 'Departs'} {formatTime((arrival.arrivalTime ?? arrival.departureTime)!)}</p>
          </div>
          <div className="shrink-0 text-right"><p className="text-2xl font-bold">{arrivalLabel(arrival, now)}</p>
            <p className="text-xs text-slate-500">{arrival.arrivalTime ? 'Estimated arrival' : 'Estimated departure'}</p></div>
        </article>)}
      </div>
      <details className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold">Data freshness and cache status</summary>
        {result.data.meta.feeds.map(feed => <div key={feed.feedId} className="mt-3 space-y-1">
          <p className="font-medium">{feed.feedId} · {feed.cached ? 'Cached response' : 'Newly fetched response'}{isFeedStale(feed, now) ? ' · Outdated' : ''}{feed.refreshFailed ? ' · Refresh failed; using older data' : ''}</p>
          <p>MTA updated: {formatTime(feed.sourceUpdatedAt)} · Retrieved: {formatTime(feed.fetchedAt)}</p>
        </div>)}
      </details>
    </>}
  </section>;
}

export default function StationDetailPage() {
  const { stationId = '' } = useParams();
  const [params] = useSearchParams();
  const station = useQuery({ queryKey: ['transit', 'station', stationId],
    queryFn: ({ signal }) => fetchStation(stationId, signal), enabled: !!stationId, staleTime: 300000, retry: 1 });
  return <section className="space-y-6">
    <Link to={`/stations?${params}`} className="inline-block text-nyu underline">← Back to stations</Link>
    {station.isPending && <p role="status">Loading station…</p>}
    {station.isError && <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-900">Unable to load station. {station.error.message} <button className="underline" onClick={() => void station.refetch()}>Try again</button></p>}
    {station.data && <>
      <div><p className="text-sm text-slate-500">Station {station.data.id}</p>
        <h2 className="mt-1 text-3xl font-bold">{station.data.name}</h2>
        <p className="mt-3 font-semibold text-nyu">{station.data.routeIds.join(' · ')}</p></div>
      <Arrivals key={stationId} station={station.data} />
    </>}
  </section>;
}
