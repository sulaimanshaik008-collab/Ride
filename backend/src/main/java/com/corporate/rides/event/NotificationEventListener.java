package com.corporate.rides.event;

import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.NotificationChannelType;
import com.corporate.rides.enums.NotificationType;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.repository.UserRepository;
import com.corporate.rides.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @EventListener
    public void handleRideEvent(RideEvent event) {
        if (event == null || event.getRide() == null || event.getEventType() == null) {
            return;
        }

        try {
            Ride ride = event.getRide();
            NotificationType type = event.getEventType();

            switch (type) {
                case RIDE_BOOKED -> {
                    // Notify Employee (In-App + SMS)
                    dispatchDualNotification(
                            ride.getEmployee(),
                            ride,
                            NotificationType.RIDE_BOOKED,
                            "Ride Booking Submitted",
                            "Your ride request (" + ride.getBookingReference() + ") from " + ride.getPickupLocation() + " to " + ride.getDestination() + " has been submitted."
                    );

                    // Notify Managers of new request (In-App)
                    notifyManagers(ride, NotificationType.RIDE_BOOKED,
                            "New Ride Request",
                            "Employee " + ride.getEmployee().getFullName() + " requested a ride (" + ride.getBookingReference() + ") for " + ride.getBookingDate() + ".");
                }

                case RIDE_APPROVED -> {
                    dispatchDualNotification(
                            ride.getEmployee(),
                            ride,
                            NotificationType.RIDE_APPROVED,
                            "Ride Request Approved",
                            "Your ride request (" + ride.getBookingReference() + ") has been approved by the Transport Manager and queued for scheduling."
                    );
                }

                case RIDE_REJECTED -> {
                    String reason = ride.getRejectionReason() != null ? " Reason: " + ride.getRejectionReason() : "";
                    dispatchDualNotification(
                            ride.getEmployee(),
                            ride,
                            NotificationType.RIDE_REJECTED,
                            "Ride Request Rejected",
                            "Your ride request (" + ride.getBookingReference() + ") was not approved." + reason
                    );
                }

                case RIDE_SCHEDULED -> {
                    dispatchDualNotification(
                            ride.getEmployee(),
                            ride,
                            NotificationType.RIDE_SCHEDULED,
                            "Ride Scheduled",
                            "Your ride (" + ride.getBookingReference() + ") has been scheduled for " + ride.getBookingDate() + " at " + ride.getPickupTime() + "."
                    );
                }

                case RIDE_RESCHEDULED -> {
                    dispatchDualNotification(
                            ride.getEmployee(),
                            ride,
                            NotificationType.RIDE_RESCHEDULED,
                            "Ride Rescheduled",
                            "Your ride (" + ride.getBookingReference() + ") has been updated to " + ride.getBookingDate() + " at " + ride.getPickupTime() + "."
                    );

                    if (ride.getDriver() != null && ride.getDriver().getUser() != null) {
                        dispatchDualNotification(
                                ride.getDriver().getUser(),
                                ride,
                                NotificationType.RIDE_RESCHEDULED,
                                "Assigned Ride Rescheduled",
                                "Ride (" + ride.getBookingReference() + ") has been rescheduled to " + ride.getBookingDate() + " at " + ride.getPickupTime() + "."
                        );
                    }
                }

                case DRIVER_ASSIGNED -> {
                    String driverName = ride.getDriver() != null ? ride.getDriver().getUser().getFullName() : "a driver";
                    String vehicleReg = ride.getVehicle() != null ? ride.getVehicle().getRegistrationNumber() : "a vehicle";

                    // Notify Employee
                    dispatchDualNotification(
                            ride.getEmployee(),
                            ride,
                            NotificationType.DRIVER_ASSIGNED,
                            "Driver & Vehicle Assigned",
                            "Driver " + driverName + " and Vehicle " + vehicleReg + " have been assigned to your scheduled ride (" + ride.getBookingReference() + ")."
                    );

                    // Notify Driver
                    if (ride.getDriver() != null && ride.getDriver().getUser() != null) {
                        dispatchDualNotification(
                                ride.getDriver().getUser(),
                                ride,
                                NotificationType.DRIVER_ASSIGNED,
                                "New Ride Assigned",
                                "You have been assigned to ride (" + ride.getBookingReference() + ") scheduled for " + ride.getBookingDate() + " at " + ride.getPickupTime() + "."
                        );
                    }
                }

                case DRIVER_ACCEPTED -> {
                    String driverName = ride.getDriver() != null ? ride.getDriver().getUser().getFullName() : "Driver";
                    notifyManagers(
                            ride,
                            NotificationType.DRIVER_ACCEPTED,
                            "Driver Accepted Assignment",
                            "Driver " + driverName + " has accepted assignment for ride (" + ride.getBookingReference() + ")."
                    );
                    dispatchDualNotification(
                            ride.getEmployee(),
                            ride,
                            NotificationType.DRIVER_ACCEPTED,
                            "Driver Confirmed Ride",
                            "Driver " + driverName + " is confirmed and preparing for your pickup at " + ride.getPickupTime() + "."
                    );
                }

                case DRIVER_REJECTED -> {
                    String driverName = event.getActor() != null ? event.getActor().getFullName() : "Driver";
                    String reasonText = ride.getRejectionReason() != null ? " Reason: " + ride.getRejectionReason() : "";
                    notifyManagers(
                            ride,
                            NotificationType.DRIVER_REJECTED,
                            "Driver Rejected Assignment",
                            "Driver " + driverName + " rejected assignment for ride (" + ride.getBookingReference() + ")." + reasonText + ". Please reassign a driver."
                    );
                }

                case TRIP_STARTED -> {
                    // Notify Employee
                    dispatchDualNotification(
                            ride.getEmployee(),
                            ride,
                            NotificationType.TRIP_STARTED,
                            "Trip Started",
                            "Your ride (" + ride.getBookingReference() + ") has started. Real-time GPS tracking is now live."
                    );
                }

                case TRIP_COMPLETED, RIDE_COMPLETED -> {
                    // 1. Notify Employee (In-App + SMS if configured)
                    dispatchDualNotification(
                            ride.getEmployee(),
                            ride,
                            NotificationType.TRIP_COMPLETED,
                            "Trip Completed",
                            "Your ride (" + ride.getBookingReference() + ") has completed successfully. Thank you for riding with us!"
                    );

                    // 2. Notify Transport Managers (In-App)
                    String driverName = ride.getDriver() != null ? ride.getDriver().getUser().getFullName() : "Assigned Driver";
                    String employeeName = ride.getEmployee() != null ? ride.getEmployee().getFullName() : "Employee";
                    notifyManagers(
                            ride,
                            NotificationType.TRIP_COMPLETED,
                            "Ride Completed",
                            "Ride " + ride.getBookingReference() + " has been completed by Driver " + driverName + " for " + employeeName + "."
                    );
                }

                case RIDE_CANCELLED -> {
                    // Notify Employee
                    dispatchDualNotification(
                            ride.getEmployee(),
                            ride,
                            NotificationType.RIDE_CANCELLED,
                            "Ride Cancelled",
                            "Your ride (" + ride.getBookingReference() + ") has been cancelled." + (ride.getCancellationReason() != null ? " Reason: " + ride.getCancellationReason() : "")
                    );

                    // Notify Driver if assigned
                    if (ride.getDriver() != null && ride.getDriver().getUser() != null) {
                        dispatchDualNotification(
                                ride.getDriver().getUser(),
                                ride,
                                NotificationType.RIDE_CANCELLED,
                                "Assigned Ride Cancelled",
                                "Ride (" + ride.getBookingReference() + ") assigned to you has been cancelled."
                        );
                    }
                }

                default -> log.debug("Unhandled notification event type: {}", type);
            }
        } catch (Exception e) {
            log.error("Failed to process RideEvent asynchronously: {}", e.getMessage(), e);
        }
    }

    private void dispatchDualNotification(User recipient, Ride ride, NotificationType type, String title, String message) {
        // 1. IN_APP Notification (Always created as primary channel)
        try {
            notificationService.createNotification(
                    recipient,
                    ride,
                    type,
                    title,
                    message,
                    NotificationChannelType.IN_APP
            );
        } catch (Exception e) {
            log.warn("Failed to create IN_APP notification for user {}: {}", recipient.getEmail(), e.getMessage());
        }

        // 2. SMS Notification (Dispatched to registered phone number if present)
        if (recipient.getPhoneNumber() != null && !recipient.getPhoneNumber().isBlank()) {
            try {
                notificationService.createNotification(
                        recipient,
                        ride,
                        type,
                        title,
                        message,
                        NotificationChannelType.SMS
                );
            } catch (Exception e) {
                log.warn("Failed to dispatch SMS notification for user {}: {}", recipient.getEmail(), e.getMessage());
            }
        }
    }

    private void notifyManagers(Ride ride, NotificationType type, String title, String message) {
        try {
            List<User> managers = userRepository.findByOrganizationId(ride.getOrganization().getId())
                    .stream()
                    .filter(u -> u.getRole() == UserRole.TRANSPORT_MANAGER || u.getRole() == UserRole.CORPORATE_ADMIN)
                    .toList();

            for (User manager : managers) {
                notificationService.createNotification(
                        manager,
                        ride,
                        type,
                        title,
                        message,
                        NotificationChannelType.IN_APP
                );
            }
        } catch (Exception e) {
            log.warn("Could not notify managers for event {}: {}", type, e.getMessage());
        }
    }
}
