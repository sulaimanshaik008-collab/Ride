package com.corporate.rides.config;

import com.corporate.rides.entity.Organization;
import com.corporate.rides.entity.Ride;
import com.corporate.rides.entity.User;
import com.corporate.rides.enums.RideStatus;
import com.corporate.rides.enums.UserRole;
import com.corporate.rides.repository.OrganizationRepository;
import com.corporate.rides.repository.RideRepository;
import com.corporate.rides.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import com.corporate.rides.entity.Driver;
import com.corporate.rides.entity.Vehicle;
import com.corporate.rides.enums.DriverAvailability;
import com.corporate.rides.enums.DriverStatus;
import com.corporate.rides.enums.MaintenanceStatus;
import com.corporate.rides.enums.VehicleAvailability;
import com.corporate.rides.enums.VehicleStatus;
import com.corporate.rides.enums.VehicleType;
import com.corporate.rides.repository.DriverRepository;
import com.corporate.rides.repository.VehicleRepository;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    @Override
    public void run(String... args) throws Exception {
        if (organizationRepository.count() == 0) {
            // Seed Organization 1: Acme Global Corp
            Organization acme = organizationRepository.save(Organization.builder()
                    .name("Acme Global Corp")
                    .code("ACME")
                    .build());

            // Seed Organization 2: TechCorp Industries
            Organization techcorp = organizationRepository.save(Organization.builder()
                    .name("TechCorp Solutions")
                    .code("TECHCORP")
                    .build());

            // Seed Users for Acme
            User acmeEmp1 = userRepository.save(User.builder()
                    .organization(acme)
                    .email("employee.acme@corporate.com")
                    .fullName("Alex Morgan")
                    .phoneNumber("+1 (555) 019-2834")
                    .department("Software Engineering")
                    .role(UserRole.EMPLOYEE)
                    .build());

            User acmeEmp2 = userRepository.save(User.builder()
                    .organization(acme)
                    .email("sarah.acme@corporate.com")
                    .fullName("Sarah Jenkins")
                    .phoneNumber("+1 (555) 019-8765")
                    .department("Product Operations")
                    .role(UserRole.EMPLOYEE)
                    .build());

            userRepository.save(User.builder()
                    .organization(acme)
                    .email("manager.acme@corporate.com")
                    .fullName("Marcus Vance")
                    .phoneNumber("+1 (555) 019-3322")
                    .department("Transport Operations")
                    .role(UserRole.TRANSPORT_MANAGER)
                    .build());

            // Seed Drivers for Acme
            User acmeDriverUser1 = userRepository.save(User.builder()
                    .organization(acme)
                    .email("driver1.acme@corporate.com")
                    .fullName("John Driver")
                    .phoneNumber("+1 (555) 777-1001")
                    .department("Fleet Services")
                    .role(UserRole.DRIVER)
                    .build());

            driverRepository.save(Driver.builder()
                    .user(acmeDriverUser1)
                    .organization(acme)
                    .licenseNumber("DL-ACME-9081")
                    .licenseExpiryDate(LocalDate.now().plusYears(2))
                    .driverStatus(DriverStatus.ACTIVE)
                    .availabilityStatus(DriverAvailability.AVAILABLE)
                    .build());

            User acmeDriverUser2 = userRepository.save(User.builder()
                    .organization(acme)
                    .email("driver2.acme@corporate.com")
                    .fullName("Robert Vance")
                    .phoneNumber("+1 (555) 777-1002")
                    .department("Executive Shuttle")
                    .role(UserRole.DRIVER)
                    .build());

            driverRepository.save(Driver.builder()
                    .user(acmeDriverUser2)
                    .organization(acme)
                    .licenseNumber("DL-ACME-4412")
                    .licenseExpiryDate(LocalDate.now().plusYears(1))
                    .driverStatus(DriverStatus.ACTIVE)
                    .availabilityStatus(DriverAvailability.OFF_DUTY)
                    .build());

            // Seed Vehicles for Acme
            vehicleRepository.save(Vehicle.builder()
                    .organization(acme)
                    .registrationNumber("REG-ACME-101")
                    .vehicleType(VehicleType.SEDAN)
                    .make("Toyota")
                    .model("Camry Hybrid")
                    .manufacturingYear(2024)
                    .seatingCapacity(4)
                    .vehicleStatus(VehicleStatus.ACTIVE)
                    .availabilityStatus(VehicleAvailability.AVAILABLE)
                    .maintenanceStatus(MaintenanceStatus.GOOD)
                    .insuranceExpiryDate(LocalDate.now().plusYears(1))
                    .permitExpiryDate(LocalDate.now().plusYears(2))
                    .build());

            vehicleRepository.save(Vehicle.builder()
                    .organization(acme)
                    .registrationNumber("REG-ACME-202")
                    .vehicleType(VehicleType.SUV)
                    .make("Ford")
                    .model("Explorer")
                    .manufacturingYear(2023)
                    .seatingCapacity(6)
                    .vehicleStatus(VehicleStatus.ACTIVE)
                    .availabilityStatus(VehicleAvailability.AVAILABLE)
                    .maintenanceStatus(MaintenanceStatus.GOOD)
                    .insuranceExpiryDate(LocalDate.now().plusMonths(6))
                    .permitExpiryDate(LocalDate.now().plusYears(1))
                    .build());

            vehicleRepository.save(Vehicle.builder()
                    .organization(acme)
                    .registrationNumber("REG-ACME-303")
                    .vehicleType(VehicleType.MINIBUS)
                    .make("Mercedes-Benz")
                    .model("Sprinter")
                    .manufacturingYear(2022)
                    .seatingCapacity(14)
                    .vehicleStatus(VehicleStatus.ACTIVE)
                    .availabilityStatus(VehicleAvailability.MAINTENANCE)
                    .maintenanceStatus(MaintenanceStatus.MAINTENANCE)
                    .insuranceExpiryDate(LocalDate.now().plusYears(1))
                    .permitExpiryDate(LocalDate.now().plusYears(1))
                    .build());

            // Seed Users & Drivers for TechCorp
            User techEmp1 = userRepository.save(User.builder()
                    .organization(techcorp)
                    .email("employee.tech@corporate.com")
                    .fullName("David Chen")
                    .phoneNumber("+1 (555) 088-1122")
                    .department("Data Science")
                    .role(UserRole.EMPLOYEE)
                    .build());

            User techDriverUser1 = userRepository.save(User.builder()
                    .organization(techcorp)
                    .email("driver.tech@corporate.com")
                    .fullName("Elena Rostova")
                    .phoneNumber("+1 (555) 888-2020")
                    .department("Transport Logistics")
                    .role(UserRole.DRIVER)
                    .build());

            driverRepository.save(Driver.builder()
                    .user(techDriverUser1)
                    .organization(techcorp)
                    .licenseNumber("DL-TECH-8821")
                    .licenseExpiryDate(LocalDate.now().plusYears(3))
                    .driverStatus(DriverStatus.ACTIVE)
                    .availabilityStatus(DriverAvailability.AVAILABLE)
                    .build());

            // Seed Vehicles for TechCorp
            vehicleRepository.save(Vehicle.builder()
                    .organization(techcorp)
                    .registrationNumber("REG-TECH-901")
                    .vehicleType(VehicleType.VAN)
                    .make("Hyundai")
                    .model("Staria")
                    .manufacturingYear(2024)
                    .seatingCapacity(8)
                    .vehicleStatus(VehicleStatus.ACTIVE)
                    .availabilityStatus(VehicleAvailability.AVAILABLE)
                    .maintenanceStatus(MaintenanceStatus.GOOD)
                    .insuranceExpiryDate(LocalDate.now().plusYears(2))
                    .permitExpiryDate(LocalDate.now().plusYears(2))
                    .build());

            // Seed initial ride for Acme Employee 1
            rideRepository.save(Ride.builder()
                    .bookingReference("RIDE-20260815-1001")
                    .organization(acme)
                    .employee(acmeEmp1)
                    .pickupLocation("Residential Park, Apartment 402, North Ave")
                    .destination("Acme Global HQ - Tower A Gate 2")
                    .bookingDate(LocalDate.now().plusDays(1))
                    .pickupTime(LocalTime.of(8, 30))
                    .bookingNotes("Morning shift pick-up. Single luggage.")
                    .status(RideStatus.PENDING_APPROVAL)
                    .build());

            rideRepository.save(Ride.builder()
                    .bookingReference("RIDE-20260814-9982")
                    .organization(acme)
                    .employee(acmeEmp1)
                    .pickupLocation("Acme Global HQ - Tower A Gate 2")
                    .destination("Downtown Tech Hub Conference Center")
                    .bookingDate(LocalDate.now().minusDays(1))
                    .pickupTime(LocalTime.of(14, 0))
                    .bookingNotes("Client meeting ride")
                    .status(RideStatus.COMPLETED)
                    .build());

            // Seed initial ride for TechCorp Employee (different tenant)
            rideRepository.save(Ride.builder()
                    .bookingReference("RIDE-20260815-2005")
                    .organization(techcorp)
                    .employee(techEmp1)
                    .pickupLocation("TechCorp Innovation Campus Gate 1")
                    .destination("International Airport Terminal 2")
                    .bookingDate(LocalDate.now().plusDays(2))
                    .pickupTime(LocalTime.of(6, 15))
                    .bookingNotes("Flight departure at 8:45 AM")
                    .status(RideStatus.PENDING_APPROVAL)
                    .build());
        }
    }
}

