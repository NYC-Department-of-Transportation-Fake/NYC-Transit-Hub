package com.nyctransithub.backend.transit.client;

import com.google.transit.realtime.GtfsRealtime;
import com.nyctransithub.backend.common.TransitDataUnavailableException;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.time.Duration;
import java.time.Instant;
import java.time.Clock;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MtaArrivalClientTests {
    private static final Instant FETCHED = Instant.ofEpochSecond(2_000);
    private final MtaArrivalClient client = client("http://localhost/", Duration.ofSeconds(1));

    private MtaArrivalClient client(String baseUrl, Duration timeout) {
        return new MtaArrivalClient(baseUrl, timeout, Duration.ofSeconds(30), Duration.ofMinutes(10),
                Duration.ofSeconds(10), Clock.fixed(Instant.ofEpochSecond(1050), ZoneOffset.UTC));
    }

    private GtfsRealtime.FeedMessage.Builder feed() {
        return GtfsRealtime.FeedMessage.newBuilder().setHeader(GtfsRealtime.FeedHeader.newBuilder()
                .setGtfsRealtimeVersion("2.0").setTimestamp(1_000));
    }

    private GtfsRealtime.TripUpdate.StopTimeUpdate.Builder stop(String id, long time) {
        return GtfsRealtime.TripUpdate.StopTimeUpdate.newBuilder().setStopId(id).setStopSequence(3)
                .setArrival(GtfsRealtime.TripUpdate.StopTimeEvent.newBuilder().setTime(time));
    }

    private GtfsRealtime.FeedEntity.Builder trip(String entityId,
            GtfsRealtime.TripDescriptor.ScheduleRelationship relationship,
            GtfsRealtime.TripUpdate.StopTimeUpdate.Builder... stops) {
        var update = GtfsRealtime.TripUpdate.newBuilder().setTrip(GtfsRealtime.TripDescriptor.newBuilder()
                .setTripId("T1").setRouteId("6X").setStartDate("20261026").setScheduleRelationship(relationship));
        for (var stop : stops) update.addStopTimeUpdate(stop);
        return GtfsRealtime.FeedEntity.newBuilder().setId(entityId).setTripUpdate(update);
    }

    @Test
    void parsesAbsoluteTimesAndPreservesSourceIdsAndFeedTimes() {
        var message = feed().addEntity(trip("1", GtfsRealtime.TripDescriptor.ScheduleRelationship.SCHEDULED,
                stop("S1N", 1_100).setDeparture(GtfsRealtime.TripUpdate.StopTimeEvent.newBuilder().setTime(1_120))));
        var result = client.parseFeed("gtfs", message.build().toByteArray(), FETCHED);
        assertEquals("gtfs", result.feedId());
        assertEquals(Instant.ofEpochSecond(1_000), result.sourceUpdatedAt());
        assertEquals(FETCHED, result.fetchedAt());
        var arrival = result.arrivals().getFirst();
        assertEquals("T1", arrival.tripId());
        assertEquals("6X", arrival.routeId());
        assertEquals("20261026", arrival.startDate());
        assertEquals("S1N", arrival.stopId());
        assertEquals(3, arrival.stopSequence());
        assertEquals(Instant.ofEpochSecond(1_100), arrival.arrivalTime());
        assertEquals(Instant.ofEpochSecond(1_120), arrival.departureTime());
        assertNull(arrival.directionLabel());
        assertNull(arrival.destination());
        assertThrows(UnsupportedOperationException.class, () -> result.arrivals().clear());
    }

    @Test
    void excludesCanceledDeletedSkippedAndNoDataRecords() {
        var message = feed()
                .addEntity(trip("canceled", GtfsRealtime.TripDescriptor.ScheduleRelationship.CANCELED, stop("S1N", 1_100)))
                .addEntity(trip("deletedTrip", GtfsRealtime.TripDescriptor.ScheduleRelationship.DELETED, stop("S1N", 1_100)))
                .addEntity(trip("deletedEntity", GtfsRealtime.TripDescriptor.ScheduleRelationship.SCHEDULED,
                        stop("S1N", 1_100)).setIsDeleted(true))
                .addEntity(trip("stops", GtfsRealtime.TripDescriptor.ScheduleRelationship.SCHEDULED,
                        stop("S1N", 1_100).setScheduleRelationship(GtfsRealtime.TripUpdate.StopTimeUpdate.ScheduleRelationship.SKIPPED),
                        stop("S1S", 1_100).setScheduleRelationship(GtfsRealtime.TripUpdate.StopTimeUpdate.ScheduleRelationship.NO_DATA)));
        assertTrue(client.parseFeed("gtfs", message.build().toByteArray(), FETCHED).arrivals().isEmpty());
    }

    @Test
    void ignoresDelayOnlyButPreservesDepartureOnlyPrediction() {
        var message = feed().addEntity(trip("1", GtfsRealtime.TripDescriptor.ScheduleRelationship.SCHEDULED,
                stop("S1N", 0).setArrival(GtfsRealtime.TripUpdate.StopTimeEvent.newBuilder().setDelay(60)),
                stop("S1S", 0).clearArrival().setDeparture(GtfsRealtime.TripUpdate.StopTimeEvent.newBuilder().setTime(1_200))));
        var result = client.parseFeed("gtfs", message.build().toByteArray(), FETCHED);
        assertEquals(1, result.arrivals().size());
        assertEquals("S1S", result.arrivals().getFirst().stopId());
        assertNull(result.arrivals().getFirst().arrivalTime());
        assertEquals(Instant.ofEpochSecond(1_200), result.arrivals().getFirst().departureTime());
    }

    @Test
    void permitsValidEmptyFeedAndSkipsMissingIdentifiers() {
        assertTrue(client.parseFeed("gtfs", feed().build().toByteArray(), FETCHED).arrivals().isEmpty());
        var entity = trip("1", GtfsRealtime.TripDescriptor.ScheduleRelationship.SCHEDULED, stop("", 1_100));
        assertTrue(client.parseFeed("gtfs", feed().addEntity(entity).build().toByteArray(), FETCHED).arrivals().isEmpty());
        entity.getTripUpdateBuilder().getTripBuilder().clearRouteId();
        assertTrue(client.parseFeed("gtfs", feed().addEntity(entity).build().toByteArray(), FETCHED).arrivals().isEmpty());
    }

    @Test
    void rejectsMalformedPayloadAndUnsupportedHeaders() {
        assertThrows(TransitDataUnavailableException.class, () -> client.parseFeed("gtfs", new byte[]{1, 2, 3}, FETCHED));
        var noTimestamp = feed();
        noTimestamp.getHeaderBuilder().clearTimestamp();
        assertThrows(TransitDataUnavailableException.class,
                () -> client.parseFeed("gtfs", noTimestamp.build().toByteArray(), FETCHED));
        var differential = feed();
        differential.getHeaderBuilder().setIncrementality(GtfsRealtime.FeedHeader.Incrementality.DIFFERENTIAL);
        assertThrows(TransitDataUnavailableException.class,
                () -> client.parseFeed("gtfs", differential.build().toByteArray(), FETCHED));
        var invalidTime = feed();
        invalidTime.getHeaderBuilder().setTimestamp(Long.MAX_VALUE);
        assertThrows(TransitDataUnavailableException.class,
                () -> client.parseFeed("gtfs", invalidTime.build().toByteArray(), FETCHED));
        var unknownVersion = feed();
        unknownVersion.getHeaderBuilder().setGtfsRealtimeVersion("unknown");
        assertThrows(TransitDataUnavailableException.class,
                () -> client.parseFeed("gtfs", unknownVersion.build().toByteArray(), FETCHED));
    }

    @Test
    void fetchesBinaryFeedAndRejectsHttpFailure() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        byte[] payload = feed().build().toByteArray();
        server.createContext("/gtfs", exchange -> {
            exchange.sendResponseHeaders(200, payload.length);
            try (var body = exchange.getResponseBody()) { body.write(payload); }
        });
        server.createContext("/failed", exchange -> {
            exchange.sendResponseHeaders(503, -1);
            exchange.close();
        });
        server.start();
        try {
            var live = client("http://127.0.0.1:" + server.getAddress().getPort() + "/", Duration.ofSeconds(2));
            assertTrue(live.fetchArrivals("gtfs").arrivals().isEmpty());
            assertThrows(TransitDataUnavailableException.class, () -> live.fetchArrivals("failed"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void requestTimeoutBecomesDataUnavailable() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/slow", exchange -> {
            try { Thread.sleep(300); }
            catch (InterruptedException ex) { Thread.currentThread().interrupt(); }
            finally { exchange.close(); }
        });
        server.start();
        try {
            var live = client("http://127.0.0.1:" + server.getAddress().getPort() + "/", Duration.ofMillis(50));
            assertThrows(TransitDataUnavailableException.class, () -> live.fetchArrivals("slow"));
        } finally {
            server.stop(0);
        }
    }
}
