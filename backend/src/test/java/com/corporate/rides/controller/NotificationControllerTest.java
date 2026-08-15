package com.corporate.rides.controller;

import com.corporate.rides.entity.Notification;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.NotificationChannelType;
import com.corporate.rides.enums.NotificationType;
import com.corporate.rides.enums.RideStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.repository.NotificationRepository;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.RideRepository;
import com.corporate.rides.repository.UserRepository;
import com.corporate.rides.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    private Organization organization;
    private User employeeUser;
    private Ride ride;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Notif Ctrl Org")
                .code("NOTIF_CTRL_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        employeeUser = userRepository.save(User.builder()
                .organization(organization)
                .email("ctrl.notif.emp@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Notif Controller Employee")
                .role(UserRole.EMPLOYEE)
                .build());

        ride = rideRepository.save(Ride.builder()
                .bookingReference("RIDE-CTRL-NOTIF-999")
                .organization(organization)
                .employee(employeeUser)
                .pickupLocation("Tech Park")
                .destination("Airport")
                .bookingDate(LocalDate.now().plusDays(1))
                .pickupTime(LocalTime.of(8, 30))
                .status(RideStatus.SCHEDULED)
                .build());
    }

    @Test
    @DisplayName("GET /api/v1/notifications - User Retrieves Notifications")
    void getUserNotifications_Success() throws Exception {
        notificationService.createNotification(
                employeeUser,
                ride,
                NotificationType.RIDE_SCHEDULED,
                "Ride Scheduled",
                "Your ride has been scheduled.",
                NotificationChannelType.IN_APP
        );

        mockMvc.perform(get("/api/v1/notifications")
                        .header("X-User-Email", employeeUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].notificationType", is("RIDE_SCHEDULED")));
    }

    @Test
    @DisplayName("GET /api/v1/notifications/unread-count - Get Unread Count")
    void getUnreadCount_Success() throws Exception {
        notificationService.createNotification(
                employeeUser,
                ride,
                NotificationType.RIDE_SCHEDULED,
                "Ride Scheduled",
                "Your ride has been scheduled.",
                NotificationChannelType.IN_APP
        );

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("X-User-Email", employeeUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.unreadCount", is(1)));
    }

    @Test
    @DisplayName("PATCH /api/v1/notifications/{id}/read - Mark Single Notification As Read")
    void markAsRead_Success() throws Exception {
        Notification notification = notificationService.createNotification(
                employeeUser,
                ride,
                NotificationType.RIDE_SCHEDULED,
                "Ride Scheduled",
                "Your ride has been scheduled.",
                NotificationChannelType.IN_APP
        );

        mockMvc.perform(patch("/api/v1/notifications/{id}/read", notification.getId())
                        .header("X-User-Email", employeeUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isRead", is(true)));
    }

    @Test
    @DisplayName("PATCH /api/v1/notifications/read-all - Mark All As Read")
    void markAllAsRead_Success() throws Exception {
        notificationService.createNotification(
                employeeUser,
                ride,
                NotificationType.RIDE_SCHEDULED,
                "Ride Scheduled 1",
                "Message 1",
                NotificationChannelType.IN_APP
        );
        notificationService.createNotification(
                employeeUser,
                ride,
                NotificationType.DRIVER_ASSIGNED,
                "Driver Assigned",
                "Message 2",
                NotificationChannelType.IN_APP
        );

        mockMvc.perform(patch("/api/v1/notifications/read-all")
                        .header("X-User-Email", employeeUser.getEmail()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.markedCount", is(2)));
    }
}
