import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router";
import { useTranslation } from "react-i18next";

import LanguageSwitcher from "./components/LanguageSwitcher";

import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import PageHeader from "./components/ui/PageHeader";

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
  labelKey: string;
  icon: NavigationIconName;
  end?: boolean;
}[] = [
  {
    to: "/",
    labelKey: "nav.map",
    icon: "map",
    end: true,
  },
  {
    to: "/stations",
    labelKey: "nav.stations",
    icon: "station",
  },
  {
    to: "/journeys",
    labelKey: "nav.planTrip",
    icon: "journey",
  },
  {
    to: "/status",
    labelKey: "nav.serviceStatus",
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

      {name === "status" && <path d="M3 12h4l3-8 4 16 3-8h4" />}
    </svg>
  );
}

// Application brand
function AppBrand() {
  return (
    <Link
      to="/"
      aria-label="NYC Transit Hub — Home"
      className="inline-flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyu focus-visible:ring-offset-2"
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

        <span className="mt-0.5 block text-xs leading-relaxed text-app-muted sm:text-sm">
          Your guide to New York City transit
        </span>
      </span>
    </Link>
  );
}

// Global navigation bar with multilingual support
function NavigationBar() {
  const { t } = useTranslation();

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
            `flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyu focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-4 ${
              isActive
                ? "bg-nyu text-white shadow-sm"
                : "text-app-muted hover:bg-nyu-light hover:text-nyu"
            }`
          }
        >
          <NavigationIcon name={item.icon} />

          <span className="min-w-0 leading-snug">{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// Account controls properties
type AccountControlsProps = {
  signedIn: boolean | null;
  onSignOut: () => Promise<void>;
  signingOut: boolean;
};

// Authentication and language controls
function AccountControls({
  signedIn,
  onSignOut,
  signingOut,
}: AccountControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Authentication Controls */}
      {signedIn ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-app-success">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-app-success"
            />
            Signed in
          </span>

          <Button
            variant="secondary"
            size="sm"
            loading={signingOut}
            loadingText="Signing out..."
            onClick={() => void onSignOut()}
          >
            Sign out
          </Button>
        </div>
      ) : (
        <NavLink
          to="/login"
          className={({ isActive }) =>
            isActive ? "app-btn-primary" : "app-btn-outline"
          }
        >
          Sign in
        </NavLink>
      )}
    </div>
  );
}

// Login page properties
type LoginPageProps = {
  signedIn: boolean | null;
  onSignedIn: () => void;
};

// Login page
function LoginPage({ signedIn, onSignedIn }: LoginPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // Existing backend authentication integration
  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const fields = new FormData(form);

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: fields.get("email"),
          password: fields.get("password"),
        }),
      });

      if (response.status === 401) {
        setErrorMessage("The email or password is incorrect.");

        return;
      }

      if (!response.ok || (await response.json()).signedIn !== true) {
        setErrorMessage(
          "Could not complete sign-in. Check the connection to the backend.",
        );

        return;
      }

      form.reset();

      onSignedIn();
    } catch {
      setErrorMessage("Could not reach the sign-in service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="app-page">
      <div className="mx-auto w-full max-w-md">
        {/* Login Page Header */}
        <PageHeader title="Sign in" description="Sign in to NYC Transit Hub." />

        {signedIn ? (
          <Card variant="default" padding="lg">
            <div
              role="status"
              className="flex flex-col items-center py-3 text-center"
            >
              <div
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-app-success"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>

              <h2 className="app-section-title mt-4">You're signed in!</h2>

              <p className="app-helper-text mt-2">
                You are signed in to NYC Transit Hub.
              </p>

              <Link to="/" className="app-btn-primary mt-5 w-full">
                Back to Map
              </Link>
            </div>
          </Card>
        ) : (
          <Card variant="default" padding="lg">
            {/* Login Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email Address */}
              <div>
                <label htmlFor="login-email" className="app-label">
                  Email address
                </label>

                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                  placeholder="Enter your email address"
                  className="app-input mt-2"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="login-password" className="app-label">
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  placeholder="Enter your password"
                  className="app-input mt-2"
                />
              </div>

              {/* Authentication Error */}
              {errorMessage && (
                <div role="alert" className="app-error-panel break-words">
                  {errorMessage}
                </div>
              )}

              {/* Sign In Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={isSubmitting}
                loadingText="Signing in..."
              >
                Sign in
              </Button>
            </form>
          </Card>
        )}

        {/* Return to Map */}
        {!signedIn && (
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-sm font-medium text-nyu underline underline-offset-2 hover:text-nyu-hover"
            >
              Back to Map
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// Page not found
function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-app-border bg-app-surface p-6 text-center shadow-sm sm:p-10"
    >
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-nyu-light text-nyu"
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
        className="mt-2 text-2xl font-bold text-app-text sm:text-3xl"
      >
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-app-muted sm:text-base">
        The page you are looking for does not exist or may have been moved.
      </p>

      <Link to="/" className="app-btn-primary mt-6">
        <NavigationIcon name="map" />
        Back to Map
      </Link>
    </section>
  );
}

// Main application
export default function App() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const [signingOut, setSigningOut] = useState(false);

  const [authError, setAuthError] = useState("");

  // Check the existing authentication session
  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const session = await response.json();

        if (!controller.signal.aborted) {
          setSignedIn((current) => current ?? session.signedIn === true);
        }
      } catch {
        // Keep the sign-in link available
        // if the session check fails.
      }
    }

    void checkSession();

    return () => controller.abort();
  }, []);

  // Handle successful authentication
  const handleSignedIn = () => {
    setSignedIn(true);
    setAuthError("");
  };

  // Existing backend sign-out integration
  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setAuthError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: "{}",
      });

      if (response.ok && (await response.json()).signedIn === false) {
        setSignedIn(false);
        return;
      }

      setAuthError("Sign-out failed. Please try again.");
    } catch {
      setAuthError("Could not reach the sign-out service. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      {/* Skip Navigation for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only z-[2000] rounded-lg bg-nyu px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-nyu"
      >
        Skip to main content
      </a>

      {/* Global Header */}
      <header className="border-b border-app-border bg-app-surface shadow-sm">
        <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6">
          {/* Application Brand and Account Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <AppBrand />

            <AccountControls
              signedIn={signedIn}
              onSignOut={handleSignOut}
              signingOut={signingOut}
            />
          </div>

          {/* Global Navigation */}
          <NavigationBar />

          {/* Authentication Error */}
          {authError && (
            <div role="alert" className="app-error-panel mt-3 break-words">
              {authError}
            </div>
          )}
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

          {/* Authentication */}
          <Route
            path="/login"
            element={
              <LoginPage signedIn={signedIn} onSignedIn={handleSignedIn} />
            }
          />

          {/* Invalid Routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
