# Module B — Frontend Development Log (Week 5)

**Project:** NYC Transit Hub  
**Module:** B — Map & Transit Query  
**Date:** 2026-10-30  
**Scope:** Trip Planning frontend (work in progress)

## Summary

Replaced the placeholder `/journeys` page with a working trip-planning form. Users can search for NYC subway stations, choose a starting station and a destination, swap or clear the selections, validate their input, and view a basic trip summary.

## Completed

- Created `frontend/src/pages/JourneysPage.tsx` as a dedicated trip-planning page.
- Updated `frontend/src/App.tsx` to render `JourneysPage` at `/journeys` while retaining the existing navigation and other routes.
- Added searchable **From** and **To** fields using the existing `fetchStations` client and `GET /api/stations` backend endpoint.
- Used TanStack Query for asynchronous searches, caching, loading messages, error messages, and empty-result handling.
- Displayed station names and subway route IDs in search suggestions, and stored the selected station IDs separately from displayed names.
- Added **Swap Stations** and **Clear** actions, keeping station names and IDs in sync.
- Added **Find Route** input validation for missing selections and identical selected station IDs.
- Added a conditional **Your Trip** summary showing the chosen origin and destination after successful validation.
- Cleared stale validation results when selections are edited, swapped, or reset.

## Integration notes

- The trip-planning form **reuses the existing Spring Boot station-search API**; no new backend endpoint is required for this milestone.
- Backend service must be running for live station suggestions (typically localhost:8080 during local development).
- The current validation checks whether selected station IDs match. Different IDs may represent different platforms within the same physical transfer complex; normalize/handle this in route planning.

## Not yet implemented

- No journey/path calculation; the **Find Route** button currently validates inputs and shows a summary only.
- No recommended subway lines, station-by-station directions, transfer instructions, travel-time estimates, or route overlay on the map.
- No `/api/journeys` endpoint has been integrated.
- End-to-end validation and automated tests for the new Journeys page are still pending.

## Next steps (Week 5–6)

1. Coordinate with Module A on route-network data and an API contract for journey planning (station IDs, ordered stops, line segments, transfers, errors).
2. Implement a route-results view for successful responses, with loading/no-route/error states.
3. Integrate the journey-planning API once Module A provides it.
4. Add Leaflet route highlighting and optimize the layout for mobile devices.
5. Add tests and open a Pull Request for team review.

## Files changed

- `frontend/src/pages/JourneysPage.tsx` (new)
- `frontend/src/App.tsx` (modified)
- `docs/module-b-week5-progress.md` (new)

## Verification status

- **Manually confirmed in development conversation:** station search suggestions appeared for "Jay", and the From selection worked.
- **Subsequent steps:** implementation instructions and code prepared for To, Swap, Clear, validation, and summary; team should run these locally and verify before merging.
- **Not claimed:** production deployment, successful CI, or full journey routing.
