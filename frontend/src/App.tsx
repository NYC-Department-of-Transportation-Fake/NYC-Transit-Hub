import { Link, Route, Routes } from "react-router";
import MapPage from "./pages/MapPage";
import ServiceStatusPage from "./pages/ServiceStatusPage";
import StationsPage from "./pages/StationsPage";
import StationDetailPage from "./pages/StationDetailPage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-nyu">NYC Transit Hub</h1>

        <nav className="mt-4 flex flex-wrap gap-6">
          <Link to="/status" className="hover:text-nyu">
            Service & Accessibility
          </Link>
          <Link to="/" className="hover:text-nyu">
            Map
          </Link>

          <Link to="/stations" className="hover:text-nyu">
            Stations
          </Link>

          <Link to="/journeys" className="hover:text-nyu">
            Plan a Trip
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <Routes>
          <Route path="/status" element={<ServiceStatusPage />} />
          <Route path="/" element={<MapPage />} />

          <Route path="/stations" element={<StationsPage />} />
          <Route path="/stations/:stationId" element={<StationDetailPage />} />

          <Route
            path="/journeys"
            element={
              <section>
                <h2 className="text-2xl font-bold">Plan a Trip</h2>

                <p className="mt-2 text-slate-600">
                  Trip planning is coming soon. Use Stations to check upcoming arrivals.
                </p>
              </section>
            }
          />

          <Route
            path="*"
            element={
              <section>
                <h2 className="text-2xl font-bold">Page not found</h2>

                <Link to="/" className="mt-4 inline-block text-nyu underline">
                  Back to Map
                </Link>
              </section>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
