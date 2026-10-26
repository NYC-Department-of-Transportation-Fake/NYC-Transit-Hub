package com.nyctransithub.backend.transit.data;

import com.nyctransithub.backend.transit.model.Route;
import com.nyctransithub.backend.transit.model.Station;
import com.nyctransithub.backend.transit.model.Stop;
import java.io.IOException;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/** Loads a prepared static snapshot; no network request is required at startup. */
@Component
public class StaticTransitDataLoader {
    private final JsonMapper json;

    public StaticTransitDataLoader(JsonMapper json) {
        this.json = json;
    }

    public Data load(Resource resource) throws IOException {
        try (var stream = resource.getInputStream()) {
            return json.readValue(stream, Data.class);
        }
    }

    public record Data(List<Station> stations, List<Stop> stops, List<Route> routes) {}
}
