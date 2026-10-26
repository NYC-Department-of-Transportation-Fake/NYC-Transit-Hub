package com.nyctransithub.backend.transit.model;

import com.nyctransithub.backend.transit.dto.ArrivalDto;
import java.time.Instant;
import java.util.List;

public record ArrivalFeed(String feedId, Instant sourceUpdatedAt, Instant fetchedAt,
        List<ArrivalDto> arrivals, boolean cached, boolean refreshFailed) {
    public ArrivalFeed {
        arrivals = List.copyOf(arrivals);
    }

    public ArrivalFeed(String feedId, Instant sourceUpdatedAt, Instant fetchedAt, List<ArrivalDto> arrivals) {
        this(feedId, sourceUpdatedAt, fetchedAt, arrivals, false, false);
    }
}
