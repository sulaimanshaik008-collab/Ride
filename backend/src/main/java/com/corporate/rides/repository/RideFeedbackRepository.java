package com.corporate.rides.repository;

import com.corporate.rides.entity.RideFeedback;
import com.corporate.rides.enums.FeedbackReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RideFeedbackRepository extends JpaRepository<RideFeedback, UUID> {

    Optional<RideFeedback> findByRideId(UUID rideId);

    boolean existsByRideIdAndEmployeeId(UUID rideId, UUID employeeId);

    List<RideFeedback> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    Optional<RideFeedback> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByOrganizationId(UUID organizationId);

    long countByOrganizationIdAndRating(UUID organizationId, Integer rating);

    long countByOrganizationIdAndReviewStatus(UUID organizationId, FeedbackReviewStatus reviewStatus);

    @Query("SELECT AVG(f.rating) FROM RideFeedback f WHERE f.organization.id = :orgId")
    Double calculateAverageRatingByOrganizationId(@Param("orgId") UUID orgId);

    @Query("SELECT f FROM RideFeedback f WHERE f.organization.id = :orgId " +
           "AND (:rating IS NULL OR f.rating = :rating) " +
           "AND (:reviewStatus IS NULL OR f.reviewStatus = :reviewStatus) " +
           "AND (:driverId IS NULL OR f.driver.id = :driverId) " +
           "AND (:vehicleId IS NULL OR f.vehicle.id = :vehicleId) " +
           "AND (:search IS NULL OR LOWER(f.comments) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(f.employee.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(f.ride.bookingReference) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY f.createdAt DESC")
    Page<RideFeedback> searchTenantFeedback(
            @Param("orgId") UUID orgId,
            @Param("rating") Integer rating,
            @Param("reviewStatus") FeedbackReviewStatus reviewStatus,
            @Param("driverId") UUID driverId,
            @Param("vehicleId") UUID vehicleId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT f FROM RideFeedback f WHERE f.organization.id = :orgId AND f.driver.id = :driverId AND f.rating <= 2 AND f.createdAt >= :since")
    List<RideFeedback> findLowRatingsForDriverSince(
            @Param("orgId") UUID orgId,
            @Param("driverId") UUID driverId,
            @Param("since") OffsetDateTime since
    );

    @Query("SELECT f.driver.id, f.driver.user.fullName, COUNT(f.id), AVG(f.rating) " +
           "FROM RideFeedback f WHERE f.organization.id = :orgId AND f.driver IS NOT NULL " +
           "GROUP BY f.driver.id, f.driver.user.fullName HAVING COUNT(f.id) >= 1 ORDER BY AVG(f.rating) ASC")
    List<Object[]> findDriverPerformanceRankings(@Param("orgId") UUID orgId);

    @Query("SELECT f.vehicle.id, f.vehicle.registrationNumber, COUNT(f.id), AVG(f.rating) " +
           "FROM RideFeedback f WHERE f.organization.id = :orgId AND f.vehicle IS NOT NULL " +
           "GROUP BY f.vehicle.id, f.vehicle.registrationNumber HAVING AVG(f.rating) <= 3.0")
    List<Object[]> findVehicleInspectionAlerts(@Param("orgId") UUID orgId);

    @Query("SELECT f.ride.pickupLocation, f.ride.destination, COUNT(f.id), AVG(f.rating) " +
           "FROM RideFeedback f WHERE f.organization.id = :orgId " +
           "GROUP BY f.ride.pickupLocation, f.ride.destination HAVING AVG(f.rating) <= 3.0")
    List<Object[]> findRouteQualityAlerts(@Param("orgId") UUID orgId);
}
