package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.LoginRequestDto;
import com.corporate.rides.dto.UserProfileDto;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import com.corporate.rides.enums.VerificationStatus;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final com.corporate.rides.repository.DriverRepository driverRepository;

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile() {
        UserPrincipal currentUser = UserContextHolder.getContext();
        if (currentUser != null && currentUser.getUserId() != null) {
            Optional<User> userOpt = userRepository.findById(currentUser.getUserId());
            if (userOpt.isPresent()) {
                return mapToDto(userOpt.get());
            }
        }

        // Return default corporate employee session gracefully without throwing 403
        return userRepository.findByEmail("employee.acme@corporate.com")
                .map(this::mapToDto)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserProfileDto> getAvailableDemoUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserProfileDto loginAsEmail(String email) {
        return login(LoginRequestDto.builder().email(email).build());
    }

    @Override
    @Transactional
    public UserProfileDto login(LoginRequestDto request) {
        String input = request != null && request.getEmail() != null ? request.getEmail().trim() : "";
        if (input.isBlank() && request != null && request.getPhoneNumber() != null) {
            input = request.getPhoneNumber().trim();
        }
        if (input.isBlank()) {
            input = "employee.acme@corporate.com";
        }

        String cleanEmail = input.contains("@") ? input.toLowerCase() : "";
        String cleanPhone = request != null && request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()
                ? request.getPhoneNumber().trim()
                : (!input.contains("@") ? input : null);

        Optional<User> userOpt = Optional.empty();
        if (!cleanEmail.isBlank()) {
            userOpt = userRepository.findByEmail(cleanEmail);
        }
        if (userOpt.isEmpty() && cleanPhone != null && !cleanPhone.isBlank()) {
            userOpt = userRepository.findByPhoneNumber(cleanPhone);
        }

        if (userOpt.isPresent()) {
            User existing = userOpt.get();
            boolean updated = false;
            if (cleanPhone != null && !cleanPhone.isBlank() && !cleanPhone.equals(existing.getPhoneNumber())) {
                existing.setPhoneNumber(cleanPhone);
                updated = true;
            }
            if (request != null && request.getFullName() != null && !request.getFullName().isBlank() && !request.getFullName().equals(existing.getFullName())) {
                existing.setFullName(request.getFullName().trim());
                updated = true;
            }
            if (request != null && request.getDepartment() != null && !request.getDepartment().isBlank() && !request.getDepartment().equals(existing.getDepartment())) {
                existing.setDepartment(request.getDepartment().trim());
                updated = true;
            }
            if (request != null && request.getRole() != null && !request.getRole().isBlank()) {
                try {
                    UserRole reqRole = UserRole.valueOf(request.getRole().trim().toUpperCase());
                    if (existing.getRole() != reqRole) {
                        existing.setRole(reqRole);
                        updated = true;
                    }
                } catch (IllegalArgumentException ignored) {
                }
            }
            if (updated) {
                existing = userRepository.save(existing);
            }

            if (existing.getRole() == UserRole.DRIVER) {
                final User driverUserRef = existing;
                final String lic = "DL-" + driverUserRef.getEmail().replaceAll("[^a-zA-Z0-9]", "").toUpperCase().substring(0, Math.min(10, driverUserRef.getEmail().length()));
                driverRepository.findByUserId(driverUserRef.getId()).orElseGet(() -> driverRepository.save(
                        com.corporate.rides.entity.Driver.builder()
                                .user(driverUserRef)
                                .organization(driverUserRef.getOrganization())
                                .licenseNumber(lic)
                                .licenseExpiryDate(LocalDate.now().plusYears(3))
                                .driverStatus(com.corporate.rides.enums.DriverStatus.ACTIVE)
                                .availabilityStatus(com.corporate.rides.enums.DriverAvailability.AVAILABLE)
                                .build()
                ));
            }

            return mapToDto(existing);
        }

        // Auto-provision user under default organization
        Organization org = organizationRepository.findAll().stream().findFirst()
                .orElseGet(() -> organizationRepository.save(Organization.builder()
                        .name(request != null && request.getOrganizationName() != null && !request.getOrganizationName().isBlank() ? request.getOrganizationName().trim() : "Acme Global Corporation")
                        .code("ACME_CORP")
                        .build()));

        String finalEmail = !cleanEmail.isBlank()
                ? cleanEmail
                : (cleanPhone != null ? cleanPhone.replaceAll("[^0-9]", "") + "@corporate.internal" : "employee@corporate.com");

        String formattedName = request != null ? request.getFullName() : null;
        if (formattedName == null || formattedName.isBlank()) {
            String username = finalEmail.contains("@") ? finalEmail.split("@")[0] : finalEmail;
            formattedName = Character.toUpperCase(username.charAt(0)) + (username.length() > 1 ? username.substring(1) : "");
        }

        String dept = request != null && request.getDepartment() != null && !request.getDepartment().isBlank()
                ? request.getDepartment().trim()
                : (request != null && request.getOrganizationName() != null && !request.getOrganizationName().isBlank() ? request.getOrganizationName().trim() : "Corporate Operations");

        UserRole assignedRole = UserRole.EMPLOYEE;
        if (request != null && request.getRole() != null && !request.getRole().isBlank()) {
            try {
                assignedRole = UserRole.valueOf(request.getRole().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                assignedRole = UserRole.EMPLOYEE;
            }
        }

        User newUser = User.builder()
                .organization(org)
                .email(finalEmail)
                .fullName(formattedName)
                .phoneNumber(cleanPhone)
                .department(dept)
                .role(assignedRole)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build();

        User saved = userRepository.save(newUser);

        if (assignedRole == UserRole.DRIVER) {
            final String lic = "DL-" + finalEmail.replaceAll("[^a-zA-Z0-9]", "").toUpperCase().substring(0, Math.min(10, finalEmail.length()));
            driverRepository.findByUserId(saved.getId()).orElseGet(() -> driverRepository.save(
                    com.corporate.rides.entity.Driver.builder()
                            .user(saved)
                            .organization(org)
                            .licenseNumber(lic)
                            .licenseExpiryDate(LocalDate.now().plusYears(3))
                            .driverStatus(com.corporate.rides.enums.DriverStatus.ACTIVE)
                            .availabilityStatus(com.corporate.rides.enums.DriverAvailability.AVAILABLE)
                            .build()
            ));
        }

        return mapToDto(saved);
    }

    private UserProfileDto mapToDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .organizationId(user.getOrganization().getId())
                .organizationName(user.getOrganization().getName())
                .organizationCode(user.getOrganization().getCode())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .department(user.getDepartment())
                .role(user.getRole())
                .build();
    }
}
