package com.corporate.rides.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class RateLimiterTest {

    private RateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        rateLimiterService = new RateLimiterService();
        ReflectionTestUtils.setField(rateLimiterService, "authLimit", 5);
        ReflectionTestUtils.setField(rateLimiterService, "ridesLimit", 10);
        ReflectionTestUtils.setField(rateLimiterService, "locationLimit", 20);
        ReflectionTestUtils.setField(rateLimiterService, "feedbackLimit", 5);
        ReflectionTestUtils.setField(rateLimiterService, "notificationsLimit", 10);
        ReflectionTestUtils.setField(rateLimiterService, "generalLimit", 15);
        ReflectionTestUtils.setField(rateLimiterService, "windowSeconds", 60L);
        rateLimiterService.reset();
    }

    @Test
    @DisplayName("Should allow requests within rate limit")
    void testAllowedRequests() {
        for (int i = 1; i <= 5; i++) {
            RateLimiterService.RateLimitResult result = rateLimiterService.checkLimit("test-ip", "/api/v1/auth/login", "POST");
            assertTrue(result.isAllowed());
            assertEquals(5, result.getLimit());
            assertEquals(5 - i, result.getRemaining());
        }
    }

    @Test
    @DisplayName("Should block requests exceeding rate limit and return retry after")
    void testExceededLimit() {
        for (int i = 0; i < 5; i++) {
            assertTrue(rateLimiterService.checkLimit("test-ip-2", "/api/v1/auth/login", "POST").isAllowed());
        }

        RateLimiterService.RateLimitResult blocked = rateLimiterService.checkLimit("test-ip-2", "/api/v1/auth/login", "POST");
        assertFalse(blocked.isAllowed());
        assertEquals(0, blocked.getRemaining());
        assertTrue(blocked.getRetryAfterSeconds() > 0);
    }

    @Test
    @DisplayName("Should correctly classify endpoints with distinct limits")
    void testEndpointClassification() {
        assertEquals(5, rateLimiterService.resolveLimit("/api/v1/auth/login", "POST"));
        assertEquals(10, rateLimiterService.resolveLimit("/api/v1/rides", "POST"));
        assertEquals(20, rateLimiterService.resolveLimit("/api/v1/rides/123/location", "POST"));
        assertEquals(5, rateLimiterService.resolveLimit("/api/v1/feedback", "POST"));
        assertEquals(10, rateLimiterService.resolveLimit("/api/v1/notifications/mark-read", "PUT"));
        assertEquals(15, rateLimiterService.resolveLimit("/api/v1/analytics/summary", "GET"));
    }
}
