import { Link, NavLink, Route, Routes } from "react-router";

import MapPage from "./pages/MapPage";
import ServiceStatusPage from "./pages/ServiceStatusPage";
import StationsPage from "./pages/StationsPage";
import StationDetailPage from "./pages/StationDetailPage";
import JourneysPage from "./pages/JourneysPage";

// Available navigation icons
type NavigationIconName = "map" | "station" | "journey" | "status";

// Global navigation configuration
const NAV_ITEMS: {
  to: string;
  label: string;
  icon: NavigationIconName;
  end?: boolean;
}[] = [
  {
    to: "/",
    label: "Map",
    icon: "map",
    end: true,
  },
  {
    to: "/stations",
    label: "Stations",
    icon: "station",
  },
  {
    to: "/journeys",
    label: "Plan a Trip",
    icon: "journey",
  },
  {
    to: "/status",
    label: "Service & Accessibility",
    icon: "status",
  },
];

// Shared navigation icons
function NavigationIcon({ name }: { name: NavigationIconName }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {name === "map" && (
        <>
          <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
        </>
      )}

      {name === "station" && (
        <>
          <rect x="5" y="3" width="14" height="16" rx="4" />
          <path d="M5 11h14" />
          <circle cx="9" cy="15" r="1" />
          <circle cx="15" cy="15" r="1" />
          <path d="m8 19-2 3" />
          <path d="m16 19 2 3" />
        </>
      )}

      {name === "journey" && (
        <>
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="6" r="2" />
          <path d="M6 16V8a4 4 0 0 1 4-4h4" />
          <path d="M18 8v8a4 4 0 0 1-4 4h-4" />
        </>
      )}

      {name === "status" && (
        <>
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </>
      )}
    </svg>
  );
}

// Application brand
function AppBrand() {
  return (
    <Link
      to="/"
      aria-label="NYC Transit Hub — Home"
      className="inline-flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
    >
      {/* Brand Icon */}
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-nyu text-white sm:h-12 sm:w-12">
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="3" width="14" height="16" rx="4" />

          <path d="M5 11h14" />

          <path d="M12 3v8" />

          <circle cx="9" cy="15" r="1" />

          <circle cx="15" cy="15" r="1" />

          <path d="m8 19-2 3" />

          <path d="m16 19 2 3" />
        </svg>
      </span>

      {/* Brand Information */}
      <span className="min-w-0">
        <span className="block text-xl font-bold tracking-tight text-nyu sm:text-2xl">
          NYC Transit Hub
        </span>

        <span className="mt-0.5 block text-xs leading-relaxed text-slate-600 sm:text-sm">
          Your guide to New York City transit
        </span>
      </span>
    </Link>
  );
}

// Global navigation bar
function NavigationBar() {
  return (
    <nav
      aria-label="Main navigation"
      className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-4 ${
              isActive
                ? "bg-nyu text-white shadow-sm"
                : "text-slate-700 hover:bg-purple-50 hover:text-nyu"
            }`
          }
        >
          <NavigationIcon name={item.icon} />

          <span className="min-w-0 leading-snug">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// Page not found
function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10"
    >
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-nyu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      </div>

      <p className="mt-5 text-sm font-semibold text-nyu">ERROR 404</p>

      <h1
        id="not-found-title"
        className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl"
      >
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
        The page you are looking for does not exist or may have been moved.
      </p>

      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-nyu px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
      >
        <NavigationIcon name="map" />
        Back to Map
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Skip Navigation for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only z-[2000] rounded-lg bg-nyu px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        Skip to main content
      </a>

      {/* Global Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6">
          <AppBrand />

          <NavigationBar />
        </div>
      </header>

      {/* Main Application Content */}
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full min-w-0 max-w-6xl p-3 focus:outline-none sm:p-6"
      >
        <Routes>
          {/* Subway Map */}
          <Route path="/" element={<MapPage />} />

          {/* Station Search */}
          <Route path="/stations" element={<StationsPage />} />

          {/* Station Details and Live Arrivals */}
          <Route path="/stations/:stationId" element={<StationDetailPage />} />

          {/* Journey Planning */}
          <Route path="/journeys" element={<JourneysPage />} />

          {/* Service Status and Accessibility */}
          <Route path="/status" element={<ServiceStatusPage />} />

          {/* Invalid Routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
