package com.corporate.rides.controller;

import com.corporate.rides.dto.*;
import com.corporate.rides.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AnalyticsOverviewDto>> getOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        AnalyticsOverviewDto data = analyticsService.getOverviewAnalytics(from, to);
        return ResponseEntity.ok(ApiResponse.success(data, "Analytics overview retrieved successfully"));
    }

    @GetMapping("/rides")
    public ResponseEntity<ApiResponse<List<RideTrendDto>>> getRideTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<RideTrendDto> data = analyticsService.getRideTrends(from, to);
        return ResponseEntity.ok(ApiResponse.success(data, "Ride trends retrieved successfully"));
    }

    @GetMapping("/drivers")
    public ResponseEntity<ApiResponse<List<DriverAnalyticsDto>>> getDriverAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<DriverAnalyticsDto> data = analyticsService.getDriverAnalytics(from, to);
        return ResponseEntity.ok(ApiResponse.success(data, "Driver analytics retrieved successfully"));
    }

    @GetMapping("/vehicles")
    public ResponseEntity<ApiResponse<List<VehicleAnalyticsDto>>> getVehicleAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<VehicleAnalyticsDto> data = analyticsService.getVehicleAnalytics(from, to);
        return ResponseEntity.ok(ApiResponse.success(data, "Vehicle analytics retrieved successfully"));
    }

    @GetMapping("/routes")
    public ResponseEntity<ApiResponse<List<RouteAnalyticsDto>>> getRouteAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<RouteAnalyticsDto> data = analyticsService.getRouteAnalytics(from, to);
        return ResponseEntity.ok(ApiResponse.success(data, "Route analytics retrieved successfully"));
    }

    @GetMapping("/peak-hours")
    public ResponseEntity<ApiResponse<List<PeakHourAnalyticsDto>>> getPeakHours(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<PeakHourAnalyticsDto> data = analyticsService.getPeakHourAnalytics(from, to);
        return ResponseEntity.ok(ApiResponse.success(data, "Peak hour analytics retrieved successfully"));
    }

    @GetMapping("/capacity")
    public ResponseEntity<ApiResponse<List<CapacityAnalysisDto>>> getCapacityAnalysis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<CapacityAnalysisDto> data = analyticsService.getCapacityAnalysis(from, to);
        return ResponseEntity.ok(ApiResponse.success(data, "Capacity analysis retrieved successfully"));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<List<AnalyticsInsightDto>>> getInsights(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<AnalyticsInsightDto> data = analyticsService.getIntelligentInsights(from, to);
        return ResponseEntity.ok(ApiResponse.success(data, "Intelligent insights retrieved successfully"));
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        String csv = analyticsService.exportAnalyticsCsv(from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transportation_report_" + LocalDate.now() + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
