package com.corporate.rides.provider;

import com.corporate.rides.entity.User;
import com.corporate.rides.enums.VerificationStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ManualEmployeeVerificationProvider implements EmployeeVerificationProvider {

    @Override
    public String getProviderName() {
        return "MANUAL_CORPORATE_ADMIN";
    }

    @Override
    public VerificationStatus verifyEmployee(User user) {
        log.info("Performing baseline employee identity verification for: {} ({})", user.getEmail(), user.getOrganization().getName());
        if (user.getEmail() != null && user.getEmail().contains("@")) {
            return VerificationStatus.VERIFIED;
        }
        return VerificationStatus.PENDING;
    }
}
