package com.nyctransithub.backend.transit.client;

import com.google.transit.realtime.GtfsRealtime;
import com.nyctransithub.backend.common.TransitDataUnavailableException;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MtaArrivalCacheTests {
    private final MutableClock clock = new MutableClock();
    private final AtomicInteger requests = new AtomicInteger();
    private final AtomicInteger status = new AtomicInteger(200);
    private final AtomicReference<byte[]> payload = new AtomicReference<>();
    private final CountDownLatch entered = new CountDownLatch(1);
    private final CountDownLatch release = new CountDownLatch(1);
    private final ExecutorService workers = Executors.newCachedThreadPool();
    private volatile String blockedPath = "";
    private HttpServer server;
    private MtaArrivalClient client;

    @BeforeEach
    void setup() throws Exception {
        payload.set(feed(clock.instant()));
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.setExecutor(workers);
        server.createContext("/", exchange -> {
            requests.incrementAndGet();
            if (exchange.getRequestURI().getPath().equals(blockedPath)) {
                entered.countDown();
                try {
                    if (!release.await(5, TimeUnit.SECONDS)) throw new AssertionError("Request was not released");
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    exchange.close();
                    return;
                }
            }
            byte[] bytes = payload.get();
            exchange.sendResponseHeaders(status.get(), bytes.length);
            try (var body = exchange.getResponseBody()) { body.write(bytes); }
        });
        server.start();
        client = new MtaArrivalClient("http://127.0.0.1:" + server.getAddress().getPort() + "/",
                Duration.ofSeconds(5), Duration.ofSeconds(30), Duration.ofMinutes(10),
                Duration.ofSeconds(10), clock);
    }

    @AfterEach
    void cleanup() {
        release.countDown();
        if (server != null) server.stop(0);
        workers.shutdownNow();
    }

    @Test
    void reusesCacheUntilTtlThenRefreshes() {
        var first = client.fetchArrivals("gtfs");
        assertFalse(first.cached());
        assertFalse(first.refreshFailed());
        clock.advance(29);
        var cached = client.fetchArrivals("gtfs");
        assertTrue(cached.cached());
        assertFalse(cached.refreshFailed());
        assertEquals(first.fetchedAt(), cached.fetchedAt());
        assertEquals(1, requests.get());
        clock.advance(1);
        payload.set(feed(clock.instant()));
        var refreshed = client.fetchArrivals("gtfs");
        assertFalse(refreshed.cached());
        assertEquals(clock.instant(), refreshed.fetchedAt());
        assertEquals(2, requests.get());
    }

    @Test
    void failedRefreshPreservesDataAndBacksOffBeforeRecovery() {
        var first = client.fetchArrivals("gtfs");
        clock.advance(30);
        status.set(503);
        var fallback = client.fetchArrivals("gtfs");
        assertTrue(fallback.cached());
        assertTrue(fallback.refreshFailed());
        assertEquals(first.sourceUpdatedAt(), fallback.sourceUpdatedAt());
        assertEquals(first.fetchedAt(), fallback.fetchedAt());
        clock.advance(9);
        assertTrue(client.fetchArrivals("gtfs").refreshFailed());
        assertEquals(2, requests.get());
        clock.advance(1);
        status.set(200);
        payload.set(feed(clock.instant()));
        var recovered = client.fetchArrivals("gtfs");
        assertFalse(recovered.cached());
        assertFalse(recovered.refreshFailed());
        assertEquals(clock.instant(), recovered.fetchedAt());
        assertEquals(3, requests.get());
    }

    @Test
    void coldFailuresAlsoBackOff() {
        status.set(503);
        assertThrows(TransitDataUnavailableException.class, () -> client.fetchArrivals("gtfs"));
        clock.advance(9);
        assertThrows(TransitDataUnavailableException.class, () -> client.fetchArrivals("gtfs"));
        assertEquals(1, requests.get());
        clock.advance(1);
        assertThrows(TransitDataUnavailableException.class, () -> client.fetchArrivals("gtfs"));
        assertEquals(2, requests.get());
    }

    @Test
    void refusesOldSourceEvenWhenJustDownloaded() {
        payload.set(feed(clock.instant().minusSeconds(601)));
        assertThrows(TransitDataUnavailableException.class, () -> client.fetchArrivals("gtfs"));
    }

    @Test
    void sourceAgeLimitAppliesEvenBeforeCacheTtlExpires() {
        payload.set(feed(clock.instant().minusSeconds(590)));
        assertFalse(client.fetchArrivals("gtfs").cached());
        clock.advance(20);
        assertThrows(TransitDataUnavailableException.class, () -> client.fetchArrivals("gtfs"));
    }

    @Test
    void refusesExpiredFallbackAfterMaximumAge() {
        client.fetchArrivals("gtfs");
        clock.advance(601);
        status.set(503);
        assertThrows(TransitDataUnavailableException.class, () -> client.fetchArrivals("gtfs"));
        assertEquals(2, requests.get());
    }

    @Test
    void malformedAndRegressedRefreshesCannotReplaceGoodCache() {
        var first = client.fetchArrivals("gtfs");
        clock.advance(30);
        payload.set(new byte[]{1, 2, 3});
        var malformed = client.fetchArrivals("gtfs");
        assertTrue(malformed.refreshFailed());
        assertEquals(first.sourceUpdatedAt(), malformed.sourceUpdatedAt());
        clock.advance(10);
        payload.set(feed(first.sourceUpdatedAt().minusSeconds(10)));
        var regressed = client.fetchArrivals("gtfs");
        assertTrue(regressed.refreshFailed());
        assertEquals(first.sourceUpdatedAt(), regressed.sourceUpdatedAt());
        assertEquals(first.fetchedAt(), regressed.fetchedAt());
    }

    @Test
    void simultaneousRequestsForOneFeedShareOneDownload() throws Exception {
        blockedPath = "/gtfs";
        var start = new CountDownLatch(1);
        var ready = new CountDownLatch(8);
        var futures = new ArrayList<java.util.concurrent.Future<Boolean>>();
        for (int i = 0; i < 8; i++) {
            futures.add(workers.submit(() -> {
                ready.countDown();
                assertTrue(start.await(5, TimeUnit.SECONDS));
                return client.fetchArrivals("gtfs").cached();
            }));
        }
        assertTrue(ready.await(5, TimeUnit.SECONDS));
        start.countDown();
        assertTrue(entered.await(5, TimeUnit.SECONDS));
        release.countDown();
        int cacheHits = 0;
        for (var future : futures) if (future.get(5, TimeUnit.SECONDS)) cacheHits++;
        assertEquals(1, requests.get());
        assertEquals(7, cacheHits);
    }

    @Test
    void differentFeedsDoNotBlockEachOther() throws Exception {
        blockedPath = "/gtfs";
        var first = workers.submit(() -> client.fetchArrivals("gtfs"));
        assertTrue(entered.await(5, TimeUnit.SECONDS));
        var second = workers.submit(() -> client.fetchArrivals("gtfs-ace"));
        assertEquals("gtfs-ace", second.get(3, TimeUnit.SECONDS).feedId());
        assertFalse(first.isDone());
        release.countDown();
        assertEquals("gtfs", first.get(5, TimeUnit.SECONDS).feedId());
        assertEquals(2, requests.get());
    }

    private static byte[] feed(Instant timestamp) {
        return GtfsRealtime.FeedMessage.newBuilder().setHeader(GtfsRealtime.FeedHeader.newBuilder()
                .setGtfsRealtimeVersion("2.0").setTimestamp(timestamp.getEpochSecond())).build().toByteArray();
    }

    private static final class MutableClock extends Clock {
        private final AtomicReference<Instant> now = new AtomicReference<>(Instant.parse("2026-10-26T08:00:00Z"));
        void advance(long seconds) { now.updateAndGet(value -> value.plusSeconds(seconds)); }
        @Override public Instant instant() { return now.get(); }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(instant(), zone); }
    }
}
