import Button from "./ui/Button";
import Card from "./ui/Card";

// Component properties
type JourneySearchStatusProps = {
  status: "loading" | "error" | "empty" | "cancelled";
  message?: string;
  onRetry?: () => void;
  onCancel?: () => void;
};

// Reusable route loading skeleton
function RouteLoadingSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mt-4 grid animate-pulse grid-cols-1 gap-3 motion-reduce:animate-none lg:grid-cols-3"
    >
      {[0, 1, 2].map((index) => (
        <Card key={index} variant="outlined" padding="md" className="space-y-3">
          {/* Route Header Placeholder */}
          <div className="h-4 w-24 rounded bg-slate-200" />

          {/* Duration Placeholder */}
          <div className="h-8 w-20 rounded bg-slate-200" />

          {/* Subway Line Placeholders */}
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-200" />

            <div className="h-7 w-7 rounded-full bg-slate-200" />
          </div>

          {/* Route Statistics Placeholders */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-100 p-3">
              <div className="h-3 w-10 rounded bg-slate-200" />

              <div className="mt-2 h-5 w-6 rounded bg-slate-200" />
            </div>

            <div className="rounded-lg bg-slate-100 p-3">
              <div className="h-3 w-12 rounded bg-slate-200" />

              <div className="mt-2 h-5 w-6 rounded bg-slate-200" />
            </div>
          </div>

          {/* Route Selection Placeholder */}
          <div className="h-9 w-full rounded-lg bg-slate-200" />
        </Card>
      ))}
    </div>
  );
}

// Journey search status component
export default function JourneySearchStatus({
  status,
  message,
  onRetry,
  onCancel,
}: JourneySearchStatusProps) {
  // Loading state
  if (status === "loading") {
    return (
      <section aria-label="Journey search in progress" className="mt-6 min-w-0">
        <Card variant="default" padding="lg">
          {/* Loading Information */}
          <div
            role="status"
            className="flex flex-col items-center py-4 text-center"
          >
            {/* Loading Spinner */}
            <div
              aria-hidden="true"
              className="h-10 w-10 animate-spin rounded-full border-4 border-nyu-light border-t-nyu motion-reduce:animate-none"
            />

            <h3 className="mt-4 text-lg font-semibold text-app-text">
              Finding your route...
            </h3>

            <p className="app-helper-text mt-2 max-w-md">
              Searching available subway journeys based on your preferences.
            </p>
          </div>

          {/* Skeleton Loading Cards */}
          <div aria-busy="true">
            <RouteLoadingSkeleton />
          </div>

          {/* Cancel Request */}
          {onCancel && (
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={onCancel}
              className="mt-4"
            >
              Cancel Search
            </Button>
          )}
        </Card>
      </section>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <section aria-label="Journey search error" className="mt-6 min-w-0">
        <Card
          variant="outlined"
          padding="lg"
          className="!border-red-200 !bg-red-50"
        >
          {/* Error Information */}
          <div
            role="alert"
            className="flex flex-col items-center py-3 text-center"
          >
            {/* Error Icon */}
            <div
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-app-error"
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
                <circle cx="12" cy="12" r="10" />

                <path d="M12 8v4" />

                <path d="M12 16h.01" />
              </svg>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-red-900">
              Unable to Find Routes
            </h3>

            <p className="mt-2 max-w-lg break-words text-sm leading-relaxed text-red-800">
              {message || "Something went wrong while searching for routes."}
            </p>
          </div>

          {/* Retry Request */}
          {onRetry && (
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={onRetry}
              className="mt-4"
              leftIcon={
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 7v5h-5" />

                  <path d="M20 12a8 8 0 1 0-2.3 5.7" />
                </svg>
              }
            >
              Try Again
            </Button>
          )}
        </Card>
      </section>
    );
  }

  // Empty result state
  if (status === "empty") {
    return (
      <section aria-label="No available journeys" className="mt-6 min-w-0">
        <Card variant="default" padding="lg">
          {/* Empty Result Information */}
          <div
            role="status"
            className="flex flex-col items-center py-4 text-center"
          >
            {/* Empty Search Icon */}
            <div
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-nyu-light text-nyu"
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
                <circle cx="11" cy="11" r="7" />

                <path d="m20 20-4-4" />

                <path d="m9 9 4 4" />

                <path d="m13 9-4 4" />
              </svg>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-app-text">
              No Routes Found
            </h3>

            <p className="app-helper-text mt-2 max-w-md break-words">
              {message ||
                "No available routes were returned for your selected stations and preferences."}
            </p>
          </div>

          {/* Alternative Search Suggestions */}
          <div className="mt-2 rounded-lg border border-app-border bg-slate-50 p-4">
            <p className="text-sm font-semibold text-app-text">You can try:</p>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-app-muted">
              <li>Selecting a different starting station.</li>

              <li>Selecting a different destination.</li>

              <li>Changing your route optimization preference.</li>
            </ul>
          </div>

          {/* Retry Empty Search */}
          {onRetry && (
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={onRetry}
              className="mt-4"
            >
              Search Again
            </Button>
          )}
        </Card>
      </section>
    );
  }

  // Cancelled request state
  return (
    <section aria-label="Journey search cancelled" className="mt-6 min-w-0">
      <Card variant="default" padding="lg">
        {/* Cancelled Search Information */}
        <div
          role="status"
          className="flex flex-col items-center py-4 text-center"
        >
          {/* Cancelled Search Icon */}
          <div
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-app-muted"
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
              <circle cx="12" cy="12" r="10" />

              <path d="m9 9 6 6" />

              <path d="m15 9-6 6" />
            </svg>
          </div>

          <h3 className="mt-4 text-lg font-semibold text-app-text">
            Search Cancelled
          </h3>

          <p className="app-helper-text mt-2 max-w-md break-words">
            {message ||
              "Your route search was cancelled. Your selected stations and preferences have been preserved."}
          </p>
        </div>

        {/* Preserved Search Information */}
        <div className="app-info-panel mt-2">
          <div className="flex items-start gap-2">
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0"
            >
              <circle cx="12" cy="12" r="10" />

              <path d="M12 11v5" />

              <path d="M12 8h.01" />
            </svg>

            <p>
              You can restart your search without selecting your stations again.
            </p>
          </div>
        </div>

        {/* Restart Cancelled Search */}
        {onRetry && (
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={onRetry}
            className="mt-4"
          >
            Search Again
          </Button>
        )}
      </Card>
    </section>
  );
}
