package com.nyctransithub.backend.transit.model;

/** A transit route retaining its source ID and display attributes. */
public record Route(
        String id,
        String shortName,
        String longName,
        String color,
        String textColor) {
}
