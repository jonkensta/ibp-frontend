import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUnits } from '@/hooks';
import type { Jurisdiction } from '@/types';

type SortField = 'name' | 'city' | 'state';
type SortDirection = 'asc' | 'desc';

export function UnitDirectory() {
  const { data: units, isLoading, isError } = useUnits();
  const [searchQuery, setSearchQuery] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<Jurisdiction | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredAndSortedUnits = useMemo(() => {
    if (!units) return [];

    let filtered = units;

    // Filter by jurisdiction
    if (jurisdictionFilter !== 'all') {
      filtered = filtered.filter((unit) => unit.jurisdiction === jurisdictionFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (unit) =>
          unit.name.toLowerCase().includes(query) ||
          unit.city.toLowerCase().includes(query) ||
          unit.state.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortField].toLowerCase();
      const bValue = b[sortField].toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [units, searchQuery, jurisdictionFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading units...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load units. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Directory ({filteredAndSortedUnits.length} units)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, city, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jurisdiction">Jurisdiction</Label>
            <Select
              value={jurisdictionFilter}
              onValueChange={(value: string) =>
                setJurisdictionFilter(value as Jurisdiction | 'all')
              }
            >
              <SelectTrigger id="jurisdiction">
                <SelectValue placeholder="All jurisdictions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jurisdictions</SelectItem>
                <SelectItem value="Texas">Texas</SelectItem>
                <SelectItem value="Federal">Federal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredAndSortedUnits.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No units found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th
                    className="text-left p-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('name')}
                  >
                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-2">Jurisdiction</th>
                  <th
                    className="text-left p-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('city')}
                  >
                    City {sortField === 'city' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left p-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('state')}
                  >
                    State {sortField === 'state' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-2">Shipping Method</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUnits.map((unit) => (
                  <tr key={`${unit.jurisdiction}-${unit.name}`} className="border-b hover:bg-muted">
                    <td className="p-2">
                      <Link
                        to={`/units/${encodeURIComponent(unit.jurisdiction)}/${encodeURIComponent(unit.name)}`}
                        className="text-blue-600 hover:underline"
                      >
                        {unit.name}
                      </Link>
                    </td>
                    <td className="p-2">{unit.jurisdiction}</td>
                    <td className="p-2">{unit.city}</td>
                    <td className="p-2">{unit.state}</td>
                    <td className="p-2">{unit.shipping_method || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
