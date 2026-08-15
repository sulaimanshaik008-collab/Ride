package com.corporate.rides.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideTrendDto {
    private LocalDate date;
    private String dayOfWeek;
    private long totalRequested;
    private long completed;
    private long cancelled;
    private long scheduled;
}
