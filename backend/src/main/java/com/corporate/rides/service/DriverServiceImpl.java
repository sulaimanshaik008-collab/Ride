package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Driver;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.ResourceNotFoundException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.DriverRepository;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    @Transactional
    public DriverResponseDto createDriver(CreateDriverRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        if (userRepository.findByEmail(request.getEmail().trim()).isPresent()) {
            throw new InvalidBookingException("A user with email '" + request.getEmail() + "' already exists");
        }

        if (driverRepository.existsByOrganizationIdAndLicenseNumber(currentUser.getOrganizationId(), request.getLicenseNumber().trim())) {
            throw new InvalidBookingException("A driver with license number '" + request.getLicenseNumber() + "' already exists in this organization");
        }

        Organization organization = organizationRepository.findById(currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        User user = User.builder()
                .organization(organization)
                .email(request.getEmail().trim())
                .fullName(request.getFullName().trim())
                .phoneNumber(request.getPhoneNumber().trim())
                .department(request.getDepartment() != null ? request.getDepartment().trim() : "Transport Operations")
                .role(UserRole.DRIVER)
                .build();

        User savedUser = userRepository.save(user);

        Driver driver = Driver.builder()
                .user(savedUser)
                .organization(organization)
                .licenseNumber(request.getLicenseNumber().trim())
                .licenseExpiryDate(request.getLicenseExpiryDate())
                .driverStatus(DriverStatus.ACTIVE)
                .availabilityStatus(DriverAvailability.AVAILABLE)
                .build();

        Driver savedDriver = driverRepository.save(driver);
        return mapToDto(savedDriver);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverResponseDto> searchDrivers(String search, DriverStatus status, DriverAvailability availability) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        String searchPattern = (search != null && !search.isBlank()) ? search.trim() : null;

        List<Driver> drivers = driverRepository.searchTenantDrivers(
                currentUser.getOrganizationId(),
                searchPattern,
                status,
                availability
        );

        return drivers.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DriverResponseDto getDriverById(UUID driverId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Driver driver = driverRepository.findByIdAndOrganizationId(driverId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with ID: " + driverId));

        if (currentUser.getRole() == UserRole.DRIVER && !driver.getUser().getId().equals(currentUser.getUserId())) {
            throw new UnauthorizedAccessException("Drivers can only view their own profile");
        } else if (currentUser.getRole() == UserRole.EMPLOYEE) {
            throw new UnauthorizedAccessException("Employees are not authorized to view driver details");
        }

        return mapToDto(driver);
    }

    @Override
    @Transactional
    public DriverResponseDto getSelfDriverProfile() {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Driver driver = driverRepository.findByUserId(currentUser.getUserId())
                .orElseGet(() -> {
                    User user = userRepository.findById(currentUser.getUserId())
                            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                    Organization org = user.getOrganization();
                    String cleanEmail = user.getEmail() != null ? user.getEmail() : "driver";
                    String lic = "DL-" + cleanEmail.replaceAll("[^a-zA-Z0-9]", "").toUpperCase().substring(0, Math.min(10, cleanEmail.length()));
                    
                    return driverRepository.save(Driver.builder()
                            .user(user)
                            .organization(org)
                            .licenseNumber(lic)
                            .licenseExpiryDate(LocalDate.now().plusYears(3))
                            .driverStatus(DriverStatus.ACTIVE)
                            .availabilityStatus(DriverAvailability.AVAILABLE)
                            .build());
                });

        return mapToDto(driver);
    }

    @Override
    @Transactional
    public DriverResponseDto updateDriver(UUID driverId, UpdateDriverRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Driver driver = driverRepository.findByIdAndOrganizationId(driverId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with ID: " + driverId));

        if (driverRepository.existsByOrganizationIdAndLicenseNumberAndIdNot(
                currentUser.getOrganizationId(), request.getLicenseNumber().trim(), driverId)) {
            throw new InvalidBookingException("License number '" + request.getLicenseNumber() + "' is already assigned to another driver in this organization");
        }

        User user = driver.getUser();
        user.setFullName(request.getFullName().trim());
        user.setPhoneNumber(request.getPhoneNumber().trim());
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment().trim());
        }
        userRepository.save(user);

        driver.setLicenseNumber(request.getLicenseNumber().trim());
        driver.setLicenseExpiryDate(request.getLicenseExpiryDate());

        Driver updatedDriver = driverRepository.save(driver);
        return mapToDto(updatedDriver);
    }

    @Override
    @Transactional
    public DriverResponseDto updateDriverStatus(UUID driverId, UpdateDriverStatusRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Driver driver = driverRepository.findByIdAndOrganizationId(driverId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with ID: " + driverId));

        driver.setDriverStatus(request.getDriverStatus());

        if (request.getDriverStatus() != DriverStatus.ACTIVE) {
            driver.setAvailabilityStatus(DriverAvailability.UNAVAILABLE);
        }

        Driver updatedDriver = driverRepository.save(driver);
        return mapToDto(updatedDriver);
    }

    @Override
    @Transactional
    public DriverResponseDto updateDriverAvailability(UUID driverId, UpdateDriverAvailabilityRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Driver driver = driverRepository.findByIdAndOrganizationId(driverId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with ID: " + driverId));

        if (currentUser.getRole() == UserRole.DRIVER && !driver.getUser().getId().equals(currentUser.getUserId())) {
            throw new UnauthorizedAccessException("Drivers can only update their own availability");
        } else if (currentUser.getRole() == UserRole.EMPLOYEE) {
            throw new UnauthorizedAccessException("Employees are not authorized to update driver availability");
        }

        DriverAvailability newAvailability = request.getAvailabilityStatus();

        if (newAvailability == DriverAvailability.AVAILABLE || newAvailability == DriverAvailability.ON_TRIP) {
            if (driver.getDriverStatus() != DriverStatus.ACTIVE) {
                throw new InvalidBookingException("Driver status is " + driver.getDriverStatus() + ". Cannot set availability to " + newAvailability);
            }
            if (driver.getLicenseExpiryDate().isBefore(LocalDate.now())) {
                throw new InvalidBookingException("Driver license expired on " + driver.getLicenseExpiryDate() + ". Cannot set availability to " + newAvailability);
            }
        }

        driver.setAvailabilityStatus(newAvailability);
        Driver updatedDriver = driverRepository.save(driver);
        return mapToDto(updatedDriver);
    }

    private UserPrincipal getCurrentUserPrincipal() {
        UserPrincipal currentUser = UserContextHolder.getContext();
        if (currentUser == null || currentUser.getUserId() == null || currentUser.getOrganizationId() == null) {
            throw new UnauthorizedAccessException("Authentication required. Tenant context missing.");
        }
        return currentUser;
    }

    private void verifyManagementRole(UserPrincipal currentUser) {
        UserRole role = currentUser.getRole();
        if (role != UserRole.TRANSPORT_MANAGER && role != UserRole.CORPORATE_ADMIN && role != UserRole.SYSTEM_ADMIN) {
            throw new UnauthorizedAccessException("Access denied. Only Transport Managers and Corporate Admins can perform driver management operations.");
        }
    }

    private DriverResponseDto mapToDto(Driver driver) {
        boolean isExpired = driver.getLicenseExpiryDate().isBefore(LocalDate.now());

        return DriverResponseDto.builder()
                .id(driver.getId())
                .userId(driver.getUser().getId())
                .organizationId(driver.getOrganization().getId())
                .organizationName(driver.getOrganization().getName())
                .fullName(driver.getUser().getFullName())
                .email(driver.getUser().getEmail())
                .phoneNumber(driver.getUser().getPhoneNumber())
                .department(driver.getUser().getDepartment())
                .licenseNumber(driver.getLicenseNumber())
                .licenseExpiryDate(driver.getLicenseExpiryDate())
                .isLicenseExpired(isExpired)
                .driverStatus(driver.getDriverStatus())
                .availabilityStatus(driver.getAvailabilityStatus())
                .createdAt(driver.getCreatedAt())
                .updatedAt(driver.getUpdatedAt())
                .build();
    }
}
