package com.corporate.rides.channel;

import com.corporate.rides.entity.Notification;
import com.corporate.rides.enums.ChannelStatus;
import com.corporate.rides.enums.NotificationChannelType;
import com.corporate.rides.provider.SmsDeliveryResult;
import com.corporate.rides.provider.SmsProvider;
import com.corporate.rides.util.PhoneNumberValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SmsNotificationChannel implements NotificationChannel {

    private final SmsProvider smsProvider;

    @Override
    public NotificationChannelType getChannelType() {
        return NotificationChannelType.SMS;
    }

    @Override
    public ChannelStatus sendNotification(Notification notification) {
        if (notification == null || notification.getRecipient() == null) {
            log.warn("Cannot send SMS: notification or recipient is null");
            return ChannelStatus.FAILED;
        }

        String rawPhone = notification.getRecipient().getPhoneNumber();
        if (rawPhone == null || rawPhone.isBlank()) {
            log.info("Recipient {} has no registered phone number. Skipping SMS.", notification.getRecipient().getEmail());
            return ChannelStatus.NOT_CONFIGURED;
        }

        String normalizedPhone = PhoneNumberValidator.normalize(rawPhone);
        if (!PhoneNumberValidator.isValid(normalizedPhone)) {
            log.warn("Recipient {} has invalid phone number format: {}", notification.getRecipient().getEmail(), PhoneNumberValidator.mask(rawPhone));
            return ChannelStatus.FAILED;
        }

        String smsText = String.format("[%s] %s: %s",
                notification.getTitle(),
                notification.getRide() != null ? notification.getRide().getBookingReference() : "Corporate Ride",
                notification.getMessage()
        );

        SmsDeliveryResult result = smsProvider.sendSms(normalizedPhone, smsText);
        return result.getStatus();
    }
}
