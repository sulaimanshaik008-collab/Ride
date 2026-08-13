package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Vehicle;
import com.corporate.rides.enums.*;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.ResourceNotFoundException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    @Transactional
    public VehicleResponseDto createVehicle(CreateVehicleRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        if (request.getSeatingCapacity() == null || request.getSeatingCapacity() <= 0) {
            throw new InvalidBookingException("Seating capacity must be greater than zero");
        }

        String regNumber = request.getRegistrationNumber().trim();
        if (vehicleRepository.existsByOrganizationIdAndRegistrationNumber(currentUser.getOrganizationId(), regNumber)) {
            throw new InvalidBookingException("A vehicle with registration number '" + regNumber + "' already exists in this organization");
        }

        Organization organization = organizationRepository.findById(currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Vehicle vehicle = Vehicle.builder()
                .organization(organization)
                .registrationNumber(regNumber)
                .vehicleType(request.getVehicleType())
                .make(request.getMake().trim())
                .model(request.getModel().trim())
                .manufacturingYear(request.getManufacturingYear())
                .seatingCapacity(request.getSeatingCapacity())
                .vehicleStatus(VehicleStatus.ACTIVE)
                .availabilityStatus(VehicleAvailability.AVAILABLE)
                .maintenanceStatus(MaintenanceStatus.GOOD)
                .insuranceExpiryDate(request.getInsuranceExpiryDate())
                .permitExpiryDate(request.getPermitExpiryDate())
                .build();

        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return mapToDto(savedVehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponseDto> searchVehicles(
            String search,
            VehicleType vehicleType,
            VehicleStatus vehicleStatus,
            VehicleAvailability availabilityStatus,
            MaintenanceStatus maintenanceStatus) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyViewPermission(currentUser);

        String searchPattern = (search != null && !search.isBlank()) ? search.trim() : null;

        List<Vehicle> vehicles = vehicleRepository.searchTenantVehicles(
                currentUser.getOrganizationId(),
                searchPattern,
                vehicleType,
                vehicleStatus,
                availabilityStatus,
                maintenanceStatus
        );

        return vehicles.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponseDto getVehicleById(UUID vehicleId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyViewPermission(currentUser);

        Vehicle vehicle = vehicleRepository.findByIdAndOrganizationId(vehicleId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));

        return mapToDto(vehicle);
    }

    @Override
    @Transactional
    public VehicleResponseDto updateVehicle(UUID vehicleId, UpdateVehicleRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        if (request.getSeatingCapacity() == null || request.getSeatingCapacity() <= 0) {
            throw new InvalidBookingException("Seating capacity must be greater than zero");
        }

        Vehicle vehicle = vehicleRepository.findByIdAndOrganizationId(vehicleId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));

        String regNumber = request.getRegistrationNumber().trim();
        if (vehicleRepository.existsByOrganizationIdAndRegistrationNumberAndIdNot(currentUser.getOrganizationId(), regNumber, vehicleId)) {
            throw new InvalidBookingException("Registration number '" + regNumber + "' is already assigned to another vehicle in this organization");
        }

        vehicle.setRegistrationNumber(regNumber);
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setMake(request.getMake().trim());
        vehicle.setModel(request.getModel().trim());
        vehicle.setManufacturingYear(request.getManufacturingYear());
        vehicle.setSeatingCapacity(request.getSeatingCapacity());
        vehicle.setInsuranceExpiryDate(request.getInsuranceExpiryDate());
        vehicle.setPermitExpiryDate(request.getPermitExpiryDate());

        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        return mapToDto(updatedVehicle);
    }

    @Override
    @Transactional
    public VehicleResponseDto updateVehicleStatus(UUID vehicleId, UpdateVehicleStatusRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Vehicle vehicle = vehicleRepository.findByIdAndOrganizationId(vehicleId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));

        vehicle.setVehicleStatus(request.getVehicleStatus());

        if (request.getVehicleStatus() != VehicleStatus.ACTIVE) {
            vehicle.setAvailabilityStatus(VehicleAvailability.UNAVAILABLE);
        }

        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        return mapToDto(updatedVehicle);
    }

    @Override
    @Transactional
    public VehicleResponseDto updateVehicleAvailability(UUID vehicleId, UpdateVehicleAvailabilityRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Vehicle vehicle = vehicleRepository.findByIdAndOrganizationId(vehicleId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));

        VehicleAvailability newAvailability = request.getAvailabilityStatus();

        if (newAvailability == VehicleAvailability.AVAILABLE) {
            if (vehicle.getVehicleStatus() != VehicleStatus.ACTIVE) {
                throw new InvalidBookingException("Vehicle status is " + vehicle.getVehicleStatus() + ". Cannot set availability to AVAILABLE");
            }
            if (vehicle.getMaintenanceStatus() == MaintenanceStatus.MAINTENANCE) {
                throw new InvalidBookingException("Vehicle is undergoing MAINTENANCE. Cannot set availability to AVAILABLE");
            }
            if (vehicle.getInsuranceExpiryDate() != null && vehicle.getInsuranceExpiryDate().isBefore(LocalDate.now())) {
                throw new InvalidBookingException("Vehicle insurance expired on " + vehicle.getInsuranceExpiryDate() + ". Cannot set availability to AVAILABLE");
            }
            if (vehicle.getPermitExpiryDate() != null && vehicle.getPermitExpiryDate().isBefore(LocalDate.now())) {
                throw new InvalidBookingException("Vehicle permit expired on " + vehicle.getPermitExpiryDate() + ". Cannot set availability to AVAILABLE");
            }
        }

        vehicle.setAvailabilityStatus(newAvailability);
        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        return mapToDto(updatedVehicle);
    }

    @Override
    @Transactional
    public VehicleResponseDto updateVehicleMaintenance(UUID vehicleId, UpdateVehicleMaintenanceRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);

        Vehicle vehicle = vehicleRepository.findByIdAndOrganizationId(vehicleId, currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));

        vehicle.setMaintenanceStatus(request.getMaintenanceStatus());

        if (request.getMaintenanceStatus() == MaintenanceStatus.MAINTENANCE) {
            vehicle.setAvailabilityStatus(VehicleAvailability.MAINTENANCE);
        }

        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        return mapToDto(updatedVehicle);
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
            throw new UnauthorizedAccessException("Access denied. Only Transport Managers and Corporate Admins can perform vehicle management operations.");
        }
    }

    private void verifyViewPermission(UserPrincipal currentUser) {
        UserRole role = currentUser.getRole();
        if (role == UserRole.EMPLOYEE) {
            throw new UnauthorizedAccessException("Access denied. Employees are not authorized to view vehicle details.");
        }
    }

    private VehicleResponseDto mapToDto(Vehicle vehicle) {
        LocalDate today = LocalDate.now();
        boolean isInsuranceExpired = vehicle.getInsuranceExpiryDate() != null && vehicle.getInsuranceExpiryDate().isBefore(today);
        boolean isPermitExpired = vehicle.getPermitExpiryDate() != null && vehicle.getPermitExpiryDate().isBefore(today);

        return VehicleResponseDto.builder()
                .id(vehicle.getId())
                .organizationId(vehicle.getOrganization().getId())
                .organizationName(vehicle.getOrganization().getName())
                .registrationNumber(vehicle.getRegistrationNumber())
                .vehicleType(vehicle.getVehicleType())
                .make(vehicle.getMake())
                .model(vehicle.getModel())
                .manufacturingYear(vehicle.getManufacturingYear())
                .seatingCapacity(vehicle.getSeatingCapacity())
                .vehicleStatus(vehicle.getVehicleStatus())
                .availabilityStatus(vehicle.getAvailabilityStatus())
                .maintenanceStatus(vehicle.getMaintenanceStatus())
                .insuranceExpiryDate(vehicle.getInsuranceExpiryDate())
                .permitExpiryDate(vehicle.getPermitExpiryDate())
                .isInsuranceExpired(isInsuranceExpired)
                .isPermitExpired(isPermitExpired)
                .createdAt(vehicle.getCreatedAt())
                .updatedAt(vehicle.getUpdatedAt())
                .build();
    }
}
