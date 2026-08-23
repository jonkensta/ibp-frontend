import { useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  InmateSearchForm,
  InmateSearchResults,
  InmateSearchResultsSkeleton,
} from '@/components/inmates';
import { useSearchInmates } from '@/hooks';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive the query from the URL so header searches submitted while already
  // on /search always run (the URL is the single source of truth).
  const query = searchParams.get('q') || '';

  // Set when the user navigated here via "Back to search" from a detail page.
  const fromInmateDetail = Boolean(
    (location.state as { fromInmateDetail?: boolean } | null)?.fromInmateDetail
  );

  const { data, isLoading, error } = useSearchInmates(query);

  // Auto-redirect on single result — but not when returning from a detail
  // page, which would immediately bounce the user back to the page they left.
  useEffect(() => {
    if (data && data.inmates.length === 1 && !isLoading && !fromInmateDetail) {
      const inmate = data.inmates[0];
      navigate(`/inmates/${inmate.jurisdiction}/${inmate.id}`, {
        replace: true,
        state: { searchQuery: query },
      });
    }
  }, [data, isLoading, navigate, fromInmateDetail, query]);

  const handleSearch = (newQuery: string) => {
    // setSearchParams navigates without state, clearing fromInmateDetail so a
    // fresh search can auto-redirect again.
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

      {isLoading && <InmateSearchResultsSkeleton />}

      {data && !isLoading && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Found {data.inmates.length} result{data.inmates.length !== 1 ? 's' : ''}
            {data.errors.length > 0 && ' (partial results due to provider errors)'}
          </p>
          <InmateSearchResults inmates={data.inmates} errors={data.errors} query={query} />
        </div>
      )}
    </div>
  );
}
