package com.corporate.rides.config;

import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import com.corporate.rides.enums.VerificationStatus;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserContextFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String userEmail = request.getHeader("X-User-Email");
            String authHeader = request.getHeader("Authorization");
            if ((userEmail == null || userEmail.isBlank()) && authHeader != null && authHeader.startsWith("Bearer ")) {
                userEmail = authHeader.substring(7).trim();
            }
            if (userEmail == null || userEmail.isBlank()) {
                userEmail = "employee.acme@corporate.com";
            }
            String cleanEmail = userEmail.trim().toLowerCase();

            Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
            User user;
            if (userOpt.isPresent()) {
                user = userOpt.get();
            } else {
                Organization defaultOrg = organizationRepository.findAll().stream().findFirst()
                        .orElseGet(() -> organizationRepository.save(Organization.builder()
                                .name("Acme Global Corporation")
                                .code("ACME_CORP")
                                .build()));

                String username = cleanEmail.contains("@") ? cleanEmail.split("@")[0] : cleanEmail;
                String formattedName = Character.toUpperCase(username.charAt(0)) + (username.length() > 1 ? username.substring(1) : "");

                User newUser = User.builder()
                        .organization(defaultOrg)
                        .email(cleanEmail)
                        .fullName(formattedName)
                        .role(UserRole.EMPLOYEE)
                        .status(UserStatus.ACTIVE)
                        .verificationStatus(VerificationStatus.VERIFIED)
                        .build();
                user = userRepository.save(newUser);
            }

            if (user.getStatus() == UserStatus.DEACTIVATED ||
                user.getStatus() == UserStatus.SUSPENDED) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"Account is " + user.getStatus().name().toLowerCase() + ". Please contact your corporate administrator.\"}");
                return;
            }

            UserPrincipal principal = UserPrincipal.builder()
                    .userId(user.getId())
                    .organizationId(user.getOrganization().getId())
                    .organizationName(user.getOrganization().getName())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole())
                    .build();
            UserContextHolder.setContext(principal);

            var auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                    principal, null, java.util.Collections.emptyList()
            );
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

            filterChain.doFilter(request, response);
        } finally {
            UserContextHolder.clear();
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }
}
