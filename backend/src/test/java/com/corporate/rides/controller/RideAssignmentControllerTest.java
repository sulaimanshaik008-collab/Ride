package com.corporate.rides.controller;

import com.corporate.rides.dto.*;
import com.corporate.rides.entity.*;
import com.corporate.rides.enums.*;
import com.corporate.rides.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RideAssignmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private RideRepository rideRepository;

    private Organization organization;
    private User managerUser;
    private User employeeUser;
    private Driver driver;
    private Vehicle vehicle;
    private Ride scheduledRide;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Assign Controller Org")
                .code("ASSIGN_CTRL_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        managerUser = userRepository.save(User.builder()
                .organization(organization)
                .email("ctrl.mgr@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Assign Transport Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        employeeUser = userRepository.save(User.builder()
                .organization(organization)
                .email("ctrl.emp@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Assign Regular Employee")
                .role(UserRole.EMPLOYEE)
                .build());

        User driverUser = userRepository.save(User.builder()
                .organization(organization)
                .email("ctrl.drv@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Ctrl Fleet Driver")
                .role(UserRole.DRIVER)
                .build());

        driver = driverRepository.save(Driver.builder()
                .user(driverUser)
                .organization(organization)
                .licenseNumber("DL-CTRL-999")
                .licenseExpiryDate(LocalDate.now().plusYears(2))
                .driverStatus(DriverStatus.ACTIVE)
                .availabilityStatus(DriverAvailability.AVAILABLE)
                .build());

        vehicle = vehicleRepository.save(Vehicle.builder()
                .organization(organization)
                .registrationNumber("KA-02-CTRL-99")
                .vehicleType(VehicleType.SUV)
                .make("Hyundai")
                .model("Creta")
                .seatingCapacity(5)
                .vehicleStatus(VehicleStatus.ACTIVE)
                .availabilityStatus(VehicleAvailability.AVAILABLE)
                .maintenanceStatus(MaintenanceStatus.GOOD)
                .build());

        scheduledRide = rideRepository.save(Ride.builder()
                .bookingReference("RIDE-CTRL-999")
                .organization(organization)
                .employee(employeeUser)
                .pickupLocation("South End Circle")
                .destination("Electronic City Phase 1")
                .bookingDate(LocalDate.now().plusDays(1))
                .pickupTime(LocalTime.of(11, 0))
                .status(RideStatus.SCHEDULED)
                .build());
    }

    @Test
    @DisplayName("GET /api/v1/rides/assignment-pending - Success by Manager")
    void getPendingAssignmentRides_Success() throws Exception {
        mockMvc.perform(get("/api/v1/rides/assignment-pending")
                        .header("X-User-Email", managerUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].bookingReference", is("RIDE-CTRL-999")));
    }

    @Test
    @DisplayName("GET /api/v1/rides/{id}/assignment-options - Fetch Eligible Drivers & Vehicles")
    void getAssignmentOptions_Success() throws Exception {
        mockMvc.perform(get("/api/v1/rides/{id}/assignment-options", scheduledRide.getId())
                        .header("X-User-Email", managerUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.eligibleDrivers", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.eligibleVehicles", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("POST /api/v1/rides/{id}/assign - Assign Driver and Vehicle")
    void assignRideResources_Success() throws Exception {
        AssignRideRequestDto request = AssignRideRequestDto.builder()
                .driverId(driver.getId())
                .vehicleId(vehicle.getId())
                .build();

        mockMvc.perform(post("/api/v1/rides/{id}/assign", scheduledRide.getId())
                        .header("X-User-Email", managerUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("ASSIGNED")))
                .andExpect(jsonPath("$.data.driverId", is(driver.getId().toString())))
                .andExpect(jsonPath("$.data.vehicleId", is(vehicle.getId().toString())));
    }

    @Test
    @DisplayName("DELETE /api/v1/rides/{id}/assignment - Unassign Resources")
    void unassignRideResources_Success() throws Exception {
        scheduledRide.setDriver(driver);
        scheduledRide.setVehicle(vehicle);
        scheduledRide.setStatus(RideStatus.ASSIGNED);
        rideRepository.save(scheduledRide);

        mockMvc.perform(delete("/api/v1/rides/{id}/assignment", scheduledRide.getId())
                        .header("X-User-Email", managerUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("SCHEDULED")))
                .andExpect(jsonPath("$.data.driverId", nullValue()))
                .andExpect(jsonPath("$.data.vehicleId", nullValue()));
    }
}
