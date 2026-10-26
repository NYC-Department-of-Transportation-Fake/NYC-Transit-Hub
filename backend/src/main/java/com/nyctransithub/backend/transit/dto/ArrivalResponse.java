package com.nyctransithub.backend.transit.dto;

import java.time.Instant;
import java.util.List;

public record ArrivalResponse(List<ArrivalDto> data, Metadata meta) {
    public ArrivalResponse { data = List.copyOf(data); }

    public record Metadata(String stationId, Instant servedAt, List<FeedStatus> feeds) {
        public Metadata { feeds = List.copyOf(feeds); }
    }

    public record FeedStatus(String feedId, Instant sourceUpdatedAt, Instant fetchedAt,
            boolean cached, boolean stale, boolean refreshFailed) {}
}
