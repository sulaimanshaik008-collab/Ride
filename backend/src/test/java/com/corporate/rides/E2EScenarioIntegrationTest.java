package com.corporate.rides;

import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Driver;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.entity.Vehicle;
import com.corporate.rides.enums.*;
import com.corporate.rides.repository.*;
import com.corporate.rides.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class E2EScenarioIntegrationTest {

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
    private RateLimiterService rateLimiterService;

    private Organization org;
    private User employee;
    private User driverUser;
    private User manager;
    private User admin;
    private Driver driver;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        rateLimiterService.reset();

        org = organizationRepository.findByCode("E2E_CORP").orElseGet(() ->
                organizationRepository.save(Organization.builder()
                        .name("E2E Corporation")
                        .code("E2E_CORP")
                        .status(OrganizationStatus.ACTIVE)
                        .build()));

        employee = userRepository.findByEmail("employee.e2e@corporate.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .organization(org)
                        .email("employee.e2e@corporate.com")
                        .fullName("E2E Employee")
                        .role(UserRole.EMPLOYEE)
                        .status(UserStatus.ACTIVE)
                        .verificationStatus(VerificationStatus.VERIFIED)
                        .build()));

        driverUser = userRepository.findByEmail("driver.e2e@corporate.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .organization(org)
                        .email("driver.e2e@corporate.com")
                        .fullName("E2E Driver")
                        .role(UserRole.DRIVER)
                        .status(UserStatus.ACTIVE)
                        .verificationStatus(VerificationStatus.VERIFIED)
                        .build()));

        manager = userRepository.findByEmail("manager.e2e@corporate.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .organization(org)
                        .email("manager.e2e@corporate.com")
                        .fullName("E2E Manager")
                        .role(UserRole.TRANSPORT_MANAGER)
                        .status(UserStatus.ACTIVE)
                        .verificationStatus(VerificationStatus.VERIFIED)
                        .build()));

        admin = userRepository.findByEmail("admin.e2e@corporate.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .organization(org)
                        .email("admin.e2e@corporate.com")
                        .fullName("E2E Admin")
                        .role(UserRole.CORPORATE_ADMIN)
                        .status(UserStatus.ACTIVE)
                        .verificationStatus(VerificationStatus.VERIFIED)
                        .build()));

        driver = driverRepository.findByUserId(driverUser.getId()).orElseGet(() ->
                driverRepository.save(Driver.builder()
                        .organization(org)
                        .user(driverUser)
                        .licenseNumber("LIC-E2E-1001")
                        .licenseExpiryDate(LocalDate.now().plusYears(2))
                        .driverStatus(DriverStatus.ACTIVE)
                        .availabilityStatus(DriverAvailability.AVAILABLE)
                        .build()));

        vehicle = vehicleRepository.findByOrganizationId(org.getId()).stream()
                .filter(v -> "VEH-E2E-01".equals(v.getRegistrationNumber()))
                .findFirst()
                .orElseGet(() -> vehicleRepository.save(Vehicle.builder()
                        .organization(org)
                        .registrationNumber("VEH-E2E-01")
                        .make("Toyota")
                        .model("Innova")
                        .vehicleType(VehicleType.SUV)
                        .seatingCapacity(6)
                        .vehicleStatus(VehicleStatus.ACTIVE)
                        .availabilityStatus(VehicleAvailability.AVAILABLE)
                        .maintenanceStatus(MaintenanceStatus.GOOD)
                        .build()));
    }

    @Test
    @DisplayName("SCENARIO 1 & 2: Full Lifecycle — Book -> Schedule -> Assign -> Start -> GPS -> Complete -> Feedback -> Analytics")
    void testFullRideLifecycle() throws Exception {
        // 1. Employee books ride
        CreateRideRequestDto bookingReq = CreateRideRequestDto.builder()
                .pickupLocation("Tech Park, Block B")
                .destination("Central Airport Terminal 3")
                .pickupLatitude(12.9716)
                .pickupLongitude(77.5946)
                .destinationLatitude(13.1986)
                .destinationLongitude(77.7066)
                .bookingDate(LocalDate.now().plusDays(1))
                .pickupTime(LocalTime.of(9, 30))
                .bookingNotes("Luggage assistance needed")
                .build();

        MvcResult bookResult = mockMvc.perform(post("/api/v1/rides")
                        .header("X-User-Email", employee.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PENDING_APPROVAL"))
                .andReturn();

        String respStr = bookResult.getResponse().getContentAsString();
        UUID rideId = UUID.fromString(objectMapper.readTree(respStr).get("data").get("id").asText());

        // 2. Manager schedules the ride
        ScheduleRideRequestDto schedReq = ScheduleRideRequestDto.builder()
                .scheduledDate(LocalDate.now().plusDays(1))
                .scheduledPickupTime(LocalTime.of(9, 30))
                .notes("Approved and scheduled")
                .build();

        mockMvc.perform(post("/api/v1/rides/" + rideId + "/schedule")
                        .header("X-User-Email", manager.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(schedReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SCHEDULED"));

        // 3. Manager assigns driver and vehicle
        AssignRideRequestDto assignReq = AssignRideRequestDto.builder()
                .driverId(driver.getId())
                .vehicleId(vehicle.getId())
                .build();

        mockMvc.perform(post("/api/v1/rides/" + rideId + "/assign")
                        .header("X-User-Email", manager.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ASSIGNED"));

        // 4. Driver accepts assignment and verifies passenger
        mockMvc.perform(post("/api/v1/rides/" + rideId + "/accept")
                        .header("X-User-Email", driverUser.getEmail()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/rides/" + rideId + "/verify-employee")
                        .header("X-User-Email", driverUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(EmployeeVerificationRequestDto.builder()
                                .employeeIdentifier(employee.getEmail())
                                .verificationMethod("EMAIL")
                                .build())))
                .andExpect(status().isOk());

        // 5. Driver starts trip
        mockMvc.perform(post("/api/v1/rides/" + rideId + "/start")
                        .header("X-User-Email", driverUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));

        // 6. Driver updates GPS location
        LocationUpdateDto locationReq = LocationUpdateDto.builder()
                .latitude(13.0100)
                .longitude(77.6200)
                .heading(45.0)
                .speed(40.5)
                .accuracy(5.0)
                .build();

        mockMvc.perform(post("/api/v1/rides/" + rideId + "/location")
                        .header("X-User-Email", driverUser.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(locationReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.latitude").value(13.0100));

        // 7. Driver completes trip
        mockMvc.perform(post("/api/v1/rides/" + rideId + "/complete")
                        .header("X-User-Email", driverUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        // 8. Employee submits feedback and rating
        CreateRideFeedbackRequestDto feedbackReq = CreateRideFeedbackRequestDto.builder()
                .rideId(rideId)
                .rating(5)
                .comments("Outstanding driver and clean car!")
                .build();

        mockMvc.perform(post("/api/v1/feedback")
                        .header("X-User-Email", employee.getEmail())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(feedbackReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.rating").value(5))
                .andExpect(jsonPath("$.data.reviewStatus").value("NORMAL"));

        // 9. Verify Analytics reflect completed ride
        mockMvc.perform(get("/api/v1/analytics/overview")
                        .header("X-User-Email", manager.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completedRides").isNumber());
    }

    @Test
    @DisplayName("SCENARIO 3: Transport Manager Live Monitoring & Feedback Review")
    void testManagerMonitoringAndFeedback() throws Exception {
        mockMvc.perform(get("/api/v1/rides/scheduled")
                        .header("X-User-Email", manager.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        mockMvc.perform(get("/api/v1/feedback")
                        .header("X-User-Email", manager.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("SCENARIO 4: Corporate Admin Organization Management")
    void testCorporateAdminOrgManagement() throws Exception {
        mockMvc.perform(get("/api/v1/organizations/current")
                        .header("X-User-Email", admin.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.organizationCode").value("E2E_CORP"));

        mockMvc.perform(get("/api/v1/organizations/current/summary")
                        .header("X-User-Email", admin.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUsers").isNumber());
    }
}
