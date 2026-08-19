package com.corporate.rides.repository;

import com.corporate.rides.entity.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnalyticsRepository extends JpaRepository<Ride, UUID> {

    @Query("SELECT r FROM Ride r WHERE r.organization.id = :orgId " +
           "AND (cast(:from as date) IS NULL OR r.bookingDate >= :from) " +
           "AND (cast(:to as date) IS NULL OR r.bookingDate <= :to)")
    List<Ride> findTenantRidesInDateRange(
            @Param("orgId") UUID orgId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("SELECT COUNT(DISTINCT r.employee.id) FROM Ride r WHERE r.organization.id = :orgId " +
           "AND (cast(:from as date) IS NULL OR r.bookingDate >= :from) " +
           "AND (cast(:to as date) IS NULL OR r.bookingDate <= :to)")
    long countUniquePassengers(
            @Param("orgId") UUID orgId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("SELECT r.pickupLocation, r.destination, COUNT(r), " +
           "SUM(CASE WHEN r.status = com.corporate.rides.enums.RideStatus.COMPLETED THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN r.status = com.corporate.rides.enums.RideStatus.CANCELLED THEN 1 ELSE 0 END) " +
           "FROM Ride r WHERE r.organization.id = :orgId " +
           "AND (cast(:from as date) IS NULL OR r.bookingDate >= :from) " +
           "AND (cast(:to as date) IS NULL OR r.bookingDate <= :to) " +
           "GROUP BY r.pickupLocation, r.destination " +
           "ORDER BY COUNT(r) DESC")
    List<Object[]> findRouteAnalytics(
            @Param("orgId") UUID orgId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );
}
