package com.corporate.rides.repository;

import com.corporate.rides.entity.Vehicle;
import com.corporate.rides.enums.MaintenanceStatus;
import com.corporate.rides.enums.VehicleAvailability;
import com.corporate.rides.enums.VehicleStatus;
import com.corporate.rides.enums.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    List<Vehicle> findByOrganizationId(UUID organizationId);

    long countByOrganizationId(UUID organizationId);

    long countByOrganizationIdAndVehicleStatus(UUID organizationId, VehicleStatus vehicleStatus);

    Optional<Vehicle> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByOrganizationIdAndRegistrationNumber(UUID organizationId, String registrationNumber);

    boolean existsByOrganizationIdAndRegistrationNumberAndIdNot(UUID organizationId, String registrationNumber, UUID id);

    @Query("SELECT v FROM Vehicle v WHERE v.organization.id = :orgId " +
           "AND (:vehicleType IS NULL OR v.vehicleType = :vehicleType) " +
           "AND (:vehicleStatus IS NULL OR v.vehicleStatus = :vehicleStatus) " +
           "AND (:availabilityStatus IS NULL OR v.availabilityStatus = :availabilityStatus) " +
           "AND (:maintenanceStatus IS NULL OR v.maintenanceStatus = :maintenanceStatus) " +
           "AND (:search IS NULL OR LOWER(v.registrationNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(v.make) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(v.model) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY v.createdAt DESC")
    List<Vehicle> searchTenantVehicles(
            @Param("orgId") UUID orgId,
            @Param("search") String search,
            @Param("vehicleType") VehicleType vehicleType,
            @Param("vehicleStatus") VehicleStatus vehicleStatus,
            @Param("availabilityStatus") VehicleAvailability availabilityStatus,
            @Param("maintenanceStatus") MaintenanceStatus maintenanceStatus
    );
}
