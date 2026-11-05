import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { autoRedirectTarget, useSearchInmates } from '@/hooks';

export interface GlobalSearchRef {
  focus: () => void;
}

export const GlobalSearch = forwardRef<GlobalSearchRef>((_props, ref) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useSearchInmates(debouncedQuery);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Auto-redirect on single result, once per query: navigate() changes
  // identity after the navigation, re-running this effect before the query is
  // cleared below. A second redirect would add a second history entry, and
  // the inmate page records a lookup per entry.
  const redirectedQuery = useRef<string | null>(null);
  useEffect(() => {
    if (!debouncedQuery) {
      redirectedQuery.current = null;
      return;
    }
    const inmate = autoRedirectTarget(data);
    if (inmate && redirectedQuery.current !== debouncedQuery) {
      redirectedQuery.current = debouncedQuery;
      navigate(`/inmates/${inmate.jurisdiction}/${inmate.id}`, {
        replace: true,
        state: { searchQuery: debouncedQuery },
      });
      setTimeout(() => {
        setQuery('');
        setDebouncedQuery('');
      }, 0);
    }
  }, [data, debouncedQuery, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      // If we don't have a single result, navigate to search page
      if (!autoRedirectTarget(data)) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
        setQuery('');
        setDebouncedQuery('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative ml-auto">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search inmates..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-9 w-64 pl-9"
      />
    </form>
  );
});

GlobalSearch.displayName = 'GlobalSearch';
