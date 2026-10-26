package com.nyctransithub.backend.transit.data;

import com.nyctransithub.backend.transit.model.Route;
import com.nyctransithub.backend.transit.model.Station;
import com.nyctransithub.backend.transit.model.Stop;
import java.io.IOException;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

/** Validates the entire snapshot before publishing immutable lookup maps. */
@Component
public class TransitDataStore {
    private final Map<String, Station> stations;
    private final Map<String, Stop> stops;
    private final Map<String, Route> routes;

    public TransitDataStore(StaticTransitDataLoader loader,
            @Value("${app.transit.data-location}") Resource resource) throws IOException {
        var data = loader.load(resource);
        var stationMap = index(data.stations(), Station::id);
        var stopMap = index(data.stops(), Stop::id);
        var routeMap = index(data.routes(), Route::id);
        for (Station station : stationMap.values()) {
            require(station.name() != null && !station.name().isBlank(), "Missing station name");
            require(Double.isFinite(station.latitude()) && Math.abs(station.latitude()) <= 90
                    && Double.isFinite(station.longitude()) && Math.abs(station.longitude()) <= 180,
                    "Invalid coordinates for " + station.id());
            require(new HashSet<>(station.routeIds()).size() == station.routeIds().size()
                    && new HashSet<>(station.stopIds()).size() == station.stopIds().size(),
                    "Duplicate station references: " + station.id());
            require(!station.stopIds().isEmpty(), "Station has no stops: " + station.id());
            for (String routeId : station.routeIds()) {
                require(routeMap.containsKey(routeId), "Unknown route: " + routeId);
            }
            for (String stopId : station.stopIds()) {
                Stop stop = stopMap.get(stopId);
                require(stop != null && station.id().equals(stop.stationId()),
                        "Invalid station/stop mapping: " + stopId);
            }
        }
        for (Stop stop : stopMap.values()) {
            Station parent = stationMap.get(stop.stationId());
            require(parent != null && parent.stopIds().contains(stop.id()),
                    "Invalid parent station for stop: " + stop.id());
        }
        for (Route route : routeMap.values()) {
            require(route.shortName() != null && !route.shortName().isBlank(), "Missing route name");
        }
        stations = Map.copyOf(stationMap);
        stops = Map.copyOf(stopMap);
        routes = Map.copyOf(routeMap);
        LoggerFactory.getLogger(TransitDataStore.class).info(
                "Loaded static transit data: {} stations, {} stops, {} routes",
                stations.size(), stops.size(), routes.size());
    }

    public Collection<Station> stations() { return stations.values(); }
    public Collection<Route> routes() { return routes.values(); }
    public Station station(String id) { return stations.get(id); }
    public Route route(String id) { return routes.get(id); }
    public Stop stop(String id) { return stops.get(id); }

    private static <T> Map<String, T> index(List<T> items, Function<T, String> idOf) {
        require(items != null && !items.isEmpty(), "Missing or empty static data collection");
        Map<String, T> result = new HashMap<>();
        for (T item : items) {
            require(item != null, "Null static data record");
            String id = idOf.apply(item);
            require(id != null && !id.isBlank(), "Missing static data ID");
            require(result.putIfAbsent(id, item) == null, "Duplicate static data ID: " + id);
        }
        return result;
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalArgumentException(message);
    }
}
