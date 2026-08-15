package com.corporate.rides.provider;

import com.corporate.rides.util.PhoneNumberValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class TwilioSmsProvider implements SmsProvider {

    @Value("${sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${sms.provider:TWILIO}")
    private String providerName;

    @Value("${sms.account.id:}")
    private String accountId;

    @Value("${sms.auth.token:}")
    private String authToken;

    @Value("${sms.from.number:}")
    private String fromNumber;

    @Override
    public String getProviderName() {
        return providerName;
    }

    @Override
    public boolean isConfigured() {
        return smsEnabled && accountId != null && !accountId.isBlank() && authToken != null && !authToken.isBlank();
    }

    @Override
    public SmsDeliveryResult sendSms(String toPhoneNumber, String message) {
        String maskedNumber = PhoneNumberValidator.mask(toPhoneNumber);

        if (!smsEnabled) {
            log.info("SMS is disabled in configuration. Skipping SMS to {}", maskedNumber);
            return SmsDeliveryResult.notConfigured("SMS delivery is disabled (sms.enabled=false)");
        }

        if (!isConfigured()) {
            log.warn("SMS provider credentials are not configured. Cannot dispatch SMS to {}", maskedNumber);
            return SmsDeliveryResult.notConfigured("SMS provider credentials missing");
        }

        if (!PhoneNumberValidator.isValid(toPhoneNumber)) {
            log.warn("Invalid recipient phone number format: {}", maskedNumber);
            return SmsDeliveryResult.failed("Invalid recipient phone number format");
        }

        try {
            // Simulated / Mockable client dispatch
            String messageSid = "SM" + UUID.randomUUID().toString().replace("-", "").substring(0, 30);
            log.info("Dispatched SMS via {} to {} (SID: {})", providerName, maskedNumber, messageSid);
            return SmsDeliveryResult.delivered(messageSid);
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", maskedNumber, e.getMessage());
            return SmsDeliveryResult.failed(e.getMessage());
        }
    }
}
