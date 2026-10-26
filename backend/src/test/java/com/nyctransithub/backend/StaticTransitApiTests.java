package com.nyctransithub.backend;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "app.transit.data-location=classpath:transit-test.json")
class StaticTransitApiTests {
    @LocalServerPort
    private int port;

    private final HttpClient client = HttpClient.newHttpClient();
    private final JsonMapper json = JsonMapper.builder().build();

    @Test
    void listsDistinctStationsInStableOrder() throws Exception {
        JsonNode body = getData("/api/stations");
        assertEquals(3, body.get("total").asInt());
        assertEquals("S1", body.get("data").get(0).get("id").asText());
        assertEquals("S2", body.get("data").get(1).get("id").asText());
        assertEquals("S3", body.get("data").get(2).get("id").asText());
    }

    @Test
    void searchesCaseInsensitivelyAndTrimsFilters() throws Exception {
        JsonNode byName = getData("/api/stations?query=%20cEnTrAl%20");
        assertEquals(2, byName.get("total").asInt());
        JsonNode intersection = getData("/api/stations?query=%20CENTRAL%20&routeId=%20B%20");
        assertEquals(1, intersection.get("total").asInt());
        assertEquals("S2", intersection.get("data").get(0).get("id").asText());
        assertEquals(3, getData("/api/stations?query=%20&routeId=%20").get("total").asInt());
    }

    @Test
    void returnsEmptyListWhenValidFiltersDoNotMatch() throws Exception {
        JsonNode body = getData("/api/stations?query=Park&routeId=A");
        assertEquals(0, body.get("total").asInt());
        assertEquals(0, body.get("data").size());
    }

    @Test
    void stationDetailsPreserveStopIdsAndOwnership() throws Exception {
        JsonNode station = getData("/api/stations/S1").get("data");
        assertEquals("Central", station.get("name").asText());
        assertEquals(40.70, station.get("latitude").asDouble());
        assertEquals("A", station.get("routeIds").get(0).asText());
        assertEquals(2, station.get("stops").size());
        assertEquals("S1N", station.get("stops").get(0).get("id").asText());
        assertEquals("S1", station.get("stops").get(0).get("stationId").asText());
        assertEquals("Downtown", station.get("stops").get(1).get("directionLabel").asText());
        assertTrue(getData("/api/stations/S2").get("data").get("stops")
                .get(0).get("directionLabel").isNull());
    }

    @Test
    void listsRoutesAndRouteDetails() throws Exception {
        JsonNode routes = getData("/api/routes");
        assertEquals(2, routes.get("total").asInt());
        assertEquals("A", routes.get("data").get(0).get("id").asText());
        JsonNode route = getData("/api/routes/B").get("data");
        assertEquals("B", route.get("id").asText());
        assertEquals("FF6319", route.get("color").asText());
    }

    @Test
    void routeStationsAreServiceCoverageSortedByName() throws Exception {
        JsonNode body = getData("/api/routes/B/stations");
        assertEquals(2, body.get("total").asInt());
        assertEquals("S2", body.get("data").get(0).get("id").asText());
        assertEquals("S3", body.get("data").get(1).get("id").asText());
    }

    @Test
    void unknownStationAndRoutesReturnConsistent404() throws Exception {
        assertNotFound("/api/stations/missing", "STATION_NOT_FOUND");
        assertNotFound("/api/routes/missing", "ROUTE_NOT_FOUND");
        assertNotFound("/api/routes/missing/stations", "ROUTE_NOT_FOUND");
        assertNotFound("/api/stations?routeId=missing", "ROUTE_NOT_FOUND");
        // Route identifiers are case-sensitive source IDs.
        assertNotFound("/api/stations?routeId=a", "ROUTE_NOT_FOUND");
    }

    private JsonNode getData(String path) throws Exception {
        HttpResponse<String> response = get(path);
        assertEquals(200, response.statusCode(), response.body());
        return json.readTree(response.body());
    }

    private void assertNotFound(String path, String code) throws Exception {
        HttpResponse<String> response = get(path);
        assertEquals(404, response.statusCode(), response.body());
        assertTrue(response.headers().firstValue("Content-Type").orElse("").contains("application/json"));
        JsonNode body = json.readTree(response.body());
        assertEquals(code, body.get("code").asText());
        assertEquals(path.split("\\?")[0], body.get("path").asText());
        assertFalse(body.get("message").asText().isBlank());
        assertDoesNotThrow(() -> Instant.parse(body.get("timestamp").asText()));
    }

    private HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
