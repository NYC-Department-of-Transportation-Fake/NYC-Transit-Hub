package com.nyctransithub.backend.transit.dto;

import java.time.Instant;

/** Absolute prediction times; unavailable fields stay null rather than being guessed. */
public record ArrivalDto(String tripId, String startDate, String routeId, String stopId,
        Integer stopSequence, String directionLabel, String destination,
        Instant arrivalTime, Instant departureTime) {}
