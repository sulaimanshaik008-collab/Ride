package com.corporate.rides.repository;

import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Vehicle;
import com.corporate.rides.enums.MaintenanceStatus;
import com.corporate.rides.enums.VehicleAvailability;
import com.corporate.rides.enums.VehicleStatus;
import com.corporate.rides.enums.VehicleType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
class VehicleDatabaseTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private VehicleRepository vehicleRepository;

    private Organization orgA;
    private Organization orgB;

    @BeforeEach
    void setUp() {
        orgA = Organization.builder()
                .name("Acme Corp")
                .code("ACME_V")
                .build();
        orgA = entityManager.persistAndFlush(orgA);

        orgB = Organization.builder()
                .name("TechCorp")
                .code("TECH_V")
                .build();
        orgB = entityManager.persistAndFlush(orgB);
    }

    @Nested
    @DisplayName("Schema & Basic Persistence Verification")
    class PersistenceVerification {

        @Test
        @DisplayName("Should persist and retrieve Vehicle entity with default statuses and timestamps")
        void shouldPersistAndRetrieveVehicle() {
            Vehicle vehicle = Vehicle.builder()
                    .organization(orgA)
                    .registrationNumber("REG-TEST-001")
                    .vehicleType(VehicleType.SEDAN)
                    .make("Toyota")
                    .model("Camry")
                    .manufacturingYear(2023)
                    .seatingCapacity(4)
                    .build();

            Vehicle saved = vehicleRepository.saveAndFlush(vehicle);
            entityManager.clear();

            Optional<Vehicle> found = vehicleRepository.findById(saved.getId());
            assertThat(found).isPresent();
            assertThat(found.get().getRegistrationNumber()).isEqualTo("REG-TEST-001");
            assertThat(found.get().getVehicleType()).isEqualTo(VehicleType.SEDAN);
            assertThat(found.get().getVehicleStatus()).isEqualTo(VehicleStatus.ACTIVE);
            assertThat(found.get().getAvailabilityStatus()).isEqualTo(VehicleAvailability.AVAILABLE);
            assertThat(found.get().getMaintenanceStatus()).isEqualTo(MaintenanceStatus.GOOD);
            assertThat(found.get().getCreatedAt()).isNotNull();
            assertThat(found.get().getUpdatedAt()).isNotNull();
            assertThat(found.get().getOrganization().getId()).isEqualTo(orgA.getId());
        }
    }

    @Nested
    @DisplayName("Constraints Verification")
    class ConstraintVerification {

        @Test
        @DisplayName("Should enforce Unique Constraint on (organization_id, registration_number)")
        void shouldEnforceUniqueOrganizationRegistrationConstraint() {
            Vehicle v1 = Vehicle.builder()
                    .organization(orgA)
                    .registrationNumber("REG-DUP-100")
                    .vehicleType(VehicleType.SUV)
                    .make("Ford")
                    .model("Explorer")
                    .seatingCapacity(6)
                    .build();
            vehicleRepository.saveAndFlush(v1);

            Vehicle v2 = Vehicle.builder()
                    .organization(orgA)
                    .registrationNumber("REG-DUP-100") // Duplicate registration in same org
                    .vehicleType(VehicleType.SEDAN)
                    .make("Honda")
                    .model("Civic")
                    .seatingCapacity(4)
                    .build();

            assertThatThrownBy(() -> vehicleRepository.saveAndFlush(v2))
                    .isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Should allow same registration number in DIFFERENT organizations")
        void shouldAllowSameRegistrationInDifferentOrganizations() {
            Vehicle vOrgA = Vehicle.builder()
                    .organization(orgA)
                    .registrationNumber("REG-SHARED-999")
                    .vehicleType(VehicleType.SEDAN)
                    .make("Nissan")
                    .model("Altima")
                    .seatingCapacity(4)
                    .build();
            vehicleRepository.saveAndFlush(vOrgA);

            Vehicle vOrgB = Vehicle.builder()
                    .organization(orgB)
                    .registrationNumber("REG-SHARED-999") // Same registration, different org
                    .vehicleType(VehicleType.VAN)
                    .make("Toyota")
                    .model("Sienna")
                    .seatingCapacity(7)
                    .build();

            Vehicle savedB = vehicleRepository.saveAndFlush(vOrgB);
            assertThat(savedB.getId()).isNotNull();
        }

        @Test
        @DisplayName("Should enforce NOT NULL constraints on mandatory fields")
        void shouldEnforceNotNullConstraints() {
            Vehicle vMissingReg = Vehicle.builder()
                    .organization(orgA)
                    .registrationNumber(null)
                    .vehicleType(VehicleType.SEDAN)
                    .make("Tesla")
                    .model("Model 3")
                    .seatingCapacity(4)
                    .build();

            assertThatThrownBy(() -> vehicleRepository.saveAndFlush(vMissingReg))
                    .isInstanceOf(DataIntegrityViolationException.class);
        }
    }

    @Nested
    @DisplayName("Tenant Isolation Verification")
    class TenantIsolationVerification {

        @Test
        @DisplayName("Should strictly isolate vehicle queries by organization_id")
        void shouldIsolateTenantVehicleQueries() {
            Vehicle vA1 = vehicleRepository.saveAndFlush(Vehicle.builder()
                    .organization(orgA)
                    .registrationNumber("REG-A-01")
                    .vehicleType(VehicleType.SEDAN)
                    .make("Toyota")
                    .model("Corolla")
                    .seatingCapacity(4)
                    .build());

            Vehicle vA2 = vehicleRepository.saveAndFlush(Vehicle.builder()
                    .organization(orgA)
                    .registrationNumber("REG-A-02")
                    .vehicleType(VehicleType.SUV)
                    .make("Toyota")
                    .model("RAV4")
                    .seatingCapacity(5)
                    .build());

            Vehicle vB1 = vehicleRepository.saveAndFlush(Vehicle.builder()
                    .organization(orgB)
                    .registrationNumber("REG-B-01")
                    .vehicleType(VehicleType.BUS)
                    .make("Volvo")
                    .model("9700")
                    .seatingCapacity(45)
                    .build());

            // Query Org A vehicles
            List<Vehicle> orgAVehicles = vehicleRepository.findByOrganizationId(orgA.getId());
            assertThat(orgAVehicles).hasSize(2);
            assertThat(orgAVehicles).extracting(Vehicle::getId).containsExactlyInAnyOrder(vA1.getId(), vA2.getId());

            // Query Org B vehicles
            List<Vehicle> orgBVehicles = vehicleRepository.findByOrganizationId(orgB.getId());
            assertThat(orgBVehicles).hasSize(1);
            assertThat(orgBVehicles.get(0).getId()).isEqualTo(vB1.getId());

            // Search tenant vehicles with org boundary check
            List<Vehicle> searchOrgA = vehicleRepository.searchTenantVehicles(orgA.getId(), null, null, null, null, null);
            assertThat(searchOrgA).hasSize(2);

            List<Vehicle> searchOrgB = vehicleRepository.searchTenantVehicles(orgB.getId(), null, null, null, null, null);
            assertThat(searchOrgB).hasSize(1);
        }
    }
}
