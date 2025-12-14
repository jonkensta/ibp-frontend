import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InmateSearchFormProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialQuery?: string;
}

export function InmateSearchForm({
  onSearch,
  isLoading = false,
  initialQuery = '',
}: InmateSearchFormProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Search by name (e.g., John Smith) or ID (e.g., 12345678)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1"
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading || !query.trim()}>
        {isLoading ? 'Searching...' : 'Search'}
      </Button>
    </form>
  );
}
