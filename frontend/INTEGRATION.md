# Frontend / backend integration

Start both processes in separate terminals from the repository root:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

```powershell
cd frontend
npm ci
npm run dev
```

Open http://127.0.0.1:5173/stations. Vite uses port 5173 and proxies `/api` to Spring Boot at `http://localhost:8080`. The backend must stay running. `npm run preview` also proxies `/api` for local previews; a production host needs an equivalent reverse proxy (Vite dev configuration is not a deployment server).

## Connected pages

- `/`: loads station markers from the backend and filters them by line; marker popups link to station details. The station list provides keyboard-friendly access.
- `/stations`: server-backed name search and line filtering, with filters in the URL so returning from details preserves the search.
- `/stations/:stationId`: station details and live arrivals. Supports line/boarding-stop filters, manual refresh and automatic refresh every 30 seconds. Remaining times update every 15 seconds, and passed predictions disappear.
- `/status`: existing C module, still reads MTA directly.
- `/journeys`: explicitly marked as coming soon; journey planning is not implemented.

Arrival timestamps display in America/New_York. Departure-only predictions are labeled as departures, and missing directions/destinations are never guessed. Source IDs distinguish boarding stops and same-named station records. Cache state and source/retrieval timestamps are available under Data freshness and cache status. Refresh failures keep a warning visible; data at least 10 minutes old is hidden. These age thresholds match the backend defaults and should be updated together if configuration changes.

## Checks

```powershell
npm run build
npm run lint
npm test
```

For a quick demo, search `Times`, select line `1`, click Search, open station `127`, select line `1` and boarding stop `127N`, then expand the freshness information. Query `no-such-station` to see the empty state. An unknown detail URL such as `/stations/missing` shows the backend error. If the backend is stopped, pages show a retry action instead of demo results.
