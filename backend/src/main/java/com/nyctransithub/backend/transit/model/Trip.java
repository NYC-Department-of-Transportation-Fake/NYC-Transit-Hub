package com.nyctransithub.backend.transit.model;

/** Source trip and route IDs; headsign and directionId may be null when absent. */
public record Trip(String id, String routeId, String headsign, Integer directionId) {
}
