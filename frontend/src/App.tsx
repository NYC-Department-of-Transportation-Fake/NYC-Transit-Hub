import { useEffect, useState } from "react";

import { Link, Route, Routes } from "react-router";
import MapPage from "./pages/MapPage";
import ServiceStatusPage from "./pages/ServiceStatusPage";
import StationsPage from "./pages/StationsPage";
import StationDetailPage from "./pages/StationDetailPage";
import JourneysPage from "./pages/JourneysPage";

export default function App() {
    const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return;

        const session = await response.json();
        setSignedIn(current => current ?? (session.signedIn === true));
      } catch {
        // Keep the sign-in link available if the session check fails.
      }
    }

    void checkSession();
    return () => controller.abort();
  }, []);
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
          {signedIn ? (
  <>
  <span>Signed in</span>
  <button
    type="button"
    className="cursor-pointer hover:text-nyu"
    onClick={async () => {
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });

        if (response.ok && (await response.json()).signedIn === false) {
          setSignedIn(false);
          return;
        }
        alert("Sign-out failed. Please try again.");
      } catch {
        alert("Could not reach the sign-out service. Please try again.");
      }
    }}
  >
    Sign out
  </button>
</>
) : (
  <Link to="/login" className="hover:text-nyu">Sign in</Link>
)}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <Routes>
          <Route
  path="/login"
  element={signedIn ? (
  <p>You’re signed in to NYC Transit Hub.</p>
) : (
    <section>
      <h2>Sign in to NYC Transit Hub</h2>

      <form onSubmit={async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fields = new FormData(form);

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fields.get("email"),
        password: fields.get("password"),
      }),
    });

    if (response.status === 401) {
      alert("The email or password is incorrect.");
      return;
    }

    if (!response.ok || (await response.json()).signedIn !== true) {
      alert("Could not complete sign-in. Check the connection to the backend.");
      return;
    }

    setSignedIn(true);
    form.reset();
    alert("You’re signed in!");
  } catch {
    alert("Could not reach the sign-in service.");
  }
}}>
        <p>
          <label>
            Email address<br />
            <input type="email" name="email" autoComplete="username" required />
          </label>
        </p>

        <p>
          <label>
            Password<br />
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
        </p>

        <button type="submit">Sign in</button>
      </form>
    </section>
  )}
/>

          <Route path="/status" element={<ServiceStatusPage />} />

          <Route path="/" element={<MapPage />} />

          <Route path="/stations" element={<StationsPage />} />

          <Route path="/stations/:stationId" element={<StationDetailPage />} />

          <Route path="/journeys" element={<JourneysPage />} />

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
