package com.corporate.rides.repository;

import com.corporate.rides.entity.User;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    List<User> findByOrganizationId(UUID organizationId);
    Optional<User> findByIdAndOrganizationId(UUID id, UUID organizationId);
    long countByOrganizationIdAndRoleAndStatus(UUID organizationId, UserRole role, UserStatus status);
    long countByOrganizationIdAndRole(UUID organizationId, UserRole role);
    long countByOrganizationIdAndStatus(UUID organizationId, UserStatus status);
    long countByOrganizationId(UUID organizationId);

    @Query("SELECT u FROM User u WHERE u.organization.id = :organizationId " +
           "AND (:role IS NULL OR u.role = :role) " +
           "AND (:status IS NULL OR u.status = :status) " +
           "AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.department) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchOrganizationUsers(
            @Param("organizationId") UUID organizationId,
            @Param("role") UserRole role,
            @Param("status") UserStatus status,
            @Param("search") String search,
            Pageable pageable
    );
}
