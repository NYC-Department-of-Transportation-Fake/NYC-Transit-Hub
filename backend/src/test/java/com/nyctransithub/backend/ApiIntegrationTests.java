package com.nyctransithub.backend;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(ApiIntegrationTests.TestEndpoints.class)
class ApiIntegrationTests {

    @LocalServerPort
    private int port;

    private final HttpClient client = HttpClient.newHttpClient();
    private final JsonMapper json = JsonMapper.builder().build();

    @Test
    void healthReturnsStatusAndTimestamp() throws Exception {
        var response = get("/api/health");
        assertEquals(200, response.statusCode());
        var body = json.readTree(response.body());
        assertEquals("UP", body.get("status").asText());
        assertDoesNotThrow(() -> Instant.parse(body.get("serverTime").asText()));
    }

    @Test
    void missingEndpointReturnsJson404() throws Exception {
        assertError(get("/api/missing"), 404, "NOT_FOUND", "/api/missing");
    }

    @Test
    void invalidParameterReturnsJson400() throws Exception {
        assertError(get("/api/test/parameter?number=abc"), 400,
                "BAD_REQUEST", "/api/test/parameter");
    }

    @Test
    void unsupportedMethodPreservesAllowHeader() throws Exception {
        var response = client.send(request("/api/health")
                .POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        assertError(response, 405, "METHOD_NOT_ALLOWED", "/api/health");
        assertTrue(response.headers().firstValue("Allow").orElse("").contains("GET"));
    }

    @Test
    void unexpectedErrorHidesInternalDetails() throws Exception {
        var response = get("/api/test/failure");
        assertError(response, 500, "INTERNAL_ERROR", "/api/test/failure");
        assertFalse(response.body().contains("internal-secret"));
    }

    @Test
    void allowsConfiguredFrontendOrigin() throws Exception {
        var response = client.send(request("/api/health")
                .header("Origin", "http://localhost:5173").GET().build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());
        assertEquals("http://localhost:5173",
                response.headers().firstValue("Access-Control-Allow-Origin").orElseThrow());
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
    }

    private HttpResponse<String> get(String path) throws Exception {
        return client.send(request(path).GET().build(), HttpResponse.BodyHandlers.ofString());
    }

    private void assertError(HttpResponse<String> response, int status, String code, String path) {
        assertEquals(status, response.statusCode());
        assertTrue(response.headers().firstValue("Content-Type").orElse("").contains("application/json"));
        JsonNode body = json.readTree(response.body());
        assertEquals(code, body.get("code").asText());
        assertEquals(path, body.get("path").asText());
        assertFalse(body.get("message").asText().isBlank());
        assertDoesNotThrow(() -> Instant.parse(body.get("timestamp").asText()));
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestEndpoints {
        @Bean
        FailureController failureController() {
            return new FailureController();
        }
    }

    @RestController
    static class FailureController {
        @GetMapping("/api/test/failure")
        String fail() {
            throw new IllegalStateException("internal-secret");
        }

        @GetMapping("/api/test/parameter")
        int parameter(@RequestParam int number) {
            return number;
        }
    }
}
