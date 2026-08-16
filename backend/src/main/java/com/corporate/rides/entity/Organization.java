package com.corporate.rides.entity;

import com.corporate.rides.enums.OrganizationStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(length = 255)
    private String address;

    @Column(length = 50)
    @Builder.Default
    private String timezone = "UTC";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private OrganizationStatus status = OrganizationStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = OffsetDateTime.now();
        }
        if (status == null) {
            status = OrganizationStatus.ACTIVE;
        }
        if (timezone == null) {
            timezone = "UTC";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
