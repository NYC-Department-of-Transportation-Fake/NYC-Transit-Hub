export type ListResponse<T> = { data: T[]; total: number };
export type Station = {
  id: string; name: string; latitude: number; longitude: number;
  routeIds: string[]; stopIds: string[];
};
export type TransitRoute = {
  id: string; shortName: string; longName: string; color: string; textColor: string;
};
export type Stop = { id: string; stationId: string; directionLabel: string | null };
export type StationDetail = Omit<Station, 'stopIds'> & { stops: Stop[] };
export type Arrival = {
  tripId: string; startDate: string | null; routeId: string; stopId: string;
  stopSequence: number | null; directionLabel: string | null; destination: string | null;
  arrivalTime: string | null; departureTime: string | null;
};
export type FeedStatus = {
  feedId: string; sourceUpdatedAt: string; fetchedAt: string;
  cached: boolean; stale: boolean; refreshFailed: boolean;
};
export type ArrivalResponse = {
  data: Arrival[];
  meta: { stationId: string; servedAt: string; feeds: FeedStatus[] };
};
