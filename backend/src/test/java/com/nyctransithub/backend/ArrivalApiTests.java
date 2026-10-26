package com.nyctransithub.backend;

import com.nyctransithub.backend.common.TransitDataUnavailableException;
import com.nyctransithub.backend.config.MtaProperties;
import com.nyctransithub.backend.transit.client.MtaArrivalClient;
import com.nyctransithub.backend.transit.data.TransitDataStore;
import com.nyctransithub.backend.transit.dto.ArrivalDto;
import com.nyctransithub.backend.transit.model.ArrivalFeed;
import com.nyctransithub.backend.transit.service.ArrivalService;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "app.transit.data-location=classpath:transit-test.json")
class ArrivalApiTests {
    @LocalServerPort int port;
    @MockitoBean MtaArrivalClient mta;
    @Autowired TransitDataStore store;
    private final HttpClient http = HttpClient.newHttpClient();
    private final JsonMapper json = JsonMapper.builder().build();
    private Instant now;

    @BeforeEach
    void setup() {
        reset(mta);
        now = Instant.now();
    }

    private ArrivalDto prediction(String trip, String route, String stop, int seconds) {
        return new ArrivalDto(trip, "20261026", route, stop, 1, null, null,
                now.plusSeconds(seconds), null);
    }

    private void feed(List<ArrivalDto> data) {
        when(mta.fetchArrivals("gtfs-ace"))
                .thenReturn(new ArrivalFeed("gtfs-ace", now, now, data));
    }

    @Test
    void filtersStopsAndPastEventsDeduplicatesAndSorts() throws Exception {
        var first = prediction("first", "A", "S1N", 600);
        var second = prediction("second", "A", "S1S", 1200);
        feed(List.of(second, first, first, prediction("past", "A", "S1N", -60),
                prediction("elsewhere", "A", "S2N", 300)));
        var body = request("/api/stations/S1/arrivals", 200);
        assertEquals(2, body.get("data").size());
        assertEquals("first", body.get("data").get(0).get("tripId").asText());
        assertEquals("second", body.get("data").get(1).get("tripId").asText());
        assertEquals("S1", body.get("meta").get("stationId").asText());
        assertFalse(body.get("meta").get("feeds").get(0).get("stale").asBoolean());
        verify(mta, times(1)).fetchArrivals("gtfs-ace");
    }

    @Test
    void supportsRouteStopAndLimitFiltersAndDepartureOnly() throws Exception {
        var departure = new ArrivalDto("depart", "20261026", "A", "S1N", 1,
                null, null, null, now.plusSeconds(300));
        feed(List.of(prediction("south", "A", "S1S", 200), departure,
                prediction("north", "A", "S1N", 600), prediction("other-route", "B", "S1N", 100)));
        var body = request("/api/stations/S1/arrivals?routeId=A&stopId=S1N&limit=1", 200);
        assertEquals(1, body.get("data").size());
        var arrival = body.get("data").get(0);
        assertEquals("depart", arrival.get("tripId").asText());
        assertTrue(arrival.get("arrivalTime").isNull());
        assertEquals(now.plusSeconds(300), Instant.parse(arrival.get("departureTime").asText()));
    }

    @Test
    void appliesDefaultLimitAndKeepsServiceDatesDistinct() throws Exception {
        feed(IntStream.range(0, 15).mapToObj(i -> prediction("trip" + i, "A", "S1N", 600 + i)).toList());
        assertEquals(10, request("/api/stations/S1/arrivals", 200).get("data").size());
        var today = prediction("same-trip", "A", "S1N", 600);
        var tomorrow = new ArrivalDto(today.tripId(), "20261027", "A", "S1N", 1,
                null, null, now.plusSeconds(86400), null);
        feed(List.of(today, tomorrow));
        assertEquals(2, request("/api/stations/S1/arrivals", 200).get("data").size());
    }

    @Test
    void rejectsBadFiltersBeforeCallingMta() throws Exception {
        for (String query : List.of("limit=0", "limit=101", "limit=abc", "stopId=S2N", "routeId=B")) {
            assertEquals("BAD_REQUEST", request("/api/stations/S1/arrivals?" + query, 400).get("code").asText());
        }
        assertEquals("STATION_NOT_FOUND", request("/api/stations/missing/arrivals", 404).get("code").asText());
        assertEquals("ROUTE_NOT_FOUND", request("/api/stations/S1/arrivals?routeId=missing", 404).get("code").asText());
        verifyNoInteractions(mta);
    }

    @Test
    void distinguishesEmptyFeedFromUnavailableFeed() throws Exception {
        feed(List.of());
        assertEquals(0, request("/api/stations/S1/arrivals", 200).get("data").size());
        when(mta.fetchArrivals("gtfs-ace")).thenThrow(new TransitDataUnavailableException("private upstream detail"));
        var error = request("/api/stations/S1/arrivals", 503);
        assertEquals("TRANSIT_DATA_UNAVAILABLE", error.get("code").asText());
        assertFalse(error.toString().contains("private upstream detail"));
    }

    @Test
    void exposesSourceFreshness() throws Exception {
        when(mta.fetchArrivals("gtfs-ace"))
                .thenReturn(new ArrivalFeed("gtfs-ace", now.minusSeconds(600), now, List.of()));
        var status = request("/api/stations/S1/arrivals", 200).get("meta").get("feeds").get(0);
        assertTrue(status.get("stale").asBoolean());
        assertEquals(now.minusSeconds(600), Instant.parse(status.get("sourceUpdatedAt").asText()));
    }

    @Test
    void exposesCacheFallbackWithoutChangingOriginalTimestamps() throws Exception {
        when(mta.fetchArrivals("gtfs-ace")).thenReturn(new ArrivalFeed("gtfs-ace",
                now.minusSeconds(60), now.minusSeconds(45), List.of(), true, true));
        var status = request("/api/stations/S1/arrivals", 200).get("meta").get("feeds").get(0);
        assertTrue(status.get("cached").asBoolean());
        assertTrue(status.get("refreshFailed").asBoolean());
        assertTrue(status.get("stale").asBoolean());
        assertEquals(now.minusSeconds(45), Instant.parse(status.get("fetchedAt").asText()));
    }

    @Test
    void requiredFeedsMustAllSucceedAndNewerFeedWinsDuplicates() {
        var properties = new MtaProperties("", Duration.ofSeconds(1), Duration.ofMinutes(5),
                Map.of("one", List.of("A"), "two", List.of("A")));
        var service = new ArrivalService(store, mta, properties);
        when(mta.fetchArrivals("one")).thenReturn(new ArrivalFeed("one", now.minusSeconds(30), now,
                List.of(prediction("trip", "A", "S1N", 600))));
        when(mta.fetchArrivals("two")).thenReturn(new ArrivalFeed("two", now, now,
                List.of(prediction("trip", "A", "S1N", 900))));
        var result = service.getArrivals("S1", null, null, 10);
        assertEquals(1, result.data().size());
        assertEquals(now.plusSeconds(900), result.data().get(0).arrivalTime());
        when(mta.fetchArrivals("two")).thenThrow(new TransitDataUnavailableException("unavailable"));
        assertThrows(TransitDataUnavailableException.class, () -> service.getArrivals("S1", null, null, 10));
    }

    private JsonNode request(String path, int expectedStatus) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build();
        var response = http.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(expectedStatus, response.statusCode(), response.body());
        return json.readTree(response.body());
    }
}
