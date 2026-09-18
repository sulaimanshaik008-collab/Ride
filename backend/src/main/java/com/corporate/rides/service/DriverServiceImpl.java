package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Driver;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.*;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.ResourceNotFoundException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.DriverRepository;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.RideRepository;
import com.corporate.rides.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final RideRepository rideRepository;

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
                .verificationStatus(DriverVerificationStatus.VERIFIED)
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
        Driver driver = getOrCreateDriver(currentUser);
        return mapToDto(driver);
    }

    private Driver getOrCreateDriver(UserPrincipal currentUser) {
        return driverRepository.findByUserId(currentUser.getUserId())
                .orElseGet(() -> {
                    User user = userRepository.findById(currentUser.getUserId())
                            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                    Organization org = user.getOrganization();
                    String cleanEmail = user.getEmail() != null ? user.getEmail() : "driver";
                    String alphaOnly = cleanEmail.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                    String lic = "DL-" + (alphaOnly.isEmpty() ? "DRIVER" : alphaOnly.substring(0, Math.min(10, alphaOnly.length())));

                    return driverRepository.save(Driver.builder()
                            .user(user)
                            .organization(org)
                            .licenseNumber(lic)
                            .licenseExpiryDate(LocalDate.now().plusYears(3))
                            .driverStatus(DriverStatus.ACTIVE)
                            .availabilityStatus(DriverAvailability.AVAILABLE)
                            .verificationStatus(DriverVerificationStatus.VERIFIED)
                            .build());
                });
    }

    @Override
    @Transactional
    public DriverResponseDto updateSelfDriverDocuments(DriverDocumentUpdateDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Driver driver = driverRepository.findByUserId(currentUser.getUserId())
                .orElseGet(() -> {
                    User user = userRepository.findById(currentUser.getUserId())
                            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                    return driverRepository.save(Driver.builder()
                            .user(user)
                            .organization(user.getOrganization())
                            .licenseNumber(request.getLicenseNumber().trim())
                            .licenseExpiryDate(request.getLicenseExpiryDate())
                            .driverStatus(DriverStatus.ACTIVE)
                            .availabilityStatus(DriverAvailability.AVAILABLE)
                            .verificationStatus(DriverVerificationStatus.PENDING_VERIFICATION)
                            .build());
                });

        if (driverRepository.existsByOrganizationIdAndLicenseNumberAndIdNot(
                currentUser.getOrganizationId(), request.getLicenseNumber().trim(), driver.getId())) {
            throw new InvalidBookingException("License number '" + request.getLicenseNumber() + "' is already assigned to another driver in this organization");
        }

        driver.setLicenseNumber(request.getLicenseNumber().trim());
        driver.setLicenseExpiryDate(request.getLicenseExpiryDate());
        if (request.getVehiclePlateNumber() != null) {
            driver.setVehiclePlateNumber(request.getVehiclePlateNumber().trim());
        }
        if (request.getVehicleModel() != null) {
            driver.setVehicleModel(request.getVehicleModel().trim());
        }
        if (request.getDocumentUrl() != null) {
            driver.setDocumentUrl(request.getDocumentUrl().trim());
        }
        if (request.getInsuranceNumber() != null) {
            driver.setInsuranceNumber(request.getInsuranceNumber().trim());
        }
        if (request.getInsuranceExpiryDate() != null) {
            driver.setInsuranceExpiryDate(request.getInsuranceExpiryDate());
        }
        if (request.getBankAccountNumber() != null) {
            driver.setBankAccountNumber(request.getBankAccountNumber().trim());
        }
        if (request.getBankIfscCode() != null) {
            driver.setBankIfscCode(request.getBankIfscCode().trim());
        }
        if (request.getBankAccountName() != null) {
            driver.setBankAccountName(request.getBankAccountName().trim());
        }
        if (request.getUpiId() != null) {
            driver.setUpiId(request.getUpiId().trim());
        }

        driver.setVerificationStatus(DriverVerificationStatus.PENDING_VERIFICATION);
        driver.setRejectionReason(null);

        Driver updatedDriver = driverRepository.save(driver);
        return mapToDto(updatedDriver);
    }

    @Override
    @Transactional
    public DriverResponseDto verifyDriverDocuments(UUID driverId, DriverVerificationDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Driver driver = driverRepository.findByIdAndOrganizationId(driverId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with ID: " + driverId));

        User manager = userRepository.findById(currentUser.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Manager user not found"));

        if (Boolean.TRUE.equals(request.getApproved())) {
            driver.setVerificationStatus(DriverVerificationStatus.VERIFIED);
            driver.setDriverStatus(DriverStatus.ACTIVE);
            driver.setRejectionReason(null);
            driver.setVerifiedBy(manager);
            driver.setVerifiedAt(OffsetDateTime.now());
        } else {
            driver.setVerificationStatus(DriverVerificationStatus.REJECTED);
            driver.setRejectionReason(request.getRejectionReason() != null ? request.getRejectionReason().trim() : "Documents rejected by Transport Manager");
            driver.setVerifiedBy(manager);
            driver.setVerifiedAt(OffsetDateTime.now());
        }

        Driver savedDriver = driverRepository.save(driver);
        return mapToDto(savedDriver);
    }

    @Override
    @Transactional
    public DriverMonthlyPayoutDto getSelfDriverMonthlyPayout(String monthStr) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        Driver driver = getOrCreateDriver(currentUser);
        return calculateMonthlyPayout(driver, monthStr);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverMonthlyPayoutDto> getAllDriversMonthlyPayouts(String monthStr) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        List<Driver> drivers = driverRepository.findByOrganizationId(currentUser.getOrganizationId());
        List<DriverMonthlyPayoutDto> payouts = new ArrayList<>();

        for (Driver driver : drivers) {
            payouts.add(calculateMonthlyPayout(driver, monthStr));
        }

        return payouts;
    }

    @Override
    @Transactional
    public DriverMonthlyPayoutDto processDriverMonthlyPayout(UUID driverId, ProcessPayoutRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Driver driver = driverRepository.findByIdAndOrganizationId(driverId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with ID: " + driverId));

        YearMonth ym = parseYearMonth(request.getMonth());
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        List<Ride> completedRides = rideRepository.findCompletedDriverRidesInDateRange(driver.getId(), startDate, endDate);

        if (completedRides.isEmpty()) {
            throw new InvalidBookingException("No completed rides found for driver in month " + request.getMonth());
        }

        String ref = request.getPaymentReference() != null && !request.getPaymentReference().isBlank()
                ? request.getPaymentReference().trim()
                : "PAY-" + ym.toString() + "-" + driver.getId().toString().substring(0, 8).toUpperCase();

        OffsetDateTime now = OffsetDateTime.now();
        for (Ride r : completedRides) {
            r.setPaymentStatus(PaymentStatus.PAID);
            r.setPaidAt(now);
            r.setPaymentReference(ref);
            rideRepository.save(r);
        }

        return calculateMonthlyPayout(driver, request.getMonth());
    }

    private DriverMonthlyPayoutDto calculateMonthlyPayout(Driver driver, String monthStr) {
        YearMonth ym = parseYearMonth(monthStr);
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        List<Ride> rides = rideRepository.findCompletedDriverRidesInDateRange(driver.getId(), startDate, endDate);

        long completedCount = rides.size();
        double totalEarnings = 0.0;
        double totalDistance = 0.0;
        boolean allPaid = !rides.isEmpty();
        OffsetDateTime lastPaidAt = null;
        String payRef = null;

        for (Ride r : rides) {
            double cost = r.getEstimatedCost() != null ? r.getEstimatedCost() : calculateDefaultFare(r);
            totalEarnings += cost;
            if (r.getDistanceKm() != null) {
                totalDistance += r.getDistanceKm();
            }
            if (r.getPaymentStatus() != PaymentStatus.PAID) {
                allPaid = false;
            } else {
                lastPaidAt = r.getPaidAt();
                payRef = r.getPaymentReference();
            }
        }

        PaymentStatus status = rides.isEmpty() ? PaymentStatus.PENDING : (allPaid ? PaymentStatus.PAID : PaymentStatus.PENDING);

        return DriverMonthlyPayoutDto.builder()
                .driverId(driver.getId())
                .driverName(driver.getUser().getFullName())
                .driverPhone(driver.getUser().getPhoneNumber())
                .driverEmail(driver.getUser().getEmail())
                .licenseNumber(driver.getLicenseNumber())
                .vehiclePlateNumber(driver.getVehiclePlateNumber())
                .vehicleModel(driver.getVehicleModel())
                .month(ym.toString())
                .completedRidesCount(completedCount)
                .totalEarnings(Math.round(totalEarnings * 100.0) / 100.0)
                .totalDistanceKm(Math.round(totalDistance * 10.0) / 10.0)
                .paymentStatus(status)
                .paidAt(lastPaidAt)
                .paymentReference(payRef)
                .bankAccountNumber(driver.getBankAccountNumber())
                .bankIfscCode(driver.getBankIfscCode())
                .bankAccountName(driver.getBankAccountName())
                .upiId(driver.getUpiId())
                .build();
    }

    private YearMonth parseYearMonth(String monthStr) {
        if (monthStr == null || monthStr.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(monthStr.trim());
        } catch (Exception e) {
            return YearMonth.now();
        }
    }

    private double calculateDefaultFare(Ride r) {
        // Fallback calculation: base 100 + 15/km
        double dist = r.getDistanceKm() != null ? r.getDistanceKm() : 8.5;
        return 100.0 + (dist * 15.0);
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
        boolean isExpired = driver.getLicenseExpiryDate() != null && driver.getLicenseExpiryDate().isBefore(LocalDate.now());

        return DriverResponseDto.builder()
                .id(driver.getId())
                .userId(driver.getUser().getId())
                .organizationId(driver.getOrganization().getId())
                .organizationName(driver.getOrganization().getName())
                .fullName(driver.getUser().getFullName())
                .email(driver.getUser().getEmail())
                .phoneNumber(driver.getUser().getPhoneNumber())
                .profileImageUrl(driver.getUser().getProfileImageUrl())
                .department(driver.getUser().getDepartment())
                .licenseNumber(driver.getLicenseNumber())
                .licenseExpiryDate(driver.getLicenseExpiryDate())
                .isLicenseExpired(isExpired)
                .driverStatus(driver.getDriverStatus())
                .availabilityStatus(driver.getAvailabilityStatus())
                .verificationStatus(driver.getVerificationStatus() != null ? driver.getVerificationStatus() : DriverVerificationStatus.VERIFIED)
                .vehiclePlateNumber(driver.getVehiclePlateNumber())
                .vehicleModel(driver.getVehicleModel())
                .documentUrl(driver.getDocumentUrl())
                .insuranceNumber(driver.getInsuranceNumber())
                .insuranceExpiryDate(driver.getInsuranceExpiryDate())
                .bankAccountNumber(driver.getBankAccountNumber())
                .bankIfscCode(driver.getBankIfscCode())
                .bankAccountName(driver.getBankAccountName())
                .upiId(driver.getUpiId())
                .verifiedById(driver.getVerifiedBy() != null ? driver.getVerifiedBy().getId() : null)
                .verifiedByName(driver.getVerifiedBy() != null ? driver.getVerifiedBy().getFullName() : null)
                .verifiedAt(driver.getVerifiedAt())
                .rejectionReason(driver.getRejectionReason())
                .createdAt(driver.getCreatedAt())
                .updatedAt(driver.getUpdatedAt())
                .build();
    }
}
