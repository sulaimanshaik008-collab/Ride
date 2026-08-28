package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.UpdateProfileRequestDto;
import com.corporate.rides.dto.UserProfileDto;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.UserStatus;
import com.corporate.rides.enums.VerificationStatus;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ProfileServiceTest {

    @Autowired
    private ProfileService profileService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private Organization testOrg;
    private User testUser;
    private User anotherUser;

    @BeforeEach
    void setUp() {
        testOrg = organizationRepository.save(Organization.builder()
                .name("Acme Test Corp")
                .code("ACME_TEST_" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        testUser = userRepository.save(User.builder()
                .organization(testOrg)
                .email("test.profile." + UUID.randomUUID().toString().substring(0, 5) + "@corporate.com")
                .fullName("John Corporate")
                .phoneNumber("+91 98765 43210")
                .department("Engineering")
                .role(UserRole.EMPLOYEE)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build());

        anotherUser = userRepository.save(User.builder()
                .organization(testOrg)
                .email("other.user." + UUID.randomUUID().toString().substring(0, 5) + "@corporate.com")
                .fullName("Jane Colleague")
                .phoneNumber("+91 91234 56789")
                .department("Finance")
                .role(UserRole.EMPLOYEE)
                .status(UserStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build());

        setAuthContext(testUser);
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    private void setAuthContext(User user) {
        UserPrincipal principal = UserPrincipal.builder()
                .userId(user.getId())
                .organizationId(user.getOrganization().getId())
                .organizationName(user.getOrganization().getName())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
        UserContextHolder.setContext(principal);
    }

    @Test
    @DisplayName("Part L 11: Profile GET returns authenticated user details")
    void testGetProfile_ReturnsAuthenticatedUser() {
        UserProfileDto profile = profileService.getProfile();

        assertNotNull(profile);
        assertEquals(testUser.getId(), profile.getId());
        assertEquals(testUser.getEmail(), profile.getEmail());
        assertEquals(testUser.getFullName(), profile.getFullName());
        assertEquals(testUser.getPhoneNumber(), profile.getPhoneNumber());
        assertEquals(testUser.getDepartment(), profile.getDepartment());
    }

    @Test
    @DisplayName("Part L 12: User can update their own profile information")
    void testUpdateProfile_Success() {
        UpdateProfileRequestDto request = UpdateProfileRequestDto.builder()
                .fullName("Johnathan Updated")
                .phoneNumber("+91 99999 88888")
                .department("Senior Engineering")
                .build();

        UserProfileDto updated = profileService.updateProfile(request);

        assertNotNull(updated);
        assertEquals("Johnathan Updated", updated.getFullName());
        assertEquals("+91 99999 88888", updated.getPhoneNumber());
        assertEquals("Senior Engineering", updated.getDepartment());

        User inDb = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals("Johnathan Updated", inDb.getFullName());
        assertEquals("+91 99999 88888", inDb.getPhoneNumber());
    }

    @Test
    @DisplayName("Part L 13: User context isolation - unauthenticated access rejected")
    void testGetProfile_Unauthenticated_ThrowsException() {
        UserContextHolder.clear();
        assertThrows(UnauthorizedAccessException.class, () -> profileService.getProfile());
    }

    @Test
    @DisplayName("Part L 14: Invalid phone number formats are rejected")
    void testUpdateProfile_InvalidPhone_ThrowsException() {
        UpdateProfileRequestDto request = UpdateProfileRequestDto.builder()
                .fullName("John Valid")
                .phoneNumber("invalid-phone-abc-123")
                .build();

        assertThrows(InvalidBookingException.class, () -> profileService.updateProfile(request));
    }

    @Test
    @DisplayName("Part L 14b: Duplicate phone number of another user is rejected")
    void testUpdateProfile_DuplicatePhone_ThrowsException() {
        UpdateProfileRequestDto request = UpdateProfileRequestDto.builder()
                .fullName("John Valid")
                .phoneNumber(anotherUser.getPhoneNumber())
                .build();

        assertThrows(InvalidBookingException.class, () -> profileService.updateProfile(request));
    }

    @Test
    @DisplayName("Part L 15: Invalid image formats or corrupted files are rejected")
    void testUploadAvatar_InvalidFormat_ThrowsException() {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/x-msdownload",
                new byte[]{0x4D, 0x5A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}
        );

        assertThrows(InvalidBookingException.class, () -> profileService.uploadAvatar(exeFile));
    }

    @Test
    @DisplayName("Part L 16: Profile image update with valid JPEG works")
    void testUploadAvatar_ValidJpeg_Success() {
        // Valid JPEG header bytes: FF D8 FF ...
        byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01};
        MockMultipartFile jpegFile = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                jpegBytes
        );

        UserProfileDto updated = profileService.uploadAvatar(jpegFile);

        assertNotNull(updated);
        assertNotNull(updated.getProfileImageUrl());
        assertTrue(updated.getProfileImageUrl().contains("/avatar/image/"));

        User inDb = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals(updated.getProfileImageUrl(), inDb.getProfileImageUrl());
    }

    @Test
    @DisplayName("Part L 17: Profile image removal clears profile image URL")
    void testRemoveAvatar_Success() {
        testUser.setProfileImageUrl("/api/v1/profile/avatar/image/avatar_test.jpg");
        userRepository.save(testUser);

        UserProfileDto result = profileService.removeAvatar();

        assertNotNull(result);
        assertNull(result.getProfileImageUrl());

        User inDb = userRepository.findById(testUser.getId()).orElseThrow();
        assertNull(inDb.getProfileImageUrl());
    }
}
