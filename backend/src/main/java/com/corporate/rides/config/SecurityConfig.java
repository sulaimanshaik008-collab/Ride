package com.corporate.rides.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserContextFilter userContextFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final RequestLoggingFilter requestLoggingFilter;

    @Value("${cors.allowed-origins:http://localhost:[*],http://127.0.0.1:[*],https://*}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(request -> {
                var corsConfig = new org.springframework.web.cors.CorsConfiguration();
                List<String> origins = Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
                corsConfig.setAllowedOriginPatterns(origins);
                corsConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                corsConfig.setAllowedHeaders(List.of("*"));
                corsConfig.setExposedHeaders(List.of("X-Request-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"));
                corsConfig.setAllowCredentials(true);
                return corsConfig;
            }))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/api/v1/health", "/h2-console/**", "/error").permitAll()
                .anyRequest().permitAll()
            )
            .addFilterBefore(requestLoggingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(userContextFilter, RequestLoggingFilter.class)
            .addFilterAfter(rateLimitingFilter, UserContextFilter.class)
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

        return http.build();
    }
}
