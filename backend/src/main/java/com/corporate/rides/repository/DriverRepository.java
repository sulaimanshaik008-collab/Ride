package com.corporate.rides.repository;

import com.corporate.rides.entity.Driver;
import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriverRepository extends JpaRepository<Driver, UUID> {

    List<Driver> findByOrganizationId(UUID organizationId);

    Optional<Driver> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<Driver> findByUserId(UUID userId);

    boolean existsByOrganizationIdAndLicenseNumber(UUID organizationId, String licenseNumber);

    boolean existsByOrganizationIdAndLicenseNumberAndIdNot(UUID organizationId, String licenseNumber, UUID driverId);

    @Query("SELECT d FROM Driver d WHERE d.organization.id = :orgId " +
           "AND (:driverStatus IS NULL OR d.driverStatus = :driverStatus) " +
           "AND (:availabilityStatus IS NULL OR d.availabilityStatus = :availabilityStatus) " +
           "AND (:search IS NULL OR LOWER(d.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(d.user.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(d.user.phoneNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(d.licenseNumber) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY d.createdAt DESC")
    List<Driver> searchTenantDrivers(
            @Param("orgId") UUID orgId,
            @Param("search") String search,
            @Param("driverStatus") DriverStatus driverStatus,
            @Param("availabilityStatus") DriverAvailability availabilityStatus
    );
}
