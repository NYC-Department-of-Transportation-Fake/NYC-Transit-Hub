// Station information used in a journey
export type JourneyStation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

// A segment of a subway journey
export type JourneyLeg = {
  routeId: string;
  from: JourneyStation;
  to: JourneyStation;
  stops: JourneyStation[];
  durationMinutes: number;
};

// Complete subway journey
export type JourneyResult = {
  id: string;
  from: JourneyStation;
  to: JourneyStation;
  totalDurationMinutes: number;
  totalStops: number;
  transfers: number;
  legs: JourneyLeg[];
};

// Route optimization preference
export type RoutePreference = "fastest" | "fewestTransfers" | "fewestStops";

// User journey preferences
export type JourneyPreferences = {
  optimization: RoutePreference;
  accessibleOnly: boolean;
};

// A collection of candidate journeys
export type JourneySearchResult = {
  journeys: JourneyResult[];
};

// Request parameters for journey planning
export type JourneyRequest = {
  fromStationId: string;
  toStationId: string;
  preferences: JourneyPreferences;
};

// Station selection passed between pages
export type JourneyStationSelection = {
  id: string;
  name: string;
};

// Navigation state for the journey planning page
export type JourneyNavigationState = {
  from?: JourneyStationSelection;
  to?: JourneyStationSelection;
};

// Temporary journey planning state
export type JourneyDraft = {
  from: JourneyStationSelection | null;
  to: JourneyStationSelection | null;
  preferences: JourneyPreferences;
};
