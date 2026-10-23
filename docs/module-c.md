# Module C: Service status and accessibility

Owner: Yu-Chen Chung

## Running

Use Node.js 22.22+ (Node 24 recommended).

```sh
cd frontend
npm ci
npm run dev
```

Open `/status`. The page reads official MTA feeds directly through `src/services/mta.ts`; no key is needed for the three endpoints tested. No backend or new dependencies are required. The endpoints returned HTTP 200 and `Access-Control-Allow-Origin: *` during verification on October 23, 2026. `src/data/serviceDemo.ts` is retained as a fictional reference and is not imported by the live page.

Official directory: https://api.mta.info/
Official guidance: https://www.mta.info/developers/display-elevators-NYCT

## Sources and mapping

Base: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/`

- `camsys%2Fsubway-alerts.json`: GTFS-RT JSON. Deduplicate `informed_entity[].route_id`; prefer plain English translations over HTML; read Mercury alert type and readable periods. Exclude fully expired notices, label future notices, and list active notices first. Header timestamp is the source update time.
- `nyct%2Fnyct_ene_equipments.json`: active equipment inventory; `equipmentno`, `elevatorsgtfsstopid`, `station`, `trainno`, `equipmenttype`, `serving`, `ADA`, `alternativeroute`.
- `nyct%2Fnyct_ene.json`: join `equipment` to inventory `equipmentno`; use `isupcomingoutage` to distinguish current (`N`) from future (`Y`) records. This feed contains both, despite its directory title. Current outage takes priority. Unknown flags stay unknown. A missing outage means “No reported outage,” not confirmed availability. MTA date strings are displayed verbatim as New York local times; no browser-dependent date parsing is used.

An equipment ADA flag does not establish full station or journey accessibility. Estimated restoration dates are not guarantees. Facilities absent from the inventory cannot be displayed; no completeness claim is made. Multiple future outages for one device currently display the first returned future record.

## Refresh and failure behavior

React Query refreshes each section independently every 60 seconds while the page is open, with a manual refresh button and a 20-second request timeout. Facilities require successful inventory and outage requests together. Failed requests never fall back to demo data; previously retrieved results are labeled outdated when a refresh fails. The alert source timestamp and retrieval times are shown in America/New_York. A five-minute warning is an application freshness threshold, not an MTA refresh guarantee. Facility feeds do not supply source timestamps, so a fresh download cannot establish source freshness.

Results initially show 10 notices and 20 facilities, with controls to show more. Route filtering covers both sections; station search and outage-only filtering apply to facilities.

## Validation

```sh
npm run build
npm run lint
node --experimental-strip-types --test tests/mta.test.ts
```

Parser tests cover expired/current/future alerts, English text selection, equipment joins, upcoming/current/unknown conditions, and malformed payloads. Real downloaded payloads were also parsed during implementation.

## Backend handoff to A

The project currently has no Spring Boot backend. Keep the direct-fetch adapter until the shared backend exists; then move ingestion/cache to that backend and replace only the query functions. Agree on package structure, error format, and canonical station/route identifiers first. Preserve source IDs (including express/shuttle IDs) instead of inventing mappings. Proposed endpoints, pending team agreement: `GET /api/service-alerts?routeId=...` and `GET /api/facilities?stationId=...`. Return the normalized types plus source/retrieval timestamps, and retain explicit unknown/error states.
