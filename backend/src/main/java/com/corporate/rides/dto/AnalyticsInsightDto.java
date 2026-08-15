package com.corporate.rides.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsInsightDto {
    private String category; // "DEMAND", "FLEET", "DRIVER", "ROUTE", "EFFICIENCY"
    private String title;
    private String message;
    private String severity; // "INFO", "SUCCESS", "WARNING", "CRITICAL"
    private String metricHighlight;
}
