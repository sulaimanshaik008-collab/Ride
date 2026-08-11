package com.corporate.rides.repository;

import com.corporate.rides.entity.Ride;
import com.corporate.rides.enums.RideStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RideRepository extends JpaRepository<Ride, UUID> {

    List<Ride> findByOrganizationIdAndEmployeeIdOrderByCreatedAtDesc(UUID organizationId, UUID employeeId);

    Optional<Ride> findByIdAndOrganizationIdAndEmployeeId(UUID id, UUID organizationId, UUID employeeId);

    Optional<Ride> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<Ride> findByBookingReferenceAndOrganizationId(String bookingReference, UUID organizationId);

    boolean existsByBookingReference(String bookingReference);

    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND r.status IN (com.corporate.rides.enums.RideStatus.PENDING_APPROVAL, com.corporate.rides.enums.RideStatus.APPROVED) " +
           "ORDER BY r.bookingDate ASC, r.pickupTime ASC")
    List<Ride> findSchedulableTenantRides(@Param("orgId") UUID orgId);

    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:bookingDate IS NULL OR r.bookingDate = :bookingDate) " +
           "AND (:search IS NULL OR LOWER(r.bookingReference) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(r.employee.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(r.pickupLocation) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(r.destination) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY r.bookingDate DESC, r.pickupTime DESC")
    List<Ride> searchTenantScheduledRides(
            @Param("orgId") UUID orgId,
            @Param("search") String search,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("status") RideStatus status
    );

    // Feature 5 — Assignment Queries
    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND r.status IN (com.corporate.rides.enums.RideStatus.SCHEDULED, com.corporate.rides.enums.RideStatus.ASSIGNED) " +
           "AND (r.driver IS NULL OR r.vehicle IS NULL) " +
           "ORDER BY r.bookingDate ASC, r.pickupTime ASC")
    List<Ride> findPendingAssignmentTenantRides(@Param("orgId") UUID orgId);

    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND r.driver.id = :driverId " +
           "AND r.bookingDate = :bookingDate " +
           "AND r.status IN (com.corporate.rides.enums.RideStatus.SCHEDULED, com.corporate.rides.enums.RideStatus.ASSIGNED, com.corporate.rides.enums.RideStatus.IN_PROGRESS) " +
           "AND (:excludeRideId IS NULL OR r.id <> :excludeRideId)")
    List<Ride> findDriverRidesOnDate(
            @Param("orgId") UUID orgId,
            @Param("driverId") UUID driverId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("excludeRideId") UUID excludeRideId
    );

    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND r.vehicle.id = :vehicleId " +
           "AND r.bookingDate = :bookingDate " +
           "AND r.status IN (com.corporate.rides.enums.RideStatus.SCHEDULED, com.corporate.rides.enums.RideStatus.ASSIGNED, com.corporate.rides.enums.RideStatus.IN_PROGRESS) " +
           "AND (:excludeRideId IS NULL OR r.id <> :excludeRideId)")
    List<Ride> findVehicleRidesOnDate(
            @Param("orgId") UUID orgId,
            @Param("vehicleId") UUID vehicleId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("excludeRideId") UUID excludeRideId
    );

    // Feature 6 — Tracking & Active Trip Queries
    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND r.status IN (com.corporate.rides.enums.RideStatus.ASSIGNED, com.corporate.rides.enums.RideStatus.IN_PROGRESS) " +
           "ORDER BY r.bookingDate ASC, r.pickupTime ASC")
    List<Ride> findActiveTenantRides(@Param("orgId") UUID orgId);

    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND r.driver.user.id = :userId " +
           "AND r.status IN (com.corporate.rides.enums.RideStatus.ASSIGNED, com.corporate.rides.enums.RideStatus.IN_PROGRESS) " +
           "ORDER BY r.bookingDate ASC, r.pickupTime ASC")
    List<Ride> findAssignedDriverRidesByUserId(@Param("orgId") UUID orgId, @Param("userId") UUID userId);
}
