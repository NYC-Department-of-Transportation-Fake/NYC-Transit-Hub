import type {
  JourneyDraft,
  JourneyPreferences,
  JourneyStationSelection,
} from "../types/journey";

// Storage key for the temporary journey plan
const STORAGE_KEY = "nyc-transit-hub:journey-draft";

// Default route preferences
export const DEFAULT_JOURNEY_PREFERENCES: JourneyPreferences = {
  optimization: "fastest",
  accessibleOnly: false,
};

// Create an empty journey draft
export function createEmptyJourneyDraft(): JourneyDraft {
  return {
    from: null,
    to: null,
    preferences: {
      ...DEFAULT_JOURNEY_PREFERENCES,
    },
  };
}

// Validate stored station data
function isValidStation(value: unknown): value is JourneyStationSelection {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const station = value as Partial<JourneyStationSelection>;

  return (
    typeof station.id === "string" &&
    station.id.trim().length > 0 &&
    typeof station.name === "string" &&
    station.name.trim().length > 0
  );
}

// Validate stored route preferences
function isValidPreferences(value: unknown): value is JourneyPreferences {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const preferences = value as Partial<JourneyPreferences>;

  return (
    (preferences.optimization === "fastest" ||
      preferences.optimization === "fewestTransfers" ||
      preferences.optimization === "fewestStops") &&
    typeof preferences.accessibleOnly === "boolean"
  );
}

// Retrieve the saved journey draft
export function loadJourneyDraft(): JourneyDraft {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return createEmptyJourneyDraft();
    }

    const parsed = JSON.parse(stored);

    if (typeof parsed !== "object" || parsed === null) {
      return createEmptyJourneyDraft();
    }

    return {
      from: isValidStation(parsed.from) ? parsed.from : null,

      to: isValidStation(parsed.to) ? parsed.to : null,

      preferences: isValidPreferences(parsed.preferences)
        ? parsed.preferences
        : {
            ...DEFAULT_JOURNEY_PREFERENCES,
          },
    };
  } catch {
    // Handle unavailable storage or corrupted data
    return createEmptyJourneyDraft();
  }
}

// Save the current journey draft
export function saveJourneyDraft(draft: JourneyDraft): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Journey planning remains usable without storage
  }
}

// Remove the saved journey draft
export function clearJourneyDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Handle unavailable browser storage
  }
}
