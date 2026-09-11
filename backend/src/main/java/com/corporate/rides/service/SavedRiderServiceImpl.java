package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.CreateSavedRiderRequestDto;
import com.corporate.rides.dto.SavedRiderResponseDto;
import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.SavedRider;
import com.corporate.rides.entity.User;
import com.corporate.rides.exception.ResourceNotFoundException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.SavedRiderRepository;
import com.corporate.rides.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavedRiderServiceImpl implements SavedRiderService {

    private final SavedRiderRepository savedRiderRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SavedRiderResponseDto> getSavedRiders() {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        List<SavedRider> riders = savedRiderRepository.findByOrganizationIdAndUserIdOrderByCreatedAtDesc(
                currentUser.getOrganizationId(),
                currentUser.getUserId()
        );
        return riders.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SavedRiderResponseDto createSavedRider(CreateSavedRiderRequestDto request) {
        UserPrincipal currentUser = getCurrentUserPrincipal();

        Organization organization = organizationRepository.findById(currentUser.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        User user = userRepository.findById(currentUser.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        SavedRider rider = SavedRider.builder()
                .organization(organization)
                .user(user)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phoneNumber(request.getPhoneNumber().trim())
                .countryCode(request.getCountryCode() != null && !request.getCountryCode().isBlank() ? request.getCountryCode().trim() : "+1")
                .build();

        SavedRider saved = savedRiderRepository.save(rider);
        log.info("User {} added colleague rider: {} {}", currentUser.getEmail(), saved.getFirstName(), saved.getLastName());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public void deleteSavedRider(UUID riderId) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        SavedRider rider = savedRiderRepository.findByIdAndOrganizationIdAndUserId(
                riderId,
                currentUser.getOrganizationId(),
                currentUser.getUserId()
        ).orElseThrow(() -> new ResourceNotFoundException("Saved rider not found with ID: " + riderId));

        savedRiderRepository.delete(rider);
        log.info("User {} deleted colleague rider with ID: {}", currentUser.getEmail(), riderId);
    }

    private UserPrincipal getCurrentUserPrincipal() {
        UserPrincipal principal = UserContextHolder.getContext();
        if (principal == null || principal.getUserId() == null || principal.getOrganizationId() == null) {
            throw new UnauthorizedAccessException("User is not authenticated");
        }
        return principal;
    }

    private SavedRiderResponseDto mapToDto(SavedRider rider) {
        String fullName = (rider.getFirstName() + " " + rider.getLastName()).trim();
        String initials = "";
        if (rider.getFirstName() != null && !rider.getFirstName().isEmpty()) {
            initials += rider.getFirstName().substring(0, 1).toUpperCase();
        }
        if (rider.getLastName() != null && !rider.getLastName().isEmpty()) {
            initials += rider.getLastName().substring(0, 1).toUpperCase();
        }
        if (initials.isEmpty()) {
            initials = "R";
        }

        return SavedRiderResponseDto.builder()
                .id(rider.getId())
                .userId(rider.getUser().getId())
                .firstName(rider.getFirstName())
                .lastName(rider.getLastName())
                .fullName(fullName)
                .phoneNumber(rider.getPhoneNumber())
                .countryCode(rider.getCountryCode())
                .initials(initials)
                .createdAt(rider.getCreatedAt())
                .build();
    }
}
