package com.nyctransithub.backend.transit.controller;

import com.nyctransithub.backend.common.ApiResponse;
import com.nyctransithub.backend.common.ListResponse;
import com.nyctransithub.backend.transit.model.Route;
import com.nyctransithub.backend.transit.model.Station;
import com.nyctransithub.backend.transit.service.RouteService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/routes")
public class RouteController {
    private final RouteService routes;

    public RouteController(RouteService routes) {
        this.routes = routes;
    }

    @GetMapping
    public ListResponse<Route> list() {
        return new ListResponse<>(routes.getRoutes());
    }

    @GetMapping("/{routeId}")
    public ApiResponse<Route> get(@PathVariable String routeId) {
        return new ApiResponse<>(routes.getRoute(routeId));
    }

    @GetMapping("/{routeId}/stations")
    public ListResponse<Station> stations(@PathVariable String routeId) {
        return new ListResponse<>(routes.getStationsByRoute(routeId));
    }
}
