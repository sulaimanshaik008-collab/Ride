package com.corporate.rides.repository;

import com.corporate.rides.entity.RideLocation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RideLocationRepository extends JpaRepository<RideLocation, UUID> {

    @Query("SELECT rl FROM RideLocation rl WHERE rl.ride.id = :rideId " +
           "AND rl.organization.id = :orgId " +
           "ORDER BY rl.recordedAt DESC, rl.createdAt DESC")
    List<RideLocation> findLocationsByRideIdAndOrganizationId(@Param("rideId") UUID rideId, @Param("orgId") UUID orgId);

    @Query("SELECT rl FROM RideLocation rl WHERE rl.ride.id = :rideId " +
           "AND rl.organization.id = :orgId " +
           "ORDER BY rl.recordedAt DESC, rl.createdAt DESC")
    List<RideLocation> findLatestLocationPageByRideIdAndOrganizationId(@Param("rideId") UUID rideId, @Param("orgId") UUID orgId, Pageable pageable);

    default Optional<RideLocation> findLatestLocationByRideIdAndOrganizationId(UUID rideId, UUID orgId) {
        List<RideLocation> list = findLatestLocationPageByRideIdAndOrganizationId(rideId, orgId, org.springframework.data.domain.PageRequest.of(0, 1));
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
