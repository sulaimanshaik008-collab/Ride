package com.corporate.rides.channel;

import com.corporate.rides.entity.Notification;
import com.corporate.rides.enums.ChannelStatus;
import com.corporate.rides.enums.NotificationChannelType;
import org.springframework.stereotype.Component;

@Component
public class InAppNotificationChannel implements NotificationChannel {

    @Override
    public NotificationChannelType getChannelType() {
        return NotificationChannelType.IN_APP;
    }

    @Override
    public ChannelStatus sendNotification(Notification notification) {
        return ChannelStatus.DELIVERED;
    }
}
