package com.corporate.rides.provider;

import com.corporate.rides.entity.User;
import com.corporate.rides.enums.VerificationStatus;

public interface EmployeeVerificationProvider {
    String getProviderName();
    VerificationStatus verifyEmployee(User user);
}
