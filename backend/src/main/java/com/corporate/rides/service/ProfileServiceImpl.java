package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.UpdateProfileRequestDto;
import com.corporate.rides.dto.UserProfileDto;
import com.corporate.rides.entity.User;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.ResourceNotFoundException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;

    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final String AVATAR_DIR = "uploads/avatars";

    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "^(\\+?[0-9]{1,4}[\\s-]?)?(\\(?[0-9]{2,5}\\)?[\\s-]?)?[0-9]{3,5}[\\s-]?[0-9]{3,5}$"
    );

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getProfile() {
        User user = getAuthenticatedUser();
        return mapToDto(user);
    }

    @Override
    @Transactional
    public UserProfileDto updateProfile(UpdateProfileRequestDto request) {
        User user = getAuthenticatedUser();

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            String trimmedName = request.getFullName().trim();
            if (trimmedName.length() < 2 || trimmedName.length() > 100) {
                throw new InvalidBookingException("Full name must be between 2 and 100 characters");
            }
            if (containsInvalidControlCharacters(trimmedName)) {
                throw new InvalidBookingException("Full name contains invalid control characters");
            }
            user.setFullName(trimmedName);
        }

        if (request.getPhoneNumber() != null) {
            String rawPhone = request.getPhoneNumber().trim();
            if (!rawPhone.isEmpty()) {
                if (!PHONE_PATTERN.matcher(rawPhone).matches()) {
                    throw new InvalidBookingException("Invalid phone number format. Please provide a valid phone number with country code if applicable.");
                }
                String digitsOnly = rawPhone.replaceAll("[^0-9]", "");
                if (digitsOnly.length() < 7 || digitsOnly.length() > 15) {
                    throw new InvalidBookingException("Phone number must contain between 7 and 15 digits");
                }

                // Check if another user has this phone number if unique
                userRepository.findByPhoneNumber(rawPhone).ifPresent(existing -> {
                    if (!existing.getId().equals(user.getId())) {
                        throw new InvalidBookingException("Phone number is already associated with another corporate account");
                    }
                });

                user.setPhoneNumber(rawPhone);
            } else {
                user.setPhoneNumber(null);
            }
        }

        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment().trim());
        }

        User savedUser = userRepository.save(user);
        log.info("Profile updated successfully for user ID {}", savedUser.getId());
        return mapToDto(savedUser);
    }

    @Override
    @Transactional
    public UserProfileDto uploadAvatar(MultipartFile file) {
        User user = getAuthenticatedUser();

        if (file == null || file.isEmpty()) {
            throw new InvalidBookingException("Please select an image file to upload");
        }

        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new InvalidBookingException("Profile image size exceeds maximum permitted limit of 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new InvalidBookingException("Unsupported image format. Allowed formats: JPEG, PNG, WEBP");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new InvalidBookingException("Failed to read uploaded image data");
        }

        if (!isValidImageMagicBytes(bytes, contentType)) {
            throw new InvalidBookingException("Uploaded file is corrupted or not a valid image");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename, contentType);
        String uniqueFilename = "avatar_" + user.getId() + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + extension;

        try {
            Path uploadPath = Paths.get(AVATAR_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Remove previous avatar file if exists
            if (user.getProfileImageUrl() != null && user.getProfileImageUrl().contains("/avatar/image/")) {
                String prevFilename = user.getProfileImageUrl().substring(user.getProfileImageUrl().lastIndexOf("/") + 1);
                Path prevFilePath = uploadPath.resolve(prevFilename);
                Files.deleteIfExists(prevFilePath);
            }

            Path targetPath = uploadPath.resolve(uniqueFilename);
            Files.write(targetPath, bytes);

            String avatarUrl = "/api/v1/profile/avatar/image/" + uniqueFilename;
            user.setProfileImageUrl(avatarUrl);
            User savedUser = userRepository.save(user);

            log.info("Avatar uploaded successfully for user ID {}", user.getId());
            return mapToDto(savedUser);
        } catch (IOException e) {
            log.error("Failed to store avatar image: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save avatar image: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public UserProfileDto removeAvatar() {
        User user = getAuthenticatedUser();

        if (user.getProfileImageUrl() != null && user.getProfileImageUrl().contains("/avatar/image/")) {
            String prevFilename = user.getProfileImageUrl().substring(user.getProfileImageUrl().lastIndexOf("/") + 1);
            try {
                Path prevFilePath = Paths.get(AVATAR_DIR).resolve(prevFilename);
                Files.deleteIfExists(prevFilePath);
            } catch (IOException e) {
                log.warn("Could not delete avatar file: {}", e.getMessage());
            }
        }

        user.setProfileImageUrl(null);
        User savedUser = userRepository.save(user);
        log.info("Avatar removed for user ID {}", user.getId());
        return mapToDto(savedUser);
    }

    @Override
    public byte[] getAvatarImage(String filename) {
        if (filename == null || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new InvalidBookingException("Invalid filename");
        }
        try {
            Path filePath = Paths.get(AVATAR_DIR).resolve(filename);
            if (!Files.exists(filePath)) {
                throw new ResourceNotFoundException("Avatar image not found");
            }
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new ResourceNotFoundException("Avatar image could not be loaded");
        }
    }

    @Override
    public String getAvatarContentType(String filename) {
        if (filename == null) return "image/jpeg";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private boolean isValidImageMagicBytes(byte[] bytes, String contentType) {
        if (bytes == null || bytes.length < 12) {
            return false;
        }
        // JPEG: FF D8 FF
        if (bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8 && bytes[2] == (byte) 0xFF) {
            return true;
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (bytes[0] == (byte) 0x89 && bytes[1] == (byte) 0x50 && bytes[2] == (byte) 0x4E && bytes[3] == (byte) 0x47) {
            return true;
        }
        // WEBP: RIFF .... WEBP
        if (bytes[0] == (byte) 'R' && bytes[1] == (byte) 'I' && bytes[2] == (byte) 'F' && bytes[3] == (byte) 'F'
                && bytes[8] == (byte) 'W' && bytes[9] == (byte) 'E' && bytes[10] == (byte) 'B' && bytes[11] == (byte) 'P') {
            return true;
        }
        return false;
    }

    private String getFileExtension(String originalFilename, String contentType) {
        if (contentType != null) {
            if (contentType.equalsIgnoreCase("image/png")) return "png";
            if (contentType.equalsIgnoreCase("image/webp")) return "webp";
            if (contentType.equalsIgnoreCase("image/jpeg")) return "jpg";
        }
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            if (ext.equals("png") || ext.equals("jpg") || ext.equals("jpeg") || ext.equals("webp")) {
                return ext.equals("jpeg") ? "jpg" : ext;
            }
        }
        return "jpg";
    }

    private boolean containsInvalidControlCharacters(String text) {
        for (char c : text.toCharArray()) {
            if (Character.isISOControl(c) && c != '\n' && c != '\r' && c != '\t') {
                return true;
            }
        }
        return false;
    }

    private User getAuthenticatedUser() {
        UserPrincipal principal = UserContextHolder.getContext();
        if (principal == null || principal.getUserId() == null) {
            throw new UnauthorizedAccessException("Authentication required to access profile");
        }
        return userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user record not found"));
    }

    private UserProfileDto mapToDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .organizationId(user.getOrganization().getId())
                .organizationName(user.getOrganization().getName())
                .organizationCode(user.getOrganization().getCode())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .profileImageUrl(user.getProfileImageUrl())
                .department(user.getDepartment())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
