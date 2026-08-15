package com.corporate.rides.channel;

import com.corporate.rides.entity.Notification;
import com.corporate.rides.enums.ChannelStatus;
import com.corporate.rides.enums.NotificationChannelType;

public interface NotificationChannel {
    NotificationChannelType getChannelType();
    ChannelStatus sendNotification(Notification notification);
}
