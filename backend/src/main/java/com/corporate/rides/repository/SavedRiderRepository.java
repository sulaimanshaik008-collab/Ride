package com.corporate.rides.repository;

import com.corporate.rides.entity.SavedRider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedRiderRepository extends JpaRepository<SavedRider, UUID> {
    List<SavedRider> findByOrganizationIdAndUserIdOrderByCreatedAtDesc(UUID organizationId, UUID userId);
    Optional<SavedRider> findByIdAndOrganizationIdAndUserId(UUID id, UUID organizationId, UUID userId);
}
