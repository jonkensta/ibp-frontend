import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUnits } from '@/hooks';
import type { MetricsFilters } from '@/types';

interface MetricsFiltersProps {
  filters: MetricsFilters;
  onFiltersChange: (filters: MetricsFilters) => void;
}

export function MetricsFilters({ filters, onFiltersChange }: MetricsFiltersProps) {
  const { data: units, isLoading: unitsLoading } = useUnits();

  const handleUnitChange = (unitKey: string) => {
    if (unitKey === 'all') {
      onFiltersChange({
        ...filters,
        unitJurisdiction: undefined,
        unitName: undefined,
      });
    } else {
      const [jurisdiction, name] = unitKey.split('::');
      onFiltersChange({
        ...filters,
        unitJurisdiction: jurisdiction,
        unitName: name,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Unit Filter */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select
              value={
                filters.unitJurisdiction && filters.unitName
                  ? `${filters.unitJurisdiction}::${filters.unitName}`
                  : 'all'
              }
              onValueChange={handleUnitChange}
              disabled={unitsLoading}
            >
              <SelectTrigger id="unit">
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units?.map((unit) => (
                  <SelectItem
                    key={`${unit.jurisdiction}::${unit.name}`}
                    value={`${unit.jurisdiction}::${unit.name}`}
                  >
                    {unit.name} ({unit.jurisdiction})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Jurisdiction Filter */}
          <div className="space-y-2">
            <Label htmlFor="jurisdiction">Jurisdiction</Label>
            <Select
              value={filters.jurisdiction}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  jurisdiction: value as 'Texas' | 'Federal' | 'All',
                })
              }
            >
              <SelectTrigger id="jurisdiction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Jurisdictions</SelectItem>
                <SelectItem value="Texas">Texas</SelectItem>
                <SelectItem value="Federal">Federal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Filter */}
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Select
              value={filters.action}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  action: value as 'Filled' | 'Tossed' | 'All',
                })
              }
            >
              <SelectTrigger id="action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Actions</SelectItem>
                <SelectItem value="Filled">Filled</SelectItem>
                <SelectItem value="Tossed">Tossed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label htmlFor="dateRange">Date Range</Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  dateRange: value as '6months' | '12months' | 'all',
                })
              }
            >
              <SelectTrigger id="dateRange">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
