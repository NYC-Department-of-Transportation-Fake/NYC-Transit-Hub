package com.nyctransithub.backend.transit.client;

import com.google.transit.realtime.GtfsRealtime;
import com.nyctransithub.backend.common.TransitDataUnavailableException;
import com.nyctransithub.backend.transit.dto.ArrivalDto;
import com.nyctransithub.backend.transit.model.ArrivalFeed;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Fetches and parses subway trip updates; service alerts are outside this client's scope. */
@Component
public class MtaArrivalClient {
    private final String baseUrl;
    private final Duration timeout;
    private final HttpClient http;
    private final Duration cacheTtl, maxAge, retryInterval;
    private final Clock clock;
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    @Autowired
    public MtaArrivalClient(@Value("${app.mta.base-url}") String baseUrl,
            @Value("${app.mta.timeout}") Duration timeout,
            @Value("${app.mta.cache-ttl}") Duration cacheTtl,
            @Value("${app.mta.max-age}") Duration maxAge,
            @Value("${app.mta.retry-interval}") Duration retryInterval) {
        this(baseUrl, timeout, cacheTtl, maxAge, retryInterval, Clock.systemUTC());
    }

    MtaArrivalClient(String baseUrl, Duration timeout, Duration cacheTtl,
            Duration maxAge, Duration retryInterval, Clock clock) {
        for (Duration duration : new Duration[]{timeout, cacheTtl, maxAge, retryInterval}) {
            if (duration.isNegative() || duration.isZero()) throw new IllegalArgumentException("Durations must be positive");
        }
        this.baseUrl = baseUrl;
        this.timeout = timeout;
        this.cacheTtl = cacheTtl;
        this.maxAge = maxAge;
        this.retryInterval = retryInterval;
        this.clock = clock;
        this.http = HttpClient.newBuilder().connectTimeout(timeout).build();
    }

    public ArrivalFeed fetchArrivals(String feedId) {
        CacheEntry entry = cache.computeIfAbsent(feedId, ignored -> new CacheEntry());
        // Only callers for this feed wait for its refresh; other feeds remain independent.
        synchronized (entry) {
            Instant now = clock.instant();
            if (entry.failure == null && usable(entry.feed, now)
                    && now.isBefore(entry.feed.fetchedAt().plus(cacheTtl))) {
                return cached(entry.feed, false);
            }
            if (now.isBefore(entry.retryAt)) return fallback(entry, now);
            try {
                ArrivalFeed downloaded = downloadFeed(feedId);
                if (!usable(downloaded, clock.instant()) || (entry.feed != null
                        && downloaded.sourceUpdatedAt().isBefore(entry.feed.sourceUpdatedAt()))) {
                    throw new TransitDataUnavailableException("MTA returned outdated arrival data.");
                }
                entry.feed = downloaded;
                entry.failure = null;
                entry.retryAt = Instant.MIN;
                return downloaded;
            } catch (TransitDataUnavailableException ex) {
                if (Thread.currentThread().isInterrupted()) throw ex;
                entry.failure = ex;
                entry.retryAt = clock.instant().plus(retryInterval);
                return fallback(entry, clock.instant());
            }
        }
    }

    private boolean usable(ArrivalFeed feed, Instant now) {
        return feed != null && now.isBefore(feed.sourceUpdatedAt().plus(maxAge))
                && now.isBefore(feed.fetchedAt().plus(maxAge));
    }

    private ArrivalFeed fallback(CacheEntry entry, Instant now) {
        if (usable(entry.feed, now)) return cached(entry.feed, true);
        throw entry.failure;
    }

    private ArrivalFeed cached(ArrivalFeed feed, boolean refreshFailed) {
        return new ArrivalFeed(feed.feedId(), feed.sourceUpdatedAt(), feed.fetchedAt(),
                feed.arrivals(), true, refreshFailed);
    }

    private static class CacheEntry {
        private ArrivalFeed feed;
        private Instant retryAt = Instant.MIN;
        private TransitDataUnavailableException failure;
    }

    private ArrivalFeed downloadFeed(String feedId) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + feedId))
                    .timeout(timeout).GET().build();
            var response = http.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) {
                throw new TransitDataUnavailableException("MTA arrival feed is unavailable.");
            }
            return parseFeed(feedId, response.body(), clock.instant());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new TransitDataUnavailableException("MTA arrival request was interrupted.", ex);
        } catch (IOException ex) {
            throw new TransitDataUnavailableException("Could not retrieve MTA arrival data.", ex);
        }
    }

    ArrivalFeed parseFeed(String feedId, byte[] bytes, Instant fetchedAt) {
        try {
            var feed = GtfsRealtime.FeedMessage.parseFrom(bytes);
            var header = feed.getHeader();
            if (!header.hasTimestamp() || header.getTimestamp() <= 0
                    || !(header.getGtfsRealtimeVersion().equals("1.0")
                    || header.getGtfsRealtimeVersion().equals("2.0"))
                    || header.getIncrementality() != GtfsRealtime.FeedHeader.Incrementality.FULL_DATASET) {
                throw new IllegalArgumentException("Unsupported or missing GTFS feed header");
            }
            Instant updatedAt = Instant.ofEpochSecond(header.getTimestamp());
            var arrivals = new ArrayList<ArrivalDto>();
            for (var entity : feed.getEntityList()) {
                if (entity.getIsDeleted() || !entity.hasTripUpdate()) continue;
                var update = entity.getTripUpdate();
                var trip = update.getTrip();
                String relationship = trip.getScheduleRelationship().name();
                if (relationship.equals("CANCELED") || relationship.equals("DELETED")) continue;
                if (trip.getTripId().isBlank() || trip.getRouteId().isBlank()) continue;
                for (var stop : update.getStopTimeUpdateList()) {
                    if (stop.getStopId().isBlank()
                            || stop.getScheduleRelationship() == GtfsRealtime.TripUpdate.StopTimeUpdate.ScheduleRelationship.SKIPPED
                            || stop.getScheduleRelationship() == GtfsRealtime.TripUpdate.StopTimeUpdate.ScheduleRelationship.NO_DATA) continue;
                    Instant arrival = time(stop.hasArrival() ? stop.getArrival() : null);
                    Instant departure = time(stop.hasDeparture() ? stop.getDeparture() : null);
                    if (arrival == null && departure == null) continue;
                    arrivals.add(new ArrivalDto(trip.getTripId(),
                            trip.hasStartDate() ? trip.getStartDate() : null,
                            trip.getRouteId(), stop.getStopId(),
                            stop.hasStopSequence() ? stop.getStopSequence() : null,
                            null, null, arrival, departure));
                }
            }
            return new ArrivalFeed(feedId, updatedAt, fetchedAt, arrivals);
        } catch (IOException | IllegalArgumentException | java.time.DateTimeException ex) {
            throw new TransitDataUnavailableException("MTA arrival data could not be parsed.", ex);
        }
    }

    private Instant time(GtfsRealtime.TripUpdate.StopTimeEvent event) {
        return event != null && event.hasTime() && event.getTime() > 0
                ? Instant.ofEpochSecond(event.getTime()) : null;
    }
}
