import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAlerts, fetchFacilities } from '../services/mta';

const formatTime = (time: number) => new Date(time).toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' });

export default function ServiceStatusPage() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const alertsQuery = useQuery({ queryKey: ['mta', 'alerts'], queryFn: ({ signal }) => fetchAlerts(signal), refetchInterval: 60000, staleTime: 30000 });
  const facilitiesQuery = useQuery({ queryKey: ['mta', 'facilities'], queryFn: ({ signal }) => fetchFacilities(signal), refetchInterval: 60000, staleTime: 30000 });
  const allAlerts = alertsQuery.data?.alerts ?? [];
  const allFacilities = facilitiesQuery.data?.facilities ?? [];
  const routes = [...new Set([...allAlerts.flatMap(item => item.routes), ...allFacilities.flatMap(item => item.routes)])].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const [alertLimit, setAlertLimit] = useState(10);
  const [facilityLimit, setFacilityLimit] = useState(20);
  const [route, setRoute] = useState('');
  const [search, setSearch] = useState('');
  const [outagesOnly, setOutagesOnly] = useState(false);
  const alerts = allAlerts.filter(alert => !route || alert.routes.includes(route));
  const facilities = allFacilities.filter(facility =>
    (!route || facility.routes.includes(route)) &&
    facility.stationName.toLowerCase().includes(search.trim().toLowerCase()) &&
    (!outagesOnly || facility.status === 'Out of service'),
  );

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-nyu">Service & accessibility</p>
        <h2 className="mt-2 text-3xl font-bold">Check before you travel</h2>
        <p className="mt-2 text-slate-600">Explore service notices and individual elevator and escalator conditions.</p>
      </div>

      <div role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <p><strong>Official MTA feeds.</strong> Information may be delayed. Refreshes every minute while this page is open.</p>
        <p className="mt-2 text-sm">Facility conditions do not confirm an accessible journey. Check every connection needed for your trip.</p>
        <a className="mt-2 inline-block underline" href="https://www.mta.info" target="_blank" rel="noreferrer">Check MTA travel information</a>
      </div>
      <button type="button" disabled={alertsQuery.isFetching || facilitiesQuery.isFetching} onClick={() => { void alertsQuery.refetch(); void facilitiesQuery.refetch(); }} className="rounded-lg bg-nyu px-4 py-2 font-semibold text-white disabled:opacity-50">
        {alertsQuery.isFetching || facilitiesQuery.isFetching ? 'Refreshing…' : 'Refresh data'}
      </button>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label htmlFor="service-route" className="block font-semibold">Filter by subway line</label>
        <select id="service-route" value={route} onChange={event => { setRoute(event.target.value); setAlertLimit(10); setFacilityLimit(20); }} className="mt-2 w-full rounded-lg border border-slate-400 bg-white p-3 sm:w-64">
          <option value="">All lines</option>
          {routes.map(line => <option key={line} value={line}>{line} train</option>)}
        </select>
      </div>

      <section aria-labelledby="notices-heading" className="space-y-3">
        <h3 id="notices-heading" className="text-xl font-bold">Service notices <span className="text-base font-normal text-slate-600">({alerts.length})</span></h3>
        {alertsQuery.data && alerts.length === 0 && <p className="rounded-xl bg-white p-5">No current or upcoming notices match this line in the retrieved feed. This does not confirm normal service.</p>}
        {alertsQuery.isPending && <p role="status">Loading MTA service notices…</p>}
        {alertsQuery.isError && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-900">Could not refresh service notices. {alertsQuery.data ? 'Showing previously fetched data; it may be outdated.' : 'Service status is unavailable.'}</p>}
        {alertsQuery.data && <p className="text-sm text-slate-600">MTA feed timestamp: {formatTime(alertsQuery.data.sourceUpdatedAt)} · Retrieved: {formatTime(alertsQuery.data.fetchedAt)}</p>}
        {alertsQuery.data && now - alertsQuery.data.sourceUpdatedAt > 5 * 60000 && <p role="status" className="text-amber-900">MTA alert feed is over five minutes old. Treat these notices as potentially outdated.</p>}
        {alerts.slice(0, alertLimit).map(alert => (
          <details key={alert.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer">
              <span className="font-semibold text-nyu">{alert.routes.join(' · ') || 'System notice'} · {alert.status}{alert.upcoming ? ' · Upcoming' : ''}</span>
              <span className="mt-2 block text-lg font-semibold">{alert.title}</span>
              <span className="mt-1 block text-sm text-slate-600">Expand for details and travel advice</span>
            </summary>
            <p className="mt-4 whitespace-pre-line text-slate-700">{alert.description || 'No further details provided by MTA.'}</p>
            {alert.period && <p className="mt-2 text-sm">{alert.period}</p>}
            {alert.advice && <p className="mt-2"><strong>Travel advice:</strong> {alert.advice}</p>}
          </details>
        ))}
        {alerts.length > alertLimit && <button type="button" onClick={() => setAlertLimit(limit => limit + 10)} className="rounded-lg border border-slate-400 bg-white px-4 py-2">Show more notices ({alerts.length - alertLimit} remaining)</button>}
      </section>

      <section aria-labelledby="facilities-heading" className="space-y-4">
        <h3 id="facilities-heading" className="text-xl font-bold">Elevators & escalators</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="facility-search" className="block font-semibold">Search a station</label>
            <input id="facility-search" type="search" value={search} onChange={event => { setSearch(event.target.value); setFacilityLimit(20); }} placeholder="e.g. Fulton" className="mt-2 w-full rounded-lg border border-slate-400 bg-white p-3" />
          </div>
          <label className="flex min-h-12 items-center gap-2"><input type="checkbox" checked={outagesOnly} onChange={event => { setOutagesOnly(event.target.checked); setFacilityLimit(20); }} className="h-4 w-4" /> Out of service only</label>
        </div>
        <p role="status" className="text-sm text-slate-600">{facilities.length} facilities match your filters. Times supplied by MTA are shown in New York local time.</p>
        {facilitiesQuery.isPending && <p role="status">Loading MTA facilities…</p>}
        {facilitiesQuery.isError && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-900">Could not refresh facilities. {facilitiesQuery.data ? 'Showing previously fetched data; conditions may have changed.' : 'Facility conditions are unavailable.'}</p>}
        {facilitiesQuery.data && <p className="text-sm text-slate-600">Retrieved: {formatTime(facilitiesQuery.data.fetchedAt)}. MTA does not supply a feed timestamp for these facility records.</p>}
        {facilitiesQuery.data && now - facilitiesQuery.data.fetchedAt > 5 * 60000 && <p role="status" className="text-amber-900">Facility data was retrieved over five minutes ago and may be outdated.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {facilities.slice(0, facilityLimit).map(facility => (
            <article key={facility.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className={`text-sm font-bold ${facility.status === 'Out of service' ? 'text-red-800' : 'text-slate-700'}`}>{facility.status}</p>
              <h4 className="mt-2 text-lg font-bold">{facility.stationName}</h4>
              <p className="mt-1 text-sm text-nyu">{facility.routes.join(' · ')}</p>
              <p className="mt-3 font-medium">{facility.type} · {facility.location}</p>
              <p className="mt-2 text-sm text-slate-600">{facility.note}</p>
              <p className="mt-2 text-sm">Equipment: {facility.id} · Part of ADA pathway: {facility.ada}</p>
              {facility.outageStart && <p className="mt-2 text-sm">Outage starts: {facility.outageStart}</p>}
              {facility.estimatedReturn && <p className="mt-2 text-sm">Estimated return: {facility.estimatedReturn} (subject to change)</p>}
              {facility.status === 'Out of service' && facility.alternative && <details className="mt-3"><summary className="cursor-pointer font-semibold text-nyu">MTA travel alternatives</summary><p className="mt-2 whitespace-pre-line text-sm">{facility.alternative}</p></details>}
            </article>
          ))}
        </div>
        {facilities.length > facilityLimit && <button type="button" onClick={() => setFacilityLimit(limit => limit + 20)} className="rounded-lg border border-slate-400 bg-white px-4 py-2">Show more facilities ({facilities.length - facilityLimit} remaining)</button>}
        {facilitiesQuery.data && facilities.length === 0 && <p className="rounded-xl bg-white p-5">No facilities match. Try another station or clear your filters.</p>}
      </section>
    </section>
  );
}
