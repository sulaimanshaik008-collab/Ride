package com.corporate.rides.provider;

public interface SmsProvider {
    String getProviderName();
    boolean isConfigured();
    SmsDeliveryResult sendSms(String toPhoneNumber, String message);
}
