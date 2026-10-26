import type { ArrivalResponse, ListResponse, Station, StationDetail, TransitRoute } from '../types/transit';

// Same-origin /api is proxied to Spring Boot by Vite; production needs an equivalent proxy.
async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api${path}`, {
    signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(45000)]),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function fetchStations(query = '', routeId = '', signal?: AbortSignal): Promise<ListResponse<Station>> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('query', query.trim());
  if (routeId) params.set('routeId', routeId);
  return get(`/stations?${params}`, signal);
}

export function fetchRoutes(signal?: AbortSignal): Promise<ListResponse<TransitRoute>> {
  return get('/routes', signal);
}

export async function fetchStation(id: string, signal?: AbortSignal): Promise<StationDetail> {
  return (await get<{ data: StationDetail }>(`/stations/${encodeURIComponent(id)}`, signal)).data;
}

export function fetchArrivals(id: string, filters: { routeId?: string; stopId?: string; limit?: number } = {},
  signal?: AbortSignal): Promise<ArrivalResponse> {
  const params = new URLSearchParams();
  if (filters.routeId) params.set('routeId', filters.routeId);
  if (filters.stopId) params.set('stopId', filters.stopId);
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  return get(`/stations/${encodeURIComponent(id)}/arrivals?${params}`, signal);
}
