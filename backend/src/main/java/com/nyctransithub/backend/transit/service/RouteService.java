package com.nyctransithub.backend.transit.service;

import com.nyctransithub.backend.common.ResourceNotFoundException;
import com.nyctransithub.backend.transit.data.TransitDataStore;
import com.nyctransithub.backend.transit.model.Route;
import com.nyctransithub.backend.transit.model.Station;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RouteService {
    private final TransitDataStore store;

    public RouteService(TransitDataStore store) {
        this.store = store;
    }

    public List<Route> getRoutes() {
        return store.routes().stream()
                .sorted(Comparator.comparing(Route::shortName).thenComparing(Route::id))
                .toList();
    }

    public Route getRoute(String routeId) {
        Route route = store.route(routeId);
        if (route == null) {
            throw new ResourceNotFoundException("ROUTE_NOT_FOUND", "Route does not exist.");
        }
        return route;
    }

    /** Static service coverage sorted by station name, not a train's stop sequence. */
    public List<Station> getStationsByRoute(String routeId) {
        getRoute(routeId);
        return store.stations().stream()
                .filter(station -> station.routeIds().contains(routeId))
                .sorted(Comparator.comparing(Station::name).thenComparing(Station::id))
                .toList();
    }
}
