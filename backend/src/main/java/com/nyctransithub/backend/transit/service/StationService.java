package com.nyctransithub.backend.transit.service;

import com.nyctransithub.backend.common.ResourceNotFoundException;
import com.nyctransithub.backend.transit.data.TransitDataStore;
import com.nyctransithub.backend.transit.dto.StationDetailDto;
import com.nyctransithub.backend.transit.model.Station;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class StationService {
    private final TransitDataStore store;
    private final RouteService routes;

    public StationService(TransitDataStore store, RouteService routes) {
        this.store = store;
        this.routes = routes;
    }

    public List<Station> searchStations(String query, String routeId) {
        String nameFilter = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String routeFilter = routeId == null ? "" : routeId.trim();
        if (!routeFilter.isEmpty()) {
            routes.getRoute(routeFilter);
        }
        return store.stations().stream()
                .filter(station -> station.name().toLowerCase(Locale.ROOT).contains(nameFilter))
                .filter(station -> routeFilter.isEmpty() || station.routeIds().contains(routeFilter))
                .sorted(Comparator.comparing(Station::name).thenComparing(Station::id))
                .toList();
    }

    public StationDetailDto getStation(String stationId) {
        Station station = store.station(stationId);
        if (station == null) {
            throw new ResourceNotFoundException("STATION_NOT_FOUND", "Station does not exist.");
        }
        return new StationDetailDto(station.id(), station.name(), station.latitude(), station.longitude(),
                station.routeIds(), station.stopIds().stream().map(store::stop).toList());
    }
}
