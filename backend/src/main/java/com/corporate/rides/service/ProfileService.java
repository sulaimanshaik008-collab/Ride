package com.corporate.rides.service;

import com.corporate.rides.dto.UpdateProfileRequestDto;
import com.corporate.rides.dto.UserProfileDto;
import org.springframework.web.multipart.MultipartFile;

public interface ProfileService {
    UserProfileDto getProfile();
    UserProfileDto updateProfile(UpdateProfileRequestDto request);
    UserProfileDto uploadAvatar(MultipartFile file);
    UserProfileDto removeAvatar();
    byte[] getAvatarImage(String filename);
    String getAvatarContentType(String filename);
}
