package com.corporate.rides.provider;

import com.corporate.rides.enums.ChannelStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsDeliveryResult {
    private boolean success;
    private ChannelStatus status;
    private String messageId;
    private String errorMessage;

    public static SmsDeliveryResult delivered(String messageId) {
        return SmsDeliveryResult.builder()
                .success(true)
                .status(ChannelStatus.DELIVERED)
                .messageId(messageId)
                .build();
    }

    public static SmsDeliveryResult failed(String errorMessage) {
        return SmsDeliveryResult.builder()
                .success(false)
                .status(ChannelStatus.FAILED)
                .errorMessage(errorMessage)
                .build();
    }

    public static SmsDeliveryResult notConfigured(String reason) {
        return SmsDeliveryResult.builder()
                .success(false)
                .status(ChannelStatus.NOT_CONFIGURED)
                .errorMessage(reason)
                .build();
    }
}
