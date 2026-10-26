import type { Arrival, FeedStatus } from '../types/transit';

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
  });
}

export function arrivalLabel(arrival: Arrival, nowMs: number): string {
  const time = arrival.arrivalTime ?? arrival.departureTime;
  if (!time) return 'Time unavailable';
  const remaining = Date.parse(time) - nowMs;
  if (!Number.isFinite(remaining)) return 'Time unavailable';
  if (remaining < 0) return 'Passed';
  if (remaining < 60000) return 'Due';
  return `${Math.ceil(remaining / 60000)} min`;
}

export function isFeedStale(feed: FeedStatus, nowMs: number): boolean {
  const source = Date.parse(feed.sourceUpdatedAt), fetched = Date.parse(feed.fetchedAt);
  return feed.stale || feed.refreshFailed || !Number.isFinite(source) || !Number.isFinite(fetched)
    || nowMs - source > 5 * 60000 || nowMs - fetched >= 10 * 60000;
}

export function isFeedExpired(feed: FeedStatus, nowMs: number): boolean {
  return [feed.sourceUpdatedAt, feed.fetchedAt].some(time =>
    !Number.isFinite(Date.parse(time)) || nowMs - Date.parse(time) >= 10 * 60000);
}
