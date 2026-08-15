package com.corporate.rides.channel;

import com.corporate.rides.entity.Notification;
import com.corporate.rides.enums.ChannelStatus;
import com.corporate.rides.enums.NotificationChannelType;
import org.springframework.stereotype.Component;

@Component
public class EmailNotificationChannel implements NotificationChannel {

    @Override
    public NotificationChannelType getChannelType() {
        return NotificationChannelType.EMAIL;
    }

    @Override
    public ChannelStatus sendNotification(Notification notification) {
        // External SMTP/Email provider abstraction layer
        // When SMTP is not configured in application properties, report NOT_CONFIGURED
        return ChannelStatus.NOT_CONFIGURED;
    }
}
