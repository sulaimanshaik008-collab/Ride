package com.corporate.rides.util;

import java.util.regex.Pattern;

public class PhoneNumberValidator {

    // E.164 international format regex: leading '+' followed by 7 to 15 digits
    private static final Pattern E164_PATTERN = Pattern.compile("^\\+?[1-9]\\d{6,14}$");

    public static boolean isValid(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return false;
        }
        String normalized = normalize(phoneNumber);
        return E164_PATTERN.matcher(normalized).matches();
    }

    public static String normalize(String phoneNumber) {
        if (phoneNumber == null) {
            return null;
        }
        // Remove spaces, hyphens, parentheses, dots
        String cleaned = phoneNumber.replaceAll("[\\s\\-\\(\\)\\.]", "");
        if (!cleaned.startsWith("+") && cleaned.matches("^[1-9]\\d{6,14}$")) {
            return "+" + cleaned;
        }
        return cleaned;
    }

    public static String mask(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return "[NO_PHONE]";
        }
        String clean = phoneNumber.trim();
        if (clean.length() <= 4) {
            return "***";
        }
        return clean.substring(0, 3) + "***" + clean.substring(clean.length() - 4);
    }
}
