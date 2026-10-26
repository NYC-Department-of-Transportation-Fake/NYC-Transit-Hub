package com.nyctransithub.backend.transit.service;

import com.nyctransithub.backend.common.ResourceNotFoundException;
import com.nyctransithub.backend.common.TransitDataUnavailableException;
import com.nyctransithub.backend.config.MtaProperties;
import com.nyctransithub.backend.transit.client.MtaArrivalClient;
import com.nyctransithub.backend.transit.data.TransitDataStore;
import com.nyctransithub.backend.transit.dto.ArrivalDto;
import com.nyctransithub.backend.transit.dto.ArrivalResponse;
import com.nyctransithub.backend.transit.model.ArrivalFeed;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ArrivalService {
    private final TransitDataStore store;
    private final MtaArrivalClient client;
    private final MtaProperties properties;

    public ArrivalService(TransitDataStore store, MtaArrivalClient client, MtaProperties properties) {
        this.store = store;
        this.client = client;
        this.properties = properties;
    }

    public ArrivalResponse getArrivals(String stationId, String routeId, String stopId, int limit) {
        if (limit < 1 || limit > 100) throw badRequest("limit must be between 1 and 100");
        var station = store.station(stationId);
        if (station == null) throw new ResourceNotFoundException("STATION_NOT_FOUND", "Station does not exist.");
        String route = routeId == null ? "" : routeId.trim();
        String stop = stopId == null ? "" : stopId.trim();
        if (!route.isEmpty()) {
            if (store.route(route) == null) throw new ResourceNotFoundException("ROUTE_NOT_FOUND", "Route does not exist.");
            if (!station.routeIds().contains(route)) throw badRequest("Route is not listed for this station");
        }
        if (!stop.isEmpty() && !station.stopIds().contains(stop)) throw badRequest("Stop does not belong to this station");

        // Request each relevant feed once. Mapping is based on static route coverage.
        var feedIds = new TreeSet<String>();
        for (String requiredRoute : route.isEmpty() ? station.routeIds() : List.of(route)) {
            var matches = properties.feeds().entrySet().stream()
                    .filter(entry -> entry.getValue().contains(requiredRoute)).map(Map.Entry::getKey).toList();
            if (matches.isEmpty()) throw unavailable();
            feedIds.addAll(matches);
        }
        if (feedIds.isEmpty()) throw unavailable();
        var feeds = new ArrayList<ArrivalFeed>();
        for (String feedId : feedIds) feeds.add(client.fetchArrivals(feedId));
        // All required feeds must succeed; do not silently return incomplete results.
        feeds.sort(Comparator.comparing(ArrivalFeed::sourceUpdatedAt));
        Instant now = Instant.now();
        var unique = new HashMap<ArrivalKey, ArrivalDto>();
        for (ArrivalFeed feed : feeds) {
            for (ArrivalDto arrival : feed.arrivals()) {
                if (!station.stopIds().contains(arrival.stopId())
                        || (!stop.isEmpty() && !stop.equals(arrival.stopId()))
                        || (!route.isEmpty() && !route.equals(arrival.routeId()))) continue;
                unique.put(new ArrivalKey(arrival.tripId(), arrival.startDate(), arrival.routeId(),
                        arrival.stopId(), arrival.stopSequence()), arrival);
            }
        }
        var data = unique.values().stream()
                .filter(arrival -> eventTime(arrival) != null && !eventTime(arrival).isBefore(now))
                .sorted(Comparator.comparing(ArrivalService::eventTime)
                        .thenComparing(ArrivalDto::routeId).thenComparing(ArrivalDto::tripId)
                        .thenComparing(ArrivalDto::stopId)
                        .thenComparing(ArrivalDto::stopSequence, Comparator.nullsFirst(Comparator.naturalOrder())))
                .limit(limit).toList();
        var statuses = feeds.stream().map(feed -> new ArrivalResponse.FeedStatus(feed.feedId(),
                feed.sourceUpdatedAt(), feed.fetchedAt(), feed.cached(),
                feed.refreshFailed() || feed.sourceUpdatedAt().isBefore(now.minus(properties.staleAfter())),
                feed.refreshFailed())).toList();
        return new ArrivalResponse(data, new ArrivalResponse.Metadata(stationId, now, statuses));
    }

    private static Instant eventTime(ArrivalDto arrival) {
        return arrival.arrivalTime() != null ? arrival.arrivalTime() : arrival.departureTime();
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static TransitDataUnavailableException unavailable() {
        return new TransitDataUnavailableException("No realtime feed is configured for this station");
    }

    private record ArrivalKey(String tripId, String startDate, String routeId, String stopId, Integer sequence) {}
}
