# NYC Transit Hub backend

Minimal Spring Boot backend targeting Java 21. Use JDK 21 or newer.

## Run and test

From `backend/` on Windows:

```powershell
.\mvnw.cmd spring-boot:run
.\mvnw.cmd test
```

On macOS/Linux, use `./mvnw` instead. Maven Wrapper downloads Maven and dependencies on the first run.

## Health check

`GET http://localhost:8080/api/health`

```json
{"status":"UP","serverTime":"2026-10-26T14:00:00Z"}
```

This checks the application only; it does not check MTA connectivity or data readiness.

MVC errors use a shared response, for example an unknown endpoint:

```json
{"code":"NOT_FOUND","message":"Not Found","timestamp":"2026-10-26T14:00:00Z","path":"/api/missing"}
```

Unexpected exceptions return HTTP 500 with a generic message; details are logged on the server.

The default allowed frontend origins are `http://localhost:5173` and `http://127.0.0.1:5173`.
Configure `app.cors.allowed-origins` in `application.properties` or set `APP_CORS_ALLOWED_ORIGINS` to a comma-separated list. Only GET access is enabled for `/api/**`.

## Static models

- `Station`: searchable station, coordinates, route IDs and stop IDs.
- `Stop`: specific boarding stop, owning station ID and optional direction label.
- `Route`: line ID, names and display colors.
- `Trip`: trip ID, route ID, optional headsign and direction ID.

These are plain immutable Java records, not database entities. Station IDs are GTFS parent-station IDs, and stop IDs are the source boarding-stop IDs. Same-named stations are not merged into transfer complexes. Unknown direction information stays null; no Uptown/Downtown label is guessed from an ID suffix. `Trip` is reserved for later integration and is not loaded by this increment.

## Static station and route APIs

| Method | Path | Parameters / behavior |
| --- | --- | --- |
| GET | `/api/stations` | Optional `query` (trimmed, case-insensitive station-name substring) and `routeId` (trimmed, exact source ID). Both filters are combined. |
| GET | `/api/stations/{stationId}` | Station details with the associated `stops`. |
| GET | `/api/routes` | All source routes, including distinct express/shuttle IDs. |
| GET | `/api/routes/{routeId}` | One route's names and colors. |
| GET | `/api/routes/{routeId}/stations` | Static service coverage, sorted by station name then ID; not train stop order or a trip itinerary. |

Lists return `{"data":[...],"total":496}` (total is the number of matches); details return `{"data":{...}}`. Station lists include `id`, `name`, `latitude`, `longitude`, `routeIds`, and `stopIds`. Station details replace `stopIds` with `stops`, each containing `id`, `stationId`, and nullable `directionLabel`.

No matches return HTTP 200 with an empty list. Unknown stations or routes (including a nonblank unknown route filter) return HTTP 404 with `STATION_NOT_FOUND` or `ROUTE_NOT_FOUND` in the shared error format. IDs are case-sensitive. Blank search/filter values mean no filter. Stations are sorted by name then ID; routes by short name then ID.

Examples after starting the backend:

```powershell
Invoke-RestMethod 'http://localhost:8080/api/stations?query=Times&routeId=1'
Invoke-RestMethod 'http://localhost:8080/api/stations/127'
Invoke-RestMethod 'http://localhost:8080/api/routes'
Invoke-RestMethod 'http://localhost:8080/api/routes/1/stations'
```

## Data source and refresh

