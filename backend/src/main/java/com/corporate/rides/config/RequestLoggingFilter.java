package com.corporate.rides.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Production-ready safe request logging and MDC correlation filter.
 * Logs method, endpoint, status, duration, and safe context without leaking sensitive data.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.endsWith(".js") || path.endsWith(".css") || path.endsWith(".ico") || path.endsWith(".png");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString().substring(0, 8);
        }
        response.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();
            String method = request.getMethod();
            String uri = request.getRequestURI();

            UserPrincipal principal = UserContextHolder.getContext();
            String userContext = (principal != null && principal.getEmail() != null)
                    ? " [user=" + sanitizeUser(principal.getEmail()) + ", org=" + principal.getOrganizationId() + "]"
                    : " [anon]";

            if (status >= 500) {
                log.error("REQ_ID={} | {} {} -> HTTP {} ({}ms){}", requestId, method, uri, status, duration, userContext);
            } else if (status >= 400) {
                log.warn("REQ_ID={} | {} {} -> HTTP {} ({}ms){}", requestId, method, uri, status, duration, userContext);
            } else {
                log.info("REQ_ID={} | {} {} -> HTTP {} ({}ms){}", requestId, method, uri, status, duration, userContext);
            }
        }
    }

    private String sanitizeUser(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@");
        String prefix = parts[0];
        String maskedPrefix = prefix.length() > 2 ? prefix.substring(0, 2) + "***" : "***";
        return maskedPrefix + "@" + parts[1];
    }
}
