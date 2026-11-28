import { useId } from "react";

import Card from "./ui/Card";

import type { JourneyPreferences, RoutePreference } from "../types/journey";

// Component properties
type RoutePreferencesProps = {
  preferences: JourneyPreferences;
  onChange: (preferences: JourneyPreferences) => void;
};

// Available route optimization options
const ROUTE_OPTIONS: {
  value: RoutePreference;
  label: string;
  description: string;
}[] = [
  {
    value: "fastest",
    label: "Fastest Route",
    description: "Minimize total travel time",
  },
  {
    value: "fewestTransfers",
    label: "Fewest Transfers",
    description: "Minimize subway line changes",
  },
  {
    value: "fewestStops",
    label: "Fewest Stops",
    description: "Minimize the number of stops",
  },
];

// Shared preference option styles
function getPreferenceClassName(isSelected: boolean) {
  return [
    "flex min-w-0 cursor-pointer items-start gap-3",
    "rounded-lg border p-3",
    "transition-colors motion-reduce:transition-none",
    "focus-within:ring-2",
    "focus-within:ring-nyu",
    "focus-within:ring-offset-2",
    isSelected
      ? "border-nyu bg-nyu-light"
      : "border-app-border bg-app-surface hover:bg-slate-50",
  ].join(" ");
}

// Route preference component
export default function RoutePreferences({
  preferences,
  onChange,
}: RoutePreferencesProps) {
  // Generate unique accessibility IDs
  const componentId = useId();

  const headingId = `${componentId}-heading`;

  const descriptionId = `${componentId}-description`;

  const noticeId = `${componentId}-notice`;

  const accessibilityId = `${componentId}-accessibility`;

  return (
    <section aria-labelledby={headingId} className="mt-6 min-w-0">
      {/* Shared Card Container */}
      <Card variant="default" padding="md">
        {/* Section Title */}
        <h2 id={headingId} className="app-section-title">
          Route Preferences
        </h2>

        {/* Section Description */}
        <p
          id={descriptionId}
          className="mt-1 text-sm leading-relaxed text-app-muted"
        >
          Choose how you would like to travel.
        </p>

        {/* Route Optimization Options */}
        <fieldset
          aria-describedby={`${descriptionId} ${noticeId}`}
          className="mt-4 min-w-0"
        >
          <legend className="sr-only">Route optimization</legend>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {ROUTE_OPTIONS.map((option) => {
              const isSelected = preferences.optimization === option.value;

              const optionId = `${componentId}-${option.value}`;

              const labelId = `${optionId}-label`;

              const optionDescriptionId = `${optionId}-description`;

              return (
                <label
                  key={option.value}
                  htmlFor={optionId}
                  className={`${getPreferenceClassName(isSelected)} min-h-20`}
                >
                  {/* Native Radio Button */}
                  <input
                    id={optionId}
                    type="radio"
                    name={`${componentId}-routePreference`}
                    value={option.value}
                    checked={isSelected}
                    aria-labelledby={labelId}
                    aria-describedby={optionDescriptionId}
                    onChange={() =>
                      onChange({
                        ...preferences,
                        optimization: option.value,
                      })
                    }
                    className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-nyu"
                  />

                  {/* Option Information */}
                  <span className="min-w-0 flex-1">
                    {/* Option Label */}
                    <span
                      id={labelId}
                      className={`block text-sm font-semibold ${
                        isSelected ? "text-nyu" : "text-app-text"
                      }`}
                    >
                      {option.label}
                    </span>

                    {/* Option Description */}
                    <span
                      id={optionDescriptionId}
                      className="app-helper-text mt-1 block"
                    >
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Accessibility Preference */}
        <div className="mt-4 border-t border-app-border pt-4">
          <label
            htmlFor={accessibilityId}
            className={`${getPreferenceClassName(
              preferences.accessibleOnly,
            )} min-h-16`}
          >
            {/* Native Checkbox */}
            <input
              id={accessibilityId}
              type="checkbox"
              checked={preferences.accessibleOnly}
              aria-labelledby={`${accessibilityId}-label`}
              aria-describedby={`${accessibilityId}-description ${noticeId}`}
              onChange={(event) =>
                onChange({
                  ...preferences,
                  accessibleOnly: event.target.checked,
                })
              }
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded accent-nyu"
            />

            {/* Accessibility Information */}
            <span className="min-w-0 flex-1">
              {/* Accessibility Label */}
              <span
                id={`${accessibilityId}-label`}
                className={`block text-sm font-semibold ${
                  preferences.accessibleOnly ? "text-nyu" : "text-app-text"
                }`}
              >
                Wheelchair-accessible route
              </span>

              {/* Accessibility Description */}
              <span
                id={`${accessibilityId}-description`}
                className="app-helper-text mt-1 block"
              >
                Request accessible stations and transfers.
              </span>
            </span>
          </label>
        </div>

        {/* Backend Integration Notice */}
        <div className="app-info-panel mt-4">
          <div className="flex items-start gap-2">
            {/* Information Icon */}
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

            {/* Integration Information */}
            <p
              id={noticeId}
              className="min-w-0 text-xs leading-relaxed sm:text-sm"
            >
              Preferences are saved for this search. Demo routes support local
              ranking. Real route optimization and accessibility filtering
              require backend integration.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
