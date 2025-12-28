import { useQuery } from '@tanstack/react-query';
import { getRequestMetrics } from '@/lib/api';
import type { MetricsFilters } from '@/types';

export function useRequestMetrics(filters: Partial<MetricsFilters>) {
  return useQuery({
    queryKey: ['metrics', 'requests', filters],
    queryFn: () => getRequestMetrics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
