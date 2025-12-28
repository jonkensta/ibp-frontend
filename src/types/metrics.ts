export interface MonthlyMetricPoint {
  month: string; // "YYYY-MM"
  filled_count: number;
  tossed_count: number;
  total_count: number;
}

export interface RequestMetricsResponse {
  data: MonthlyMetricPoint[];
  filters_applied: Record<string, unknown>;
}

export type DateRangePreset = '6months' | '12months' | 'all';

export interface MetricsFilters {
  unitJurisdiction?: string;
  unitName?: string;
  jurisdiction: 'Texas' | 'Federal' | 'All';
  action: 'Filled' | 'Tossed' | 'All';
  dateRange: DateRangePreset;
}
