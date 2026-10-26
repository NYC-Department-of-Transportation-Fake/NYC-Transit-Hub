package com.nyctransithub.backend.transit.model;

/** A source stop ID mapped to a station; directionLabel may be null when unknown. */
public record Stop(String id, String stationId, String directionLabel) {
}
