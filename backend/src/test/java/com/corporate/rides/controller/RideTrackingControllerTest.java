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
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RideTrackingControllerTest {

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
    private User driverUser;
    private Driver driver;
    private Vehicle vehicle;
    private Ride assignedRide;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Tracking Ctrl Org")
                .code("TRACK_CTRL_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        managerUser = userRepository.save(User.builder()
                .organization(organization)
                .email("ctrl.track.mgr@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Tracking Controller Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        employeeUser = userRepository.save(User.builder()
                .organization(organization)
                .email("ctrl.track.emp@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Tracking Controller Employee")
                .role(UserRole.EMPLOYEE)
                .build());

        driverUser = userRepository.save(User.builder()
                .organization(organization)
                .email("ctrl.track.drv@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Ctrl Fleet Driver")
                .role(UserRole.DRIVER)
                .build());

        driver = driverRepository.save(Driver.builder()
                .user(driverUser)
                .organization(organization)
                .licenseNumber("DL-CTRL-TRACK-777")
                .licenseExpiryDate(LocalDate.now().plusYears(2))
                .driverStatus(DriverStatus.ACTIVE)
                .availabilityStatus(DriverAvailability.AVAILABLE)
                .build());

        vehicle = vehicleRepository.save(Vehicle.builder()
                .organization(organization)
                .registrationNumber("KA-04-CTRL-77")
                .vehicleType(VehicleType.SEDAN)
                .make("Honda")
                .model("City")
                .seatingCapacity(4)
                .vehicleStatus(VehicleStatus.ACTIVE)
                .availabilityStatus(VehicleAvailability.AVAILABLE)
                .maintenanceStatus(MaintenanceStatus.GOOD)
                .build());

        assignedRide = rideRepository.save(Ride.builder()
                .bookingReference("RIDE-CTRL-TRACK-777")
                .organization(organization)
                .employee(employeeUser)
                .driver(driver)
                .vehicle(vehicle)
                .pickupLocation("MG Road Station")
                .destination("Whitefield ITPL")
                .bookingDate(LocalDate.now())
                .pickupTime(LocalTime.of(9, 30))
                .status(RideStatus.ASSIGNED)
                .build());
    }

    @Test
    @DisplayName("POST /api/v1/rides/{id}/start - Driver Starts Assigned Trip")
    void startTrip_Success() throws Exception {
        mockMvc.perform(post("/api/v1/rides/{id}/start", assignedRide.getId())
                        .header("X-User-Email", driverUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")));
    }

    @Test
    @DisplayName("POST /api/v1/rides/{id}/location - Driver Posts Live Coordinates")
    void updateLocation_Success() throws Exception {
        assignedRide.setStatus(RideStatus.IN_PROGRESS);
        rideRepository.save(assignedRide);

        LocationUpdateDto dto = LocationUpdateDto.builder()
                .latitude(12.9783)
                .longitude(77.6408)
                .accuracy(6.0)
                .speed(42.0)
                .heading(95.0)
                .recordedAt(OffsetDateTime.now())
                .build();

        mockMvc.perform(post("/api/v1/rides/{id}/location", assignedRide.getId())
                        .header("X-User-Email", driverUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.latitude", is(12.9783)))
                .andExpect(jsonPath("$.data.longitude", is(77.6408)));
    }

    @Test
    @DisplayName("GET /api/v1/rides/{id}/location - Employee Views Live Location")
    void getLatestLocation_EmployeeAccess_Success() throws Exception {
        assignedRide.setStatus(RideStatus.IN_PROGRESS);
        rideRepository.save(assignedRide);

        mockMvc.perform(get("/api/v1/rides/{id}/location", assignedRide.getId())
                        .header("X-User-Email", employeeUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.bookingReference", is("RIDE-CTRL-TRACK-777")));
    }

    @Test
    @DisplayName("POST /api/v1/rides/{id}/complete - Complete Trip")
    void completeTrip_Success() throws Exception {
        assignedRide.setStatus(RideStatus.IN_PROGRESS);
        rideRepository.save(assignedRide);

        mockMvc.perform(post("/api/v1/rides/{id}/complete", assignedRide.getId())
                        .header("X-User-Email", driverUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("COMPLETED")));
    }

    @Test
    @DisplayName("GET /api/v1/rides/active - Manager Views Active Trips")
    void getActiveTrips_ManagerSuccess() throws Exception {
        assignedRide.setStatus(RideStatus.IN_PROGRESS);
        rideRepository.save(assignedRide);

        mockMvc.perform(get("/api/v1/rides/active")
                        .header("X-User-Email", managerUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].bookingReference", is("RIDE-CTRL-TRACK-777")));
    }
}
