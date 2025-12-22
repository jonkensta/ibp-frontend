import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { InmateSearchForm, InmateSearchResults } from '@/components/inmates';
import { useSearchInmates } from '@/hooks';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  const { data, isLoading, error } = useSearchInmates(query);

  // Auto-redirect on single result
  useEffect(() => {
    if (data && data.inmates.length === 1 && !isLoading) {
      const inmate = data.inmates[0];
      navigate(`/inmates/${inmate.jurisdiction}/${inmate.id}`, { replace: true });
    }
  }, [data, isLoading, navigate]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setSearchParams({ q: newQuery });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search Inmates</h1>
        <p className="mt-1 text-muted-foreground">
          Search by inmate name or ID number to view their information.
        </p>
      </div>

      <InmateSearchForm onSearch={handleSearch} isLoading={isLoading} initialQuery={query} />

      {error && (
        <div className="rounded-md bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'An error occurred while searching.'}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">Searching...</p>
        </div>
      )}

      {data && !isLoading && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Found {data.inmates.length} result{data.inmates.length !== 1 ? 's' : ''}
          </p>
          <InmateSearchResults inmates={data.inmates} errors={data.errors} />
        </div>
      )}
    </div>
  );
}
