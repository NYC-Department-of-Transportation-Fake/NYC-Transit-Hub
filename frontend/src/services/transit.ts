import type {
  ArrivalResponse,
  ListResponse,
  Station,
  StationDetail,
  TransitRoute,
} from "../types/transit";

import { get } from "./apiClient";

// Fetch subway stations
export function fetchStations(
  query = "",
  routeId = "",
  signal?: AbortSignal,
): Promise<ListResponse<Station>> {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set("query", query.trim());
  }

  if (routeId) {
    params.set("routeId", routeId);
  }

  return get(`/stations?${params}`, signal);
}

// Fetch subway routes
export function fetchRoutes(
  signal?: AbortSignal,
): Promise<ListResponse<TransitRoute>> {
  return get("/routes", signal);
}

// Fetch station details
export async function fetchStation(
  id: string,
  signal?: AbortSignal,
): Promise<StationDetail> {
  const response = await get<{
    data: StationDetail;
  }>(`/stations/${encodeURIComponent(id)}`, signal);

  return response.data;
}

// Fetch live arrival predictions
export function fetchArrivals(
  id: string,
  filters: {
    routeId?: string;
    stopId?: string;
    limit?: number;
  } = {},
  signal?: AbortSignal,
): Promise<ArrivalResponse> {
  const params = new URLSearchParams();

  if (filters.routeId) {
    params.set("routeId", filters.routeId);
  }

  if (filters.stopId) {
    params.set("stopId", filters.stopId);
  }

  if (filters.limit !== undefined) {
    params.set("limit", String(filters.limit));
  }

  return get(`/stations/${encodeURIComponent(id)}/arrivals?${params}`, signal);
}
