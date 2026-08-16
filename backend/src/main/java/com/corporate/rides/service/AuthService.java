package com.corporate.rides.service;

import com.corporate.rides.dto.UserProfileDto;

import java.util.List;

public interface AuthService {
    UserProfileDto getCurrentUserProfile();
    List<UserProfileDto> getAvailableDemoUsers();
    UserProfileDto loginAsEmail(String email);
}
