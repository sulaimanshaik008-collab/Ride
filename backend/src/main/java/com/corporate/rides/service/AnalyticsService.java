package com.corporate.rides.service;

import com.corporate.rides.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface AnalyticsService {

    AnalyticsOverviewDto getOverviewAnalytics(LocalDate from, LocalDate to);

    List<RideTrendDto> getRideTrends(LocalDate from, LocalDate to);

    List<DriverAnalyticsDto> getDriverAnalytics(LocalDate from, LocalDate to);

    List<VehicleAnalyticsDto> getVehicleAnalytics(LocalDate from, LocalDate to);

    List<RouteAnalyticsDto> getRouteAnalytics(LocalDate from, LocalDate to);

    List<PeakHourAnalyticsDto> getPeakHourAnalytics(LocalDate from, LocalDate to);

    List<CapacityAnalysisDto> getCapacityAnalysis(LocalDate from, LocalDate to);

    List<AnalyticsInsightDto> getIntelligentInsights(LocalDate from, LocalDate to);

    String exportAnalyticsCsv(LocalDate from, LocalDate to);
}
