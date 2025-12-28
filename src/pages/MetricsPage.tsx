import { useState } from 'react';
import { MetricsChart, MetricsFilters } from '@/components/metrics';
import { useRequestMetrics } from '@/hooks';
import type { MetricsFilters as MetricsFiltersType } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function MetricsPage() {
  const [filters, setFilters] = useState<MetricsFiltersType>({
    jurisdiction: 'All',
    action: 'All',
    dateRange: '12months',
  });

  const { data, isLoading, isError, error } = useRequestMetrics(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Request Metrics</h1>
        <p className="text-muted-foreground mt-1">View request trends and statistics over time</p>
      </div>

      <MetricsFilters filters={filters} onFiltersChange={setFilters} />

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load metrics data.'}
          </AlertDescription>
        </Alert>
      )}

      <MetricsChart data={data?.data || []} isLoading={isLoading} />
    </div>
  );
}
