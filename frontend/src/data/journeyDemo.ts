import type {
  JourneyResult,
  JourneyStation,
  JourneySearchResult,
} from "../types/journey";

// Shared starting station
const startingStation: JourneyStation = {
  id: "demo-start",
  name: "Demo Starting Station",
  latitude: 40.692,
  longitude: -73.987,
};

// Shared destination station
const destinationStation: JourneyStation = {
  id: "demo-destination",
  name: "Demo Destination Station",
  latitude: 40.755,
  longitude: -73.987,
};

// Intermediate stations
const intermediateStation1: JourneyStation = {
  id: "demo-stop-1",
  name: "Demo Intermediate Station 1",
  latitude: 40.705,
  longitude: -73.99,
};

const intermediateStation2: JourneyStation = {
  id: "demo-stop-2",
  name: "Demo Intermediate Station 2",
  latitude: 40.712,
  longitude: -74.009,
};

const intermediateStation3: JourneyStation = {
  id: "demo-stop-3",
  name: "Demo Intermediate Station 3",
  latitude: 40.732,
  longitude: -74.001,
};

const intermediateStation4: JourneyStation = {
  id: "demo-stop-4",
  name: "Demo Intermediate Station 4",
  latitude: 40.744,
  longitude: -73.995,
};

// Transfer stations
const transferStation1: JourneyStation = {
  id: "demo-transfer-1",
  name: "Demo Transfer Station 1",
  latitude: 40.721,
  longitude: -73.997,
};

const transferStation2: JourneyStation = {
  id: "demo-transfer-2",
  name: "Demo Transfer Station 2",
  latitude: 40.726,
  longitude: -73.991,
};

// Option 1: Fastest Route
export const fastestJourney: JourneyResult = {
  id: "demo-fastest",

  from: startingStation,
  to: destinationStation,

  totalDurationMinutes: 25,
  totalStops: 3,
  transfers: 1,

  legs: [
    {
      routeId: "A",
      from: startingStation,
      to: transferStation1,

      stops: [startingStation, intermediateStation1, transferStation1],

      durationMinutes: 15,
    },

    {
      routeId: "F",
      from: transferStation1,
      to: destinationStation,

      stops: [transferStation1, destinationStation],

      durationMinutes: 10,
    },
  ],
};

// Option 2: Fewest Transfers
export const fewestTransfersJourney: JourneyResult = {
  id: "demo-fewest-transfers",

  from: startingStation,
  to: destinationStation,

  totalDurationMinutes: 32,
  totalStops: 5,
  transfers: 0,

  legs: [
    {
      routeId: "A",
      from: startingStation,
      to: destinationStation,

      stops: [
        startingStation,
        intermediateStation1,
        intermediateStation2,
        intermediateStation3,
        intermediateStation4,
        destinationStation,
      ],

      durationMinutes: 32,
    },
  ],
};

// Option 3: Fewest Stops
export const fewestStopsJourney: JourneyResult = {
  id: "demo-fewest-stops",

  from: startingStation,
  to: destinationStation,

  totalDurationMinutes: 28,
  totalStops: 2,
  transfers: 1,

  legs: [
    {
      routeId: "A",
      from: startingStation,
      to: transferStation2,

      stops: [startingStation, transferStation2],

      durationMinutes: 13,
    },

    {
      routeId: "N",
      from: transferStation2,
      to: destinationStation,

      stops: [transferStation2, destinationStation],

      durationMinutes: 15,
    },
  ],
};

// Collection of candidate journeys
export const demoJourneys: JourneyResult[] = [
  fastestJourney,
  fewestTransfersJourney,
  fewestStopsJourney,
];

// Mock journey search response
export const demoJourneySearchResult: JourneySearchResult = {
  journeys: demoJourneys,
};

// Preserve compatibility with the existing demo preview
export const demoJourney: JourneyResult = fastestJourney;
