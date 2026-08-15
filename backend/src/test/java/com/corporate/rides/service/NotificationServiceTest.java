package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.NotificationResponseDto;
import com.corporate.rides.dto.UnreadCountResponseDto;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class NotificationServiceTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private RideRepository rideRepository;

    private Organization organization;
    private User employee;
    private User manager;
    private Ride ride;

    @BeforeEach
    void setUp() {
        organization = organizationRepository.save(Organization.builder()
                .name("Notification Test Org")
                .code("NOTIF_ORG_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        employee = userRepository.save(User.builder()
                .organization(organization)
                .email("emp.notif@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Notification Employee")
                .role(UserRole.EMPLOYEE)
                .build());

        manager = userRepository.save(User.builder()
                .organization(organization)
                .email("mgr.notif@" + UUID.randomUUID().toString().substring(0, 5) + ".com")
                .fullName("Notification Manager")
                .role(UserRole.TRANSPORT_MANAGER)
                .build());

        ride = rideRepository.save(Ride.builder()
                .bookingReference("RIDE-NOTIF-001")
                .organization(organization)
                .employee(employee)
                .pickupLocation("Point A")
                .destination("Point B")
                .bookingDate(LocalDate.now().plusDays(1))
                .pickupTime(LocalTime.of(10, 0))
                .status(RideStatus.PENDING_APPROVAL)
                .build());

        UserPrincipal principal = UserPrincipal.builder()
                .userId(employee.getId())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .email(employee.getEmail())
                .fullName(employee.getFullName())
                .role(UserRole.EMPLOYEE)
                .build();

        UserContextHolder.setContext(principal);
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    @Test
    void testCreateNotification_Success() {
        Notification notification = notificationService.createNotification(
                employee,
                ride,
                NotificationType.RIDE_BOOKED,
                "Ride Booking Submitted",
                "Your ride request has been submitted.",
                NotificationChannelType.IN_APP
        );

        assertNotNull(notification);
        assertNotNull(notification.getId());
        assertEquals(NotificationType.RIDE_BOOKED, notification.getNotificationType());
        assertFalse(notification.getIsRead());
    }

    @Test
    void testGetUserNotifications_AndUnreadCount() {
        notificationService.createNotification(
                employee,
                ride,
                NotificationType.RIDE_BOOKED,
                "Ride 1",
                "Ride 1 message",
                NotificationChannelType.IN_APP
        );

        notificationService.createNotification(
                employee,
                ride,
                NotificationType.RIDE_SCHEDULED,
                "Ride 2",
                "Ride 2 message",
                NotificationChannelType.IN_APP
        );

        Page<NotificationResponseDto> page = notificationService.getUserNotifications(PageRequest.of(0, 10), false);
        assertEquals(2, page.getTotalElements());

        UnreadCountResponseDto unreadCount = notificationService.getUnreadCount();
        assertEquals(2, unreadCount.getUnreadCount());
    }

    @Test
    void testMarkAsRead_Success() {
        Notification notification = notificationService.createNotification(
                employee,
                ride,
                NotificationType.RIDE_BOOKED,
                "Ride 1",
                "Ride 1 message",
                NotificationChannelType.IN_APP
        );

        NotificationResponseDto response = notificationService.markAsRead(notification.getId());
        assertTrue(response.getIsRead());
        assertNotNull(response.getReadAt());

        UnreadCountResponseDto unreadCount = notificationService.getUnreadCount();
        assertEquals(0, unreadCount.getUnreadCount());
    }

    @Test
    void testMarkAllAsRead_Success() {
        notificationService.createNotification(
                employee,
                ride,
                NotificationType.RIDE_BOOKED,
                "Ride 1",
                "Ride 1 message",
                NotificationChannelType.IN_APP
        );
        notificationService.createNotification(
                employee,
                ride,
                NotificationType.RIDE_SCHEDULED,
                "Ride 2",
                "Ride 2 message",
                NotificationChannelType.IN_APP
        );

        int updated = notificationService.markAllAsRead();
        assertEquals(2, updated);

        UnreadCountResponseDto unreadCount = notificationService.getUnreadCount();
        assertEquals(0, unreadCount.getUnreadCount());
    }
}
