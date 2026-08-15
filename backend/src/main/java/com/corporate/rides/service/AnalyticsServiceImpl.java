package com.corporate.rides.service;

import com.corporate.rides.config.UserContextHolder;
import com.corporate.rides.config.UserPrincipal;
import com.corporate.rides.dto.*;
import com.corporate.rides.entity.Driver;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.Vehicle;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.enums.RideStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.enums.VehicleStatus;
import com.corporate.rides.exception.InvalidBookingException;
import com.corporate.rides.exception.UnauthorizedAccessException;
import com.corporate.rides.repository.AnalyticsRepository;
import com.corporate.rides.repository.DriverRepository;
import com.corporate.rides.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final AnalyticsRepository analyticsRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    @Override
    @Transactional(readOnly = true)
    public AnalyticsOverviewDto getOverviewAnalytics(LocalDate from, LocalDate to) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);
        validateDateRange(from, to);

        UUID orgId = currentUser.getOrganizationId();
        List<Ride> rides = analyticsRepository.findTenantRidesInDateRange(orgId, from, to);

        long totalRides = rides.size();
        long completedRides = rides.stream().filter(r -> r.getStatus() == RideStatus.COMPLETED).count();
        long scheduledRides = rides.stream().filter(r -> r.getStatus() == RideStatus.SCHEDULED || r.getStatus() == RideStatus.ASSIGNED).count();
        long activeRides = rides.stream().filter(r -> r.getStatus() == RideStatus.IN_PROGRESS).count();
        long cancelledRides = rides.stream().filter(r -> r.getStatus() == RideStatus.CANCELLED).count();
        long rejectedRides = rides.stream().filter(r -> r.getStatus() == RideStatus.REJECTED).count();
        long pendingApprovalRides = rides.stream().filter(r -> r.getStatus() == RideStatus.PENDING_APPROVAL).count();

        long finishedEligible = completedRides + cancelledRides + rejectedRides;
        double completionRate = finishedEligible > 0 ? ((double) completedRides / finishedEligible) * 100.0 : (totalRides > 0 ? ((double) completedRides / totalRides) * 100.0 : 0.0);
        double cancellationRate = totalRides > 0 ? ((double) cancelledRides / totalRides) * 100.0 : 0.0;

        // Calculate average lead time in hours (from createdAt to bookingDate + pickupTime)
        double avgLeadTimeHours = rides.stream()
                .filter(r -> r.getCreatedAt() != null && r.getBookingDate() != null && r.getPickupTime() != null)
                .mapToLong(r -> {
                    LocalDateTime scheduledDateTime = LocalDateTime.of(r.getBookingDate(), r.getPickupTime());
                    LocalDateTime createdDateTime = r.getCreatedAt().toLocalDateTime();
                    long hours = Duration.between(createdDateTime, scheduledDateTime).toHours();
                    return Math.max(0, hours);
                })
                .average()
                .orElse(0.0);

        long totalActiveDrivers = driverRepository.findByOrganizationId(orgId).stream()
                .filter(d -> d.getDriverStatus() == DriverStatus.ACTIVE).count();

        long totalActiveVehicles = vehicleRepository.findByOrganizationId(orgId).stream()
                .filter(v -> v.getVehicleStatus() == VehicleStatus.ACTIVE).count();

        long totalUniquePassengers = analyticsRepository.countUniquePassengers(orgId, from, to);

        return AnalyticsOverviewDto.builder()
                .totalRides(totalRides)
                .completedRides(completedRides)
                .scheduledRides(scheduledRides)
                .activeRides(activeRides)
                .cancelledRides(cancelledRides)
                .rejectedRides(rejectedRides)
                .pendingApprovalRides(pendingApprovalRides)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .cancellationRate(Math.round(cancellationRate * 10.0) / 10.0)
                .averageSchedulingLeadTimeHours(Math.round(avgLeadTimeHours * 10.0) / 10.0)
                .totalActiveDrivers(totalActiveDrivers)
                .totalActiveVehicles(totalActiveVehicles)
                .totalUniquePassengers(totalUniquePassengers)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RideTrendDto> getRideTrends(LocalDate from, LocalDate to) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);
        validateDateRange(from, to);

        UUID orgId = currentUser.getOrganizationId();
        List<Ride> rides = analyticsRepository.findTenantRidesInDateRange(orgId, from, to);

        Map<LocalDate, List<Ride>> byDate = rides.stream()
                .collect(Collectors.groupingBy(Ride::getBookingDate));

        // If from and to are specified, generate sequential dates
        LocalDate start = from != null ? from : (rides.isEmpty() ? LocalDate.now().minusDays(7) : rides.stream().map(Ride::getBookingDate).min(LocalDate::compareTo).orElse(LocalDate.now()));
        LocalDate end = to != null ? to : LocalDate.now().plusDays(1);

        List<RideTrendDto> trends = new ArrayList<>();
        LocalDate current = start;
        while (!current.isAfter(end)) {
            List<Ride> dateRides = byDate.getOrDefault(current, Collections.emptyList());
            long total = dateRides.size();
            long completed = dateRides.stream().filter(r -> r.getStatus() == RideStatus.COMPLETED).count();
            long cancelled = dateRides.stream().filter(r -> r.getStatus() == RideStatus.CANCELLED).count();
            long scheduled = dateRides.stream().filter(r -> r.getStatus() == RideStatus.SCHEDULED || r.getStatus() == RideStatus.ASSIGNED).count();

            trends.add(RideTrendDto.builder()
                    .date(current)
                    .dayOfWeek(current.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                    .totalRequested(total)
                    .completed(completed)
                    .cancelled(cancelled)
                    .scheduled(scheduled)
                    .build());

            current = current.plusDays(1);
        }

        return trends;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverAnalyticsDto> getDriverAnalytics(LocalDate from, LocalDate to) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);
        validateDateRange(from, to);

        UUID orgId = currentUser.getOrganizationId();
        List<Driver> drivers = driverRepository.findByOrganizationId(orgId);
        List<Ride> rides = analyticsRepository.findTenantRidesInDateRange(orgId, from, to);

        Map<UUID, List<Ride>> driverRides = rides.stream()
                .filter(r -> r.getDriver() != null)
                .collect(Collectors.groupingBy(r -> r.getDriver().getId()));

        long maxDriverTrips = drivers.stream()
                .mapToLong(d -> driverRides.getOrDefault(d.getId(), Collections.emptyList()).size())
                .max()
                .orElse(1);
        if (maxDriverTrips == 0) maxDriverTrips = 1;

        final long maxTripsRef = maxDriverTrips;

        return drivers.stream().map(d -> {
            List<Ride> trips = driverRides.getOrDefault(d.getId(), Collections.emptyList());
            long total = trips.size();
            long completed = trips.stream().filter(r -> r.getStatus() == RideStatus.COMPLETED).count();
            long cancelled = trips.stream().filter(r -> r.getStatus() == RideStatus.CANCELLED).count();
            long active = trips.stream().filter(r -> r.getStatus() == RideStatus.IN_PROGRESS).count();
            double compRate = total > 0 ? ((double) completed / total) * 100.0 : 0.0;
            double utilization = Math.min(100.0, ((double) total / maxTripsRef) * 100.0);

            return DriverAnalyticsDto.builder()
                    .driverId(d.getId())
                    .driverName(d.getUser().getFullName())
                    .email(d.getUser().getEmail())
                    .phoneNumber(d.getUser().getPhoneNumber())
                    .driverStatus(d.getDriverStatus())
                    .availabilityStatus(d.getAvailabilityStatus())
                    .totalAssignedTrips(total)
                    .completedTrips(completed)
                    .cancelledTrips(cancelled)
                    .activeTrips(active)
                    .completionRate(Math.round(compRate * 10.0) / 10.0)
                    .utilizationPercentage(Math.round(utilization * 10.0) / 10.0)
                    .build();
        }).sorted((d1, d2) -> Long.compare(d2.getTotalAssignedTrips(), d1.getTotalAssignedTrips()))
          .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleAnalyticsDto> getVehicleAnalytics(LocalDate from, LocalDate to) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);
        validateDateRange(from, to);

        UUID orgId = currentUser.getOrganizationId();
        List<Vehicle> vehicles = vehicleRepository.findByOrganizationId(orgId);
        List<Ride> rides = analyticsRepository.findTenantRidesInDateRange(orgId, from, to);

        Map<UUID, List<Ride>> vehicleRides = rides.stream()
                .filter(r -> r.getVehicle() != null)
                .collect(Collectors.groupingBy(r -> r.getVehicle().getId()));

        long maxVehicleTrips = vehicles.stream()
                .mapToLong(v -> vehicleRides.getOrDefault(v.getId(), Collections.emptyList()).size())
                .max()
                .orElse(1);
        if (maxVehicleTrips == 0) maxVehicleTrips = 1;

        final long maxTripsRef = maxVehicleTrips;

        return vehicles.stream().map(v -> {
            List<Ride> trips = vehicleRides.getOrDefault(v.getId(), Collections.emptyList());
            long total = trips.size();
            long completed = trips.stream().filter(r -> r.getStatus() == RideStatus.COMPLETED).count();
            long active = trips.stream().filter(r -> r.getStatus() == RideStatus.IN_PROGRESS).count();
            double utilization = Math.min(100.0, ((double) total / maxTripsRef) * 100.0);

            return VehicleAnalyticsDto.builder()
                    .vehicleId(v.getId())
                    .registrationNumber(v.getRegistrationNumber())
                    .makeModel(v.getMake() + " " + v.getModel())
                    .vehicleType(v.getVehicleType())
                    .seatingCapacity(v.getSeatingCapacity())
                    .vehicleStatus(v.getVehicleStatus())
                    .availabilityStatus(v.getAvailabilityStatus())
                    .maintenanceStatus(v.getMaintenanceStatus())
                    .totalAssignedTrips(total)
                    .completedTrips(completed)
                    .activeTrips(active)
                    .utilizationPercentage(Math.round(utilization * 10.0) / 10.0)
                    .build();
        }).sorted((v1, v2) -> Long.compare(v2.getTotalAssignedTrips(), v1.getTotalAssignedTrips()))
          .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RouteAnalyticsDto> getRouteAnalytics(LocalDate from, LocalDate to) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);
        validateDateRange(from, to);

        UUID orgId = currentUser.getOrganizationId();
        List<Object[]> rawRoutes = analyticsRepository.findRouteAnalytics(orgId, from, to);

        long grandTotal = rawRoutes.stream()
                .mapToLong(row -> ((Number) row[2]).longValue())
                .sum();
        if (grandTotal == 0) grandTotal = 1;

        final long grandTotalRef = grandTotal;

        return rawRoutes.stream().map(row -> {
            String pickup = (String) row[0];
            String dest = (String) row[1];
            long count = ((Number) row[2]).longValue();
            long completed = ((Number) row[3]).longValue();
            long cancelled = ((Number) row[4]).longValue();
            double percentage = ((double) count / grandTotalRef) * 100.0;

            return RouteAnalyticsDto.builder()
                    .pickupLocation(pickup)
                    .destination(dest)
                    .routeName(pickup + " → " + dest)
                    .totalRequests(count)
                    .completedRides(completed)
                    .cancelledRides(cancelled)
                    .demandPercentage(Math.round(percentage * 10.0) / 10.0)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PeakHourAnalyticsDto> getPeakHourAnalytics(LocalDate from, LocalDate to) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);
        validateDateRange(from, to);

        UUID orgId = currentUser.getOrganizationId();
        List<Ride> rides = analyticsRepository.findTenantRidesInDateRange(orgId, from, to);

        long total = rides.size();
        if (total == 0) total = 1;

        Map<Integer, Long> hourCounts = new HashMap<>();
        for (int h = 0; h < 24; h++) {
            hourCounts.put(h, 0L);
        }

        for (Ride r : rides) {
            if (r.getPickupTime() != null) {
                int hour = r.getPickupTime().getHour();
                hourCounts.put(hour, hourCounts.get(hour) + 1);
            }
        }

        double avgHourly = rides.size() / 24.0;

        List<PeakHourAnalyticsDto> result = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            long count = hourCounts.get(h);
            double pct = ((double) count / total) * 100.0;

            String demandLevel = "NORMAL";
            if (count > avgHourly * 1.8 && count >= 3) {
                demandLevel = "SURGE";
            } else if (count > avgHourly * 1.2 && count >= 2) {
                demandLevel = "HIGH_DEMAND";
            }

            String slotLabel = String.format("%02d:00 - %02d:00", h, (h + 1) % 24);

            result.add(PeakHourAnalyticsDto.builder()
                    .hour(h)
                    .timeSlotLabel(slotLabel)
                    .rideCount(count)
                    .percentageOfDailyDemand(Math.round(pct * 10.0) / 10.0)
                    .demandLevel(demandLevel)
                    .build());
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CapacityAnalysisDto> getCapacityAnalysis(LocalDate from, LocalDate to) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);
        validateDateRange(from, to);

        UUID orgId = currentUser.getOrganizationId();
        List<Ride> rides = analyticsRepository.findTenantRidesInDateRange(orgId, from, to);
        List<Vehicle> vehicles = vehicleRepository.findByOrganizationId(orgId);

        long totalActiveSeats = vehicles.stream()
                .filter(v -> v.getVehicleStatus() == VehicleStatus.ACTIVE)
                .mapToInt(Vehicle::getSeatingCapacity)
                .sum();

        Map<Integer, Long> hourDemand = new HashMap<>();
        for (int h = 0; h < 24; h++) hourDemand.put(h, 0L);

        for (Ride r : rides) {
            if (r.getPickupTime() != null) {
                int hour = r.getPickupTime().getHour();
                hourDemand.put(hour, hourDemand.get(hour) + 1);
            }
        }

        List<CapacityAnalysisDto> analysis = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            long demand = hourDemand.get(h);
            long gap = totalActiveSeats - demand;

            String status = "BALANCED";
            if (demand > totalActiveSeats && demand > 0) {
                status = "CAPACITY_RISK";
            } else if (gap > totalActiveSeats * 0.5) {
                status = "SURPLUS";
            }

            analysis.add(CapacityAnalysisDto.builder()
                    .hour(h)
                    .timeSlotLabel(String.format("%02d:00 - %02d:00", h, (h + 1) % 24))
                    .requestedRides(demand)
                    .availableFleetSeats(totalActiveSeats)
                    .capacityGap(gap)
                    .capacityStatus(status)
                    .build());
        }

        return analysis;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnalyticsInsightDto> getIntelligentInsights(LocalDate from, LocalDate to) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);
        validateDateRange(from, to);

        UUID orgId = currentUser.getOrganizationId();
        List<Ride> rides = analyticsRepository.findTenantRidesInDateRange(orgId, from, to);
        List<AnalyticsInsightDto> insights = new ArrayList<>();

        if (rides.isEmpty()) {
            insights.add(AnalyticsInsightDto.builder()
                    .category("DEMAND")
                    .title("Insufficient Historical Data")
                    .message("Insufficient historical data for reliable trend analysis in the selected date range.")
                    .severity("INFO")
                    .metricHighlight("0 Rides")
                    .build());
            return insights;
        }

        // 1. Peak Hour Insight
        Map<Integer, Long> hourCounts = rides.stream()
                .filter(r -> r.getPickupTime() != null)
                .collect(Collectors.groupingBy(r -> r.getPickupTime().getHour(), Collectors.counting()));

        var topHourOpt = hourCounts.entrySet().stream().max(Map.Entry.comparingByValue());
        if (topHourOpt.isPresent() && topHourOpt.get().getValue() > 0) {
            int peakHour = topHourOpt.get().getKey();
            long count = topHourOpt.get().getValue();
            insights.add(AnalyticsInsightDto.builder()
                    .category("DEMAND")
                    .title("Peak Ride Demand Window")
                    .message(String.format("Peak booking window occurs at %02d:00 - %02d:00 with %d ride requests (%d%% of volume).",
                            peakHour, (peakHour + 1) % 24, count, Math.round(((double) count / rides.size()) * 100)))
                    .severity(count > 5 ? "WARNING" : "INFO")
                    .metricHighlight(String.format("%02d:00 Peak", peakHour))
                    .build());
        }

        // 2. Cancellation Rate Insight
        long cancelled = rides.stream().filter(r -> r.getStatus() == RideStatus.CANCELLED).count();
        double cancelRate = ((double) cancelled / rides.size()) * 100.0;
        if (cancelRate > 20.0) {
            insights.add(AnalyticsInsightDto.builder()
                    .category("EFFICIENCY")
                    .title("Elevated Cancellation Rate")
                    .message(String.format("Cancellation rate is at %.1f%% (%d of %d rides cancelled). Review driver availability and scheduling lead times.",
                            cancelRate, cancelled, rides.size()))
                    .severity("CRITICAL")
                    .metricHighlight(String.format("%.1f%% Cancel Rate", cancelRate))
                    .build());
        } else {
            insights.add(AnalyticsInsightDto.builder()
                    .category("EFFICIENCY")
                    .title("Healthy Ride Fulfillment")
                    .message(String.format("Cancellation rate is under control at %.1f%% with reliable completion rates across the organization.", cancelRate))
                    .severity("SUCCESS")
                    .metricHighlight(String.format("%.1f%% Low Cancel", cancelRate))
                    .build());
        }

        // 3. Top Route Demand Insight
        List<Object[]> routes = analyticsRepository.findRouteAnalytics(orgId, from, to);
        if (!routes.isEmpty()) {
            Object[] topRoute = routes.get(0);
            String pickup = (String) topRoute[0];
            String dest = (String) topRoute[1];
            long count = ((Number) topRoute[2]).longValue();
            insights.add(AnalyticsInsightDto.builder()
                    .category("ROUTE")
                    .title("High-Demand Transit Corridor")
                    .message(String.format("Route '%s → %s' represents the highest transit demand with %d ride requests.", pickup, dest, count))
                    .severity("INFO")
                    .metricHighlight(pickup + " → " + dest)
                    .build());
        }

        return insights;
    }

    @Override
    @Transactional(readOnly = true)
    public String exportAnalyticsCsv(LocalDate from, LocalDate to) {
        UserPrincipal currentUser = getCurrentUserPrincipal();
        verifyManagementRole(currentUser);
        validateDateRange(from, to);

        UUID orgId = currentUser.getOrganizationId();
        List<Ride> rides = analyticsRepository.findTenantRidesInDateRange(orgId, from, to);

        StringBuilder sb = new StringBuilder();
        sb.append("Booking Reference,Booking Date,Pickup Time,Pickup Location,Destination,Employee Name,Status,Driver Name,Vehicle Reg,Created At\n");

        for (Ride r : rides) {
            String driverName = r.getDriver() != null ? r.getDriver().getUser().getFullName() : "UNASSIGNED";
            String vehicleReg = r.getVehicle() != null ? r.getVehicle().getRegistrationNumber() : "UNASSIGNED";
            String empName = r.getEmployee() != null ? r.getEmployee().getFullName() : "UNKNOWN";

            sb.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                    escapeCsv(r.getBookingReference()),
                    r.getBookingDate(),
                    r.getPickupTime(),
                    escapeCsv(r.getPickupLocation()),
                    escapeCsv(r.getDestination()),
                    escapeCsv(empName),
                    r.getStatus(),
                    escapeCsv(driverName),
                    escapeCsv(vehicleReg),
                    r.getCreatedAt()
            ));
        }

        return sb.toString();
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new InvalidBookingException("The start date ('from') cannot be after the end date ('to').");
        }
    }

    private UserPrincipal getCurrentUserPrincipal() {
        UserPrincipal currentUser = UserContextHolder.getContext();
        if (currentUser == null || currentUser.getUserId() == null || currentUser.getOrganizationId() == null) {
            throw new UnauthorizedAccessException("Authentication required. Tenant context missing.");
        }
        return currentUser;
    }

    private void verifyManagementRole(UserPrincipal currentUser) {
        UserRole role = currentUser.getRole();
        if (role != UserRole.TRANSPORT_MANAGER && role != UserRole.CORPORATE_ADMIN && role != UserRole.SYSTEM_ADMIN) {
            throw new UnauthorizedAccessException("Access denied. Only Transport Managers and Corporate Admins can access Transportation Reporting & Analytics.");
        }
    }

    private String escapeCsv(String str) {
        if (str == null) return "";
        return str.replace("\"", "\"\"");
    }
}
