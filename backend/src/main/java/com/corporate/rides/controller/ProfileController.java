package com.corporate.rides.controller;

import com.corporate.rides.dto.ApiResponse;
import com.corporate.rides.dto.UpdateProfileRequestDto;
import com.corporate.rides.dto.UserProfileDto;
import com.corporate.rides.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile() {
        UserProfileDto profile = profileService.getProfile();
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile retrieved successfully"));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfilePut(@Valid @RequestBody UpdateProfileRequestDto request) {
        UserProfileDto profile = profileService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile updated successfully"));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfilePatch(@Valid @RequestBody UpdateProfileRequestDto request) {
        UserProfileDto profile = profileService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile updated successfully"));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserProfileDto>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        UserProfileDto profile = profileService.uploadAvatar(file);
        return ResponseEntity.ok(ApiResponse.success(profile, "Avatar image uploaded successfully"));
    }

    @PutMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserProfileDto>> updateAvatar(@RequestParam("file") MultipartFile file) {
        UserProfileDto profile = profileService.uploadAvatar(file);
        return ResponseEntity.ok(ApiResponse.success(profile, "Avatar image updated successfully"));
    }

    @DeleteMapping("/avatar")
    public ResponseEntity<ApiResponse<UserProfileDto>> removeAvatar() {
        UserProfileDto profile = profileService.removeAvatar();
        return ResponseEntity.ok(ApiResponse.success(profile, "Avatar image removed successfully"));
    }

    @GetMapping("/avatar/image/{filename:.+}")
    public ResponseEntity<byte[]> getAvatarImage(@PathVariable String filename) {
        byte[] imageBytes = profileService.getAvatarImage(filename);
        String contentType = profileService.getAvatarContentType(filename);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400, public")
                .body(imageBytes);
    }
}
