import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchStations, fetchStation, fetchArrivals } from '../src/services/transit.ts';
import { arrivalLabel, formatTime, isFeedExpired, isFeedStale } from '../src/services/transitPresentation.ts';
import type { Arrival, FeedStatus } from '../src/types/transit.ts';

test('search and arrival requests encode parameters and preserve source IDs', async t => {
  const urls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    urls.push(url);
    return new Response(JSON.stringify({ data: [], total: 0 }));
  });
  await fetchStations('  Times & Square  ', '6X');
  await fetchArrivals('id/with space', { routeId: '6X', stopId: '127N', limit: 5 });
  assert.equal(urls[0], '/api/stations?query=Times+%26+Square&routeId=6X');
  assert.equal(urls[1], '/api/stations/id%2Fwith%20space/arrivals?routeId=6X&stopId=127N&limit=5');
});

test('details unwrap data and server failures are not treated as empty results', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ data: { id: '127' } })));
  assert.equal((await fetchStation('127')).id, '127');
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ message: 'Arrival data unavailable' }), { status: 503 }));
  await assert.rejects(fetchArrivals('127'), /Arrival data unavailable/);
  t.mock.method(globalThis, 'fetch', async () => new Response('Proxy unavailable', { status: 502 }));
  await assert.rejects(fetchStations(), /Request failed \(502\)/);
});

test('caller cancellation is passed to the request', async t => {
  const controller = new AbortController();
  controller.abort();
  t.mock.method(globalThis, 'fetch', async (_url: string, options: RequestInit) => {
    assert.equal(options.signal?.aborted, true);
    return new Response(JSON.stringify({ data: [], total: 0 }));
  });
  await fetchStations('', '', controller.signal);
});

const now = Date.parse('2026-10-26T12:00:00Z');
const arrival: Arrival = { tripId: 'trip', startDate: null, routeId: '1', stopId: '127N', stopSequence: null,
  directionLabel: null, destination: null, arrivalTime: '2026-10-26T12:01:01Z', departureTime: null };
const feed: FeedStatus = { feedId: 'gtfs', sourceUpdatedAt: '2026-10-26T12:00:00Z',
  fetchedAt: '2026-10-26T12:00:00Z', cached: true, stale: false, refreshFailed: false };

test('arrival countdown handles departure-only, passed and unknown times', () => {
  assert.equal(arrivalLabel(arrival, now), '2 min');
  assert.equal(arrivalLabel(arrival, now + 2000), 'Due');
  assert.equal(arrivalLabel(arrival, now + 62000), 'Passed');
  assert.equal(arrivalLabel({ ...arrival, arrivalTime: null, departureTime: arrival.arrivalTime }, now), '2 min');
  assert.equal(arrivalLabel({ ...arrival, arrivalTime: null }, now), 'Time unavailable');
  assert.match(formatTime('2026-10-26T12:00:00Z'), /8:00:00 AM/);
});

test('freshness ages locally and failure flags remain visible even for recent data', () => {
  assert.equal(isFeedStale(feed, now), false);
  assert.equal(isFeedStale(feed, now + 300001), true);
  assert.equal(isFeedStale({ ...feed, refreshFailed: true }, now), true);
  assert.equal(isFeedExpired(feed, now + 599999), false);
  assert.equal(isFeedExpired(feed, now + 600000), true);
  assert.equal(isFeedExpired({ ...feed, sourceUpdatedAt: 'invalid' }, now), true);
});
