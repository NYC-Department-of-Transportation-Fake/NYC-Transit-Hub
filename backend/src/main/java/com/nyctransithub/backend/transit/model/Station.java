package com.nyctransithub.backend.transit.model;

import java.util.List;

/** A searchable station; IDs use the shared source-to-station mapping, never station names. */
public record Station(
        String id,
        String name,
        double latitude,
        double longitude,
        List<String> routeIds,
        List<String> stopIds) {

    public Station {
        routeIds = List.copyOf(routeIds);
        stopIds = List.copyOf(stopIds);
    }
}
