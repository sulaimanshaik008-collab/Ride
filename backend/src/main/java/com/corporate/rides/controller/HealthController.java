package com.corporate.rides.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    @GetMapping(value = {"/api/v1/health", "/actuator/health"})
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", Instant.now().toString());
        health.put("service", "ride-scheduling-backend");

        Map<String, Object> components = new HashMap<>();
        boolean dbHealthy = checkDatabaseHealth();
        components.put("database", Map.of(
                "status", dbHealthy ? "UP" : "DOWN"
        ));
        health.put("components", components);

        if (!dbHealthy) {
            health.put("status", "DOWN");
            return ResponseEntity.status(503).body(health);
        }

        return ResponseEntity.ok(health);
    }

    private boolean checkDatabaseHealth() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(2);
        } catch (Exception e) {
            return false;
        }
    }
}
