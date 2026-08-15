package com.corporate.rides.repository;

import com.corporate.rides.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("SELECT n FROM Notification n WHERE n.organization.id = :orgId AND n.recipient.id = :userId ORDER BY n.createdAt DESC")
    Page<Notification> findByOrganizationIdAndRecipientId(@Param("orgId") UUID orgId, @Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.organization.id = :orgId AND n.recipient.id = :userId AND n.isRead = false ORDER BY n.createdAt DESC")
    Page<Notification> findUnreadByOrganizationIdAndRecipientId(@Param("orgId") UUID orgId, @Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.organization.id = :orgId AND n.recipient.id = :userId AND n.isRead = false")
    long countUnreadByOrganizationIdAndRecipientId(@Param("orgId") UUID orgId, @Param("userId") UUID userId);

    Optional<Notification> findByIdAndOrganizationIdAndRecipientId(UUID id, UUID organizationId, UUID recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.organization.id = :orgId AND n.recipient.id = :userId AND n.isRead = false")
    int markAllAsRead(@Param("orgId") UUID orgId, @Param("userId") UUID userId, @Param("readAt") OffsetDateTime readAt);
}