The bundled `src/main/resources/data/transit.json` snapshot was prepared on October 26, 2026 from the [MTA regular subway GTFS](https://www.mta.info/developers). It contains 496 GTFS parent-station records, 992 boarding stops and 29 source routes. These counts are feed records, not a count of unique physical station complexes.

`data/transit-source.json` records the source URL, ZIP SHA-256, preparation time and MTA feed metadata. This snapshot's declared feed dates are May 26 through October 31, 2026. It is static scheduled service coverage across the feed, not confirmation that a route serves a station at the current time. It does not contain temporary service status or arrival predictions.

Preparation joins `stop_times.trip_id -> trips.route_id` and `stop_times.stop_id -> stops.parent_station` to derive each station's routes. The Python script uses the standard CSV parser, preserves source IDs, and deduplicates repeated route associations.

The Spring application loads and validates the complete JSON into immutable memory maps at startup. Missing/malformed files, duplicate IDs, invalid coordinates or broken references fail startup rather than exposing partial data. No database or network is needed to run the bundled snapshot.

To refresh it, run from `backend/` (Python 3 is needed only for this preparation step):

```powershell
$gtfsZip = Join-Path $env:TEMP 'nyc-transit-subway-refresh.zip'
Invoke-WebRequest 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip' -OutFile $gtfsZip
python scripts/prepare_transit_data.py $gtfsZip
.\mvnw.cmd test
```

Restart the backend after refreshing. To load another prepared snapshot, override `app.transit.data-location`, for example with `APP_TRANSIT_DATA_LOCATION=file:C:/data/transit.json`.

Tests run without internet once Maven dependencies are cached. HTTP behavior uses a small synthetic test fixture; the application startup tests also validate the bundled real snapshot. Test the preparation script with:

```powershell
python -m unittest discover -s scripts -p 'test_*.py'
```

## Real-time arrivals

`GET /api/stations/{stationId}/arrivals`

Optional query parameters:

- `routeId`: exact source route ID listed for the station; unknown routes return 404, a known route not listed at this station returns 400.
- `stopId`: exact boarding stop ID belonging to this station; another station's stop returns 400.
- `limit`: integer from 1 to 100, default 10.

Examples:

```powershell
Invoke-RestMethod 'http://localhost:8080/api/stations/127/arrivals'
Invoke-RestMethod 'http://localhost:8080/api/stations/127/arrivals?routeId=1&stopId=127N&limit=5'
```

The response contains `data` (arrival records) and `meta` (`stationId`, `servedAt`, and per-feed `feedId`, `sourceUpdatedAt`, `fetchedAt`, `cached`, `stale`, `refreshFailed`). Arrival records preserve source `tripId`, `startDate`, `routeId`, `stopId`, and optional `stopSequence`, with UTC ISO `arrivalTime` and `departureTime`. Missing values remain null. If only departure time is supplied, arrival time stays null and departure time is used for sorting and past-event filtering. Direction labels and destinations currently stay null; use stop IDs to distinguish boarding stops. No destination is guessed from a partial trip's final prediction, and realtime trip IDs are not assumed to match static trips.

`StationController -> ArrivalService -> MtaArrivalClient` is the complete flow. The client downloads and parses GTFS-realtime protobuf in one class using MobilityData's bindings. The service selects the configured feeds, matches exact stop IDs, filters, deduplicates by trip/date/route/stop/sequence, and sorts future events. Duplicate records from newer feed timestamps replace older ones. Canceled/deleted trips, skipped/no-data stops and delay-only records are excluded.

Feeds come from the [official MTA realtime directory](https://api.mta.info/). Route-to-feed groups are configured in `app.mta.feeds.*`, including separate express and shuttle IDs (Franklin Avenue shuttle `FS` uses the BDFM feed). Feeds are selected from the station's static route coverage; unexpected diversions from other feed groups are not guaranteed to appear. Without a route filter, any matching stop records in the selected feeds can appear, including diversions.

No network requests are made at application startup. Each arrival query obtains the required feeds sequentially from `MtaArrivalClient`, which caches each feed independently in memory. `app.mta.timeout=10s` applies to each upstream request. All required feeds must have usable data; if any has neither a successful refresh nor usable cached data, the API returns HTTP 503 with `TRANSIT_DATA_UNAVAILABLE`. A successful query with no upcoming matches returns HTTP 200 with an empty list. It does not establish that service has stopped or that service is normal.

## In-memory cache and failure fallback

Caching lives directly inside `MtaArrivalClient`; no external cache or scheduler is used. A `ConcurrentHashMap` holds one entry per feed. Each entry has its own lock, so concurrent requests for the same feed share a single refresh, while different feeds can refresh independently. Cache contents disappear on restart and are local to each running backend process.

| Property | Default | Behavior |
| --- | --- | --- |
| `app.mta.cache-ttl` | `30s` | Reuse successfully fetched data for 30 seconds, then refresh on demand. |
| `app.mta.retry-interval` | `10s` | After a failed refresh, wait 10 seconds before another attempt, even when no cache exists. |
| `app.mta.max-age` | `10m` | Reject data at or beyond ten minutes old, checking both MTA's timestamp and download time, including on cache hits and after a failed refresh. |
| `app.mta.stale-after` | `5m` | Mark source data older than five minutes as stale. This is an application warning threshold. |

On successful download, `cached=false` and `refreshFailed=false`. Ordinary cache hits set `cached=true`. If HTTP, timeout, parsing or freshness validation fails, usable old data is returned with `cached=true`, `refreshFailed=true`, and `stale=true`; its original timestamps are preserved. If no usable old data exists, return 503. Successful responses that are too old or have a source timestamp earlier than the cached version do not overwrite good cached data. A subsequent successful refresh clears the failure flag.

The frontend should show `stale` and `refreshFailed` warnings. `cached=true` alone does not mean stale data. Arrival filtering always runs using the current time, so cached predictions that have passed are removed; a countdown is never cached.

For local testing, `app.mta.base-url` can point to a test server. Automated client tests use a local HTTP server and generated protobuf samples; service/API tests substitute feed results and never require MTA availability.
