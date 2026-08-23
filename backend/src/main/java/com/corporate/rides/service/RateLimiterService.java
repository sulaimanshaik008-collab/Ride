package com.corporate.rides.service;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread-safe sliding window in-memory Rate Limiting service.
 */
@Service
@Slf4j
public class RateLimiterService {

    @Value("${rate.limit.auth.max:10}")
    private int authLimit;

    @Value("${rate.limit.rides.max:30}")
    private int ridesLimit;

    @Value("${rate.limit.location.max:180}")
    private int locationLimit;

    @Value("${rate.limit.feedback.max:30}")
    private int feedbackLimit;

    @Value("${rate.limit.notifications.max:60}")
    private int notificationsLimit;

    @Value("${rate.limit.general.max:120}")
    private int generalLimit;

    @Value("${rate.limit.window.seconds:60}")
    private long windowSeconds;

    private final ConcurrentHashMap<String, RequestBucket> buckets = new ConcurrentHashMap<>();

    @Getter
    public static class RateLimitResult {
        private final boolean allowed;
        private final int limit;
        private final int remaining;
        private final long retryAfterSeconds;

        public RateLimitResult(boolean allowed, int limit, int remaining, long retryAfterSeconds) {
            this.allowed = allowed;
            this.limit = limit;
            this.remaining = Math.max(0, remaining);
            this.retryAfterSeconds = retryAfterSeconds;
        }
    }

    private static class RequestBucket {
        private final long windowStartTime;
        private final AtomicInteger counter;

        public RequestBucket(long startTime) {
            this.windowStartTime = startTime;
            this.counter = new AtomicInteger(1);
        }

        public long getWindowStartTime() {
            return windowStartTime;
        }

        public int increment() {
            return counter.incrementAndGet();
        }

        public int getCount() {
            return counter.get();
        }
    }

    public RateLimitResult checkLimit(String clientKey, String requestUri, String httpMethod) {
        int maxAllowed = resolveLimit(requestUri, httpMethod);
        long now = System.currentTimeMillis();
        long windowMillis = windowSeconds * 1000L;

        String bucketKey = resolveBucketCategory(requestUri, httpMethod) + ":" + clientKey;

        RequestBucket bucket = buckets.compute(bucketKey, (key, existing) -> {
            if (existing == null || (now - existing.getWindowStartTime()) > windowMillis) {
                return new RequestBucket(now);
            }
            existing.increment();
            return existing;
        });

        int currentCount = bucket.getCount();
        long elapsed = now - bucket.getWindowStartTime();
        long remainingWindowTime = Math.max(1L, (windowMillis - elapsed) / 1000L);

        if (currentCount > maxAllowed) {
            log.warn("Rate limit exceeded for clientKey={} uri={} (count={}, max={})", clientKey, requestUri, currentCount, maxAllowed);
            return new RateLimitResult(false, maxAllowed, 0, remainingWindowTime);
        }

        return new RateLimitResult(true, maxAllowed, maxAllowed - currentCount, 0);
    }

    public int resolveLimit(String uri, String method) {
        String u = uri.toLowerCase();
        String m = method.toUpperCase();

        if (u.startsWith("/api/v1/auth/")) {
            return authLimit;
        }
        if (u.matches(".*/api/v1/rides/\\d+/location.*") || (u.contains("/location") && "POST".equals(m))) {
            return locationLimit;
        }
        if (u.equals("/api/v1/rides") && "POST".equals(m)) {
            return ridesLimit;
        }
        if (u.startsWith("/api/v1/feedback") && "POST".equals(m)) {
            return feedbackLimit;
        }
        if (u.startsWith("/api/v1/notifications") && ("POST".equals(m) || "PUT".equals(m) || "PATCH".equals(m))) {
            return notificationsLimit;
        }
        return generalLimit;
    }

    private String resolveBucketCategory(String uri, String method) {
        String u = uri.toLowerCase();
        String m = method.toUpperCase();

        if (u.startsWith("/api/v1/auth/")) {
            return "auth";
        }
        if (u.matches(".*/api/v1/rides/\\d+/location.*") || (u.contains("/location") && "POST".equals(m))) {
            return "location";
        }
        if (u.equals("/api/v1/rides") && "POST".equals(m)) {
            return "rides_create";
        }
        if (u.startsWith("/api/v1/feedback")) {
            return "feedback";
        }
        if (u.startsWith("/api/v1/notifications")) {
            return "notifications";
        }
        return "general";
    }

    /**
     * Periodic cleanup to prevent memory leaks from expired rate limit buckets.
     */
    @Scheduled(fixedRate = 60000)
    public void cleanupExpiredBuckets() {
        long now = System.currentTimeMillis();
        long windowMillis = windowSeconds * 1000L * 2;
        buckets.entrySet().removeIf(entry -> (now - entry.getValue().getWindowStartTime()) > windowMillis);
    }

    /**
     * Clears all buckets (useful for test resets).
     */
    public void reset() {
        buckets.clear();
    }
}
