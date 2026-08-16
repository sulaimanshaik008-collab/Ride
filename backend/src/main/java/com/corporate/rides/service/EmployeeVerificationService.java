package com.corporate.rides.service;

import com.corporate.rides.entity.User;
import com.corporate.rides.enums.VerificationStatus;
import com.corporate.rides.provider.EmployeeVerificationProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeVerificationService {

    private final List<EmployeeVerificationProvider> verificationProviders;

    public VerificationStatus verifyEmployee(User user) {
        if (verificationProviders == null || verificationProviders.isEmpty()) {
            return VerificationStatus.VERIFIED;
        }

        for (EmployeeVerificationProvider provider : verificationProviders) {
            try {
                VerificationStatus status = provider.verifyEmployee(user);
                if (status != null) {
                    return status;
                }
            } catch (Exception e) {
                log.warn("Employee verification provider {} failed: {}", provider.getProviderName(), e.getMessage());
            }
        }
        return VerificationStatus.VERIFIED;
    }
}
