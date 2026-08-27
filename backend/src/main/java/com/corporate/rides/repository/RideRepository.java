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
           "AND (cast(:bookingDate as date) IS NULL OR r.bookingDate = :bookingDate) " +
           "AND (LOWER(r.bookingReference) LIKE :searchPattern " +
           "     OR LOWER(r.employee.fullName) LIKE :searchPattern " +
           "     OR LOWER(r.pickupLocation) LIKE :searchPattern " +
           "     OR LOWER(r.destination) LIKE :searchPattern) " +
           "ORDER BY r.bookingDate DESC, r.pickupTime DESC")
    List<Ride> searchTenantScheduledRidesWithSearch(
            @Param("orgId") UUID orgId,
            @Param("searchPattern") String searchPattern,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("status") RideStatus status
    );

    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (cast(:bookingDate as date) IS NULL OR r.bookingDate = :bookingDate) " +
           "ORDER BY r.bookingDate DESC, r.pickupTime DESC")
    List<Ride> searchTenantScheduledRidesWithoutSearch(
            @Param("orgId") UUID orgId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("status") RideStatus status
    );

    // Feature 5 — Assignment Queries
    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND r.status IN (com.corporate.rides.enums.RideStatus.PENDING_APPROVAL, com.corporate.rides.enums.RideStatus.APPROVED, com.corporate.rides.enums.RideStatus.SCHEDULED, com.corporate.rides.enums.RideStatus.ASSIGNED) " +
           "AND (r.driver IS NULL OR r.vehicle IS NULL) " +
           "ORDER BY r.bookingDate ASC, r.pickupTime ASC, r.createdAt DESC")
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

    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND r.driver.user.id = :userId " +
           "AND r.bookingDate = :today " +
           "ORDER BY r.pickupTime ASC")
    List<Ride> findTodayRidesByDriverUserId(
            @Param("orgId") UUID orgId,
            @Param("userId") UUID userId,
            @Param("today") LocalDate today
    );

    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND r.driver.user.id = :userId " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (cast(:from as date) IS NULL OR r.bookingDate >= :from) " +
           "AND (cast(:to as date) IS NULL OR r.bookingDate <= :to) " +
           "ORDER BY r.bookingDate DESC, r.pickupTime DESC")
    List<Ride> findHistoryByDriverUserId(
            @Param("orgId") UUID orgId,
            @Param("userId") UUID userId,
            @Param("status") RideStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    // Feature 11 — Completed Trips Manager Reporting Queries
    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND r.status = com.corporate.rides.enums.RideStatus.COMPLETED " +
           "AND (:driverId IS NULL OR r.driver.id = :driverId) " +
           "AND (cast(:from as date) IS NULL OR r.bookingDate >= :from) " +
           "AND (cast(:to as date) IS NULL OR r.bookingDate <= :to) " +
           "AND (LOWER(r.bookingReference) LIKE :searchPattern " +
           "     OR LOWER(r.employee.fullName) LIKE :searchPattern " +
           "     OR (r.driver IS NOT NULL AND LOWER(r.driver.user.fullName) LIKE :searchPattern) " +
           "     OR LOWER(r.pickupLocation) LIKE :searchPattern " +
           "     OR LOWER(r.destination) LIKE :searchPattern) " +
           "ORDER BY coalesce(r.completedAt, r.updatedAt) DESC")
    List<Ride> findCompletedTenantRidesWithSearch(
            @Param("orgId") UUID orgId,
            @Param("searchPattern") String searchPattern,
            @Param("driverId") UUID driverId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND r.status = com.corporate.rides.enums.RideStatus.COMPLETED " +
           "AND (:driverId IS NULL OR r.driver.id = :driverId) " +
           "AND (cast(:from as date) IS NULL OR r.bookingDate >= :from) " +
           "AND (cast(:to as date) IS NULL OR r.bookingDate <= :to) " +
           "ORDER BY coalesce(r.completedAt, r.updatedAt) DESC")
    List<Ride> findCompletedTenantRidesWithoutSearch(
            @Param("orgId") UUID orgId,
            @Param("driverId") UUID driverId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );
}
