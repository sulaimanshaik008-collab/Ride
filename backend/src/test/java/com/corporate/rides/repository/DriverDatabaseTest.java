package com.corporate.rides.repository;

import com.corporate.rides.entity.Driver;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
class DriverDatabaseTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private Organization orgA;
    private Organization orgB;

    private User userDriverA1;
    private User userDriverA2;
    private User userDriverB1;

    @BeforeEach
    void setUp() {
        orgA = Organization.builder()
                .name("Acme Corp")
                .code("ACME")
                .build();
        orgA = entityManager.persistAndFlush(orgA);

        orgB = Organization.builder()
                .name("TechCorp")
                .code("TECH")
                .build();
        orgB = entityManager.persistAndFlush(orgB);

        userDriverA1 = User.builder()
                .organization(orgA)
                .email("driver1@acme.com")
                .fullName("Acme Driver One")
                .phoneNumber("+111111111")
                .department("Fleet")
                .role(UserRole.DRIVER)
                .build();
        userDriverA1 = entityManager.persistAndFlush(userDriverA1);

        userDriverA2 = User.builder()
                .organization(orgA)
                .email("driver2@acme.com")
                .fullName("Acme Driver Two")
                .phoneNumber("+122222222")
                .department("Fleet")
                .role(UserRole.DRIVER)
                .build();
        userDriverA2 = entityManager.persistAndFlush(userDriverA2);

        userDriverB1 = User.builder()
                .organization(orgB)
                .email("driver1@techcorp.com")
                .fullName("TechCorp Driver One")
                .phoneNumber("+133333333")
                .department("Transport")
                .role(UserRole.DRIVER)
                .build();
        userDriverB1 = entityManager.persistAndFlush(userDriverB1);
    }

    @Nested
    @DisplayName("Schema & Basic Persistence Verification")
    class PersistenceVerification {

        @Test
        @DisplayName("Should persist and retrieve Driver entity with default statuses and timestamps")
        void shouldPersistAndRetrieveDriver() {
            Driver driver = Driver.builder()
                    .user(userDriverA1)
                    .organization(orgA)
                    .licenseNumber("DL-ACME-001")
                    .licenseExpiryDate(LocalDate.now().plusYears(2))
                    .build();

            Driver saved = driverRepository.saveAndFlush(driver);
            entityManager.clear();

            Optional<Driver> found = driverRepository.findById(saved.getId());
            assertThat(found).isPresent();
            assertThat(found.get().getLicenseNumber()).isEqualTo("DL-ACME-001");
            assertThat(found.get().getDriverStatus()).isEqualTo(DriverStatus.ACTIVE);
            assertThat(found.get().getAvailabilityStatus()).isEqualTo(DriverAvailability.AVAILABLE);
            assertThat(found.get().getCreatedAt()).isNotNull();
            assertThat(found.get().getUpdatedAt()).isNotNull();
            assertThat(found.get().getUser().getId()).isEqualTo(userDriverA1.getId());
            assertThat(found.get().getOrganization().getId()).isEqualTo(orgA.getId());
        }
    }

    @Nested
    @DisplayName("Constraints Verification")
    class ConstraintVerification {

        @Test
        @DisplayName("Should enforce Unique Constraint on (organization_id, license_number)")
        void shouldEnforceUniqueOrganizationLicenseConstraint() {
            Driver driver1 = Driver.builder()
                    .user(userDriverA1)
                    .organization(orgA)
                    .licenseNumber("DL-DUP-123")
                    .licenseExpiryDate(LocalDate.now().plusYears(1))
                    .build();
            driverRepository.saveAndFlush(driver1);

            Driver driver2 = Driver.builder()
                    .user(userDriverA2)
                    .organization(orgA)
                    .licenseNumber("DL-DUP-123") // Duplicate license in same org
                    .licenseExpiryDate(LocalDate.now().plusYears(1))
                    .build();

            assertThatThrownBy(() -> driverRepository.saveAndFlush(driver2))
                    .isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Should allow same license number in DIFFERENT organizations")
        void shouldAllowSameLicenseInDifferentOrganizations() {
            Driver driverOrgA = Driver.builder()
                    .user(userDriverA1)
                    .organization(orgA)
                    .licenseNumber("DL-SHARED-999")
                    .licenseExpiryDate(LocalDate.now().plusYears(1))
                    .build();
            driverRepository.saveAndFlush(driverOrgA);

            Driver driverOrgB = Driver.builder()
                    .user(userDriverB1)
                    .organization(orgB)
                    .licenseNumber("DL-SHARED-999") // Same license, different org
                    .licenseExpiryDate(LocalDate.now().plusYears(1))
                    .build();

            Driver savedB = driverRepository.saveAndFlush(driverOrgB);
            assertThat(savedB.getId()).isNotNull();
        }

        @Test
        @DisplayName("Should enforce 1-to-1 Unique Constraint on user_id")
        void shouldEnforceOneToOneUserConstraint() {
            Driver driver1 = Driver.builder()
                    .user(userDriverA1)
                    .organization(orgA)
                    .licenseNumber("DL-ACME-100")
                    .licenseExpiryDate(LocalDate.now().plusYears(1))
                    .build();
            driverRepository.saveAndFlush(driver1);

            Driver driver2 = Driver.builder()
                    .user(userDriverA1) // Same user_id
                    .organization(orgA)
                    .licenseNumber("DL-ACME-101")
                    .licenseExpiryDate(LocalDate.now().plusYears(1))
                    .build();

            assertThatThrownBy(() -> driverRepository.saveAndFlush(driver2))
                    .isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Should enforce NOT NULL constraints on mandatory fields")
        void shouldEnforceNotNullConstraints() {
            Driver driverMissingLicense = Driver.builder()
                    .user(userDriverA1)
                    .organization(orgA)
                    .licenseNumber(null)
                    .licenseExpiryDate(LocalDate.now().plusYears(1))
                    .build();

            assertThatThrownBy(() -> driverRepository.saveAndFlush(driverMissingLicense))
                    .isInstanceOf(DataIntegrityViolationException.class);
        }
    }

    @Nested
    @DisplayName("Tenant Isolation Verification")
    class TenantIsolationVerification {

        @Test
        @DisplayName("Should strictly isolate driver queries by organization_id")
        void shouldIsolateTenantDriverQueries() {
            Driver driverA1 = driverRepository.saveAndFlush(Driver.builder()
                    .user(userDriverA1)
                    .organization(orgA)
                    .licenseNumber("DL-ACME-001")
                    .licenseExpiryDate(LocalDate.now().plusYears(2))
                    .build());

            Driver driverA2 = driverRepository.saveAndFlush(Driver.builder()
                    .user(userDriverA2)
                    .organization(orgA)
                    .licenseNumber("DL-ACME-002")
                    .licenseExpiryDate(LocalDate.now().plusYears(2))
                    .build());

            Driver driverB1 = driverRepository.saveAndFlush(Driver.builder()
                    .user(userDriverB1)
                    .organization(orgB)
                    .licenseNumber("DL-TECH-001")
                    .licenseExpiryDate(LocalDate.now().plusYears(2))
                    .build());

            // Query Org A drivers
            List<Driver> acmeDrivers = driverRepository.findByOrganizationId(orgA.getId());
            assertThat(acmeDrivers).hasSize(2);
            assertThat(acmeDrivers).extracting(Driver::getId).containsExactlyInAnyOrder(driverA1.getId(), driverA2.getId());
            assertThat(acmeDrivers).extracting(d -> d.getOrganization().getId()).containsOnly(orgA.getId());

            // Query Org B drivers
            List<Driver> techDrivers = driverRepository.findByOrganizationId(orgB.getId());
            assertThat(techDrivers).hasSize(1);
            assertThat(techDrivers.get(0).getId()).isEqualTo(driverB1.getId());
            assertThat(techDrivers.get(0).getOrganization().getId()).isEqualTo(orgB.getId());

            // Search tenant drivers with org boundary check
            List<Driver> searchOrgA = driverRepository.searchTenantDrivers(orgA.getId(), null, null, null);
            assertThat(searchOrgA).hasSize(2);
            assertThat(searchOrgA).extracting(d -> d.getOrganization().getId()).containsOnly(orgA.getId());

            List<Driver> searchOrgB = driverRepository.searchTenantDrivers(orgB.getId(), null, null, null);
            assertThat(searchOrgB).hasSize(1);
            assertThat(searchOrgB.get(0).getOrganization().getId()).isEqualTo(orgB.getId());
        }
    }
}
