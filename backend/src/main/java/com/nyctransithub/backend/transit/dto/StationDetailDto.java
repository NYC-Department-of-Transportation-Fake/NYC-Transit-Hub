package com.nyctransithub.backend.transit.dto;

import com.nyctransithub.backend.transit.model.Stop;
import java.util.List;

public record StationDetailDto(
        String id, String name, double latitude, double longitude,
        List<String> routeIds, List<Stop> stops) {}
