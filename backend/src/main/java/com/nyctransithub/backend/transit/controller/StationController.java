package com.nyctransithub.backend.transit.controller;

import com.nyctransithub.backend.common.ApiResponse;
import com.nyctransithub.backend.common.ListResponse;
import com.nyctransithub.backend.transit.dto.StationDetailDto;
import com.nyctransithub.backend.transit.model.Station;
import com.nyctransithub.backend.transit.service.StationService;
import com.nyctransithub.backend.transit.service.ArrivalService;
import com.nyctransithub.backend.transit.dto.ArrivalResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stations")
public class StationController {
    private final StationService stations;
    private final ArrivalService arrivals;

    public StationController(StationService stations, ArrivalService arrivals) {
        this.stations = stations;
        this.arrivals = arrivals;
    }

    @GetMapping
    public ListResponse<Station> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String routeId) {
        return new ListResponse<>(stations.searchStations(query, routeId));
    }

    @GetMapping("/{stationId}")
    public ApiResponse<StationDetailDto> get(@PathVariable String stationId) {
        return new ApiResponse<>(stations.getStation(stationId));
    }

    @GetMapping("/{stationId}/arrivals")
    public ArrivalResponse arrivals(@PathVariable String stationId,
            @RequestParam(required = false) String routeId,
            @RequestParam(required = false) String stopId,
            @RequestParam(defaultValue = "10") int limit) {
        return arrivals.getArrivals(stationId, routeId, stopId, limit);
    }
}
