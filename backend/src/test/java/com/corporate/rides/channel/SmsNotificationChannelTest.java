package com.corporate.rides.channel;

import com.corporate.rides.entity.Notification;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.ChannelStatus;
import com.corporate.rides.enums.NotificationChannelType;
import com.corporate.rides.enums.NotificationType;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.provider.SmsDeliveryResult;
import com.corporate.rides.provider.SmsProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SmsNotificationChannelTest {

    @Mock
    private SmsProvider smsProvider;

    @InjectMocks
    private SmsNotificationChannel smsNotificationChannel;

    private User userWithPhone;
    private User userWithoutPhone;
    private User userWithInvalidPhone;
    private Ride ride;

    @BeforeEach
    void setUp() {
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("SMS Test Org")
                .code("SMS_ORG")
                .build();

        userWithPhone = User.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .email("sms.user@test.com")
                .fullName("SMS Recipient")
                .phoneNumber("+15551234567")
                .role(UserRole.EMPLOYEE)
                .build();

        userWithoutPhone = User.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .email("nophone@test.com")
                .fullName("No Phone User")
                .phoneNumber(null)
                .role(UserRole.EMPLOYEE)
                .build();

        userWithInvalidPhone = User.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .email("invalidphone@test.com")
                .fullName("Invalid Phone User")
                .phoneNumber("invalid-abc")
                .role(UserRole.EMPLOYEE)
                .build();

        ride = Ride.builder()
                .id(UUID.randomUUID())
                .bookingReference("RIDE-SMS-101")
                .build();
    }

    @Test
    void testSendNotification_ValidPhone_Success() {
        when(smsProvider.sendSms(anyString(), anyString()))
                .thenReturn(SmsDeliveryResult.delivered("SM123456789"));

        Notification notification = Notification.builder()
                .recipient(userWithPhone)
                .ride(ride)
                .notificationType(NotificationType.RIDE_SCHEDULED)
                .title("Ride Scheduled")
                .message("Your ride is scheduled.")
                .channel(NotificationChannelType.SMS)
                .build();

        ChannelStatus status = smsNotificationChannel.sendNotification(notification);

        assertEquals(ChannelStatus.DELIVERED, status);
        verify(smsProvider, times(1)).sendSms(eq("+15551234567"), anyString());
    }

    @Test
    void testSendNotification_MissingPhone_ReturnsNotConfigured() {
        Notification notification = Notification.builder()
                .recipient(userWithoutPhone)
                .ride(ride)
                .notificationType(NotificationType.RIDE_SCHEDULED)
                .title("Ride Scheduled")
                .message("Your ride is scheduled.")
                .channel(NotificationChannelType.SMS)
                .build();

        ChannelStatus status = smsNotificationChannel.sendNotification(notification);

        assertEquals(ChannelStatus.NOT_CONFIGURED, status);
        verify(smsProvider, never()).sendSms(anyString(), anyString());
    }

    @Test
    void testSendNotification_InvalidPhone_ReturnsFailed() {
        Notification notification = Notification.builder()
                .recipient(userWithInvalidPhone)
                .ride(ride)
                .notificationType(NotificationType.RIDE_SCHEDULED)
                .title("Ride Scheduled")
                .message("Your ride is scheduled.")
                .channel(NotificationChannelType.SMS)
                .build();

        ChannelStatus status = smsNotificationChannel.sendNotification(notification);

        assertEquals(ChannelStatus.FAILED, status);
        verify(smsProvider, never()).sendSms(anyString(), anyString());
    }
}
