package com.nyctransithub.backend.transit.data;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.*;

class TransitDataStoreTests {
    private final StaticTransitDataLoader loader = new StaticTransitDataLoader(JsonMapper.builder().build());

    private String fixture() throws Exception {
        return new ClassPathResource("transit-test.json").getContentAsString(StandardCharsets.UTF_8);
    }

    private TransitDataStore load(String text) throws Exception {
        return new TransitDataStore(loader, new ByteArrayResource(text.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void keepsSameNamedStationsSeparateAndExposesImmutableData() throws Exception {
        var store = load(fixture());
        assertEquals(3, store.stations().size());
        assertEquals("Central", store.station("S1").name());
        assertEquals("Central", store.station("S2").name());
        assertEquals("S1", store.stop("S1N").stationId());
        assertThrows(UnsupportedOperationException.class, () -> store.stations().clear());
        assertThrows(UnsupportedOperationException.class, () -> store.station("S1").stopIds().clear());
    }

    @Test
    void rejectsDuplicateIds() throws Exception {
        String bad = fixture().replace("\"id\":\"S2\"", "\"id\":\"S1\"");
        assertThrows(IllegalArgumentException.class, () -> load(bad));
    }

    @Test
    void rejectsUnknownRouteAndMismatchedStopParent() throws Exception {
        String badRoute = fixture().replace("\"routeIds\":[\"A\"]", "\"routeIds\":[\"MISSING\"]");
        assertThrows(IllegalArgumentException.class, () -> load(badRoute));
        String badStop = fixture().replace("\"stationId\":\"S1\"", "\"stationId\":\"S2\"");
        assertThrows(IllegalArgumentException.class, () -> load(badStop));
    }

    @Test
    void rejectsInvalidCoordinates() throws Exception {
        String bad = fixture().replace("40.70", "140.70");
        assertThrows(IllegalArgumentException.class, () -> load(bad));
    }

    @Test
    void missingAndMalformedFilesFailInsteadOfProducingEmptyData() {
        assertThrows(Exception.class, () -> new TransitDataStore(loader, new ClassPathResource("missing.json")));
        assertThrows(Exception.class, () -> load("{broken"));
        assertThrows(IllegalArgumentException.class, () -> load("{\"stations\":[],\"stops\":[],\"routes\":[]}"));
    }
}
