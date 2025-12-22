import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearchInmates } from '@/hooks';

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

  // Auto-redirect on single result
  useEffect(() => {
    if (data && data.inmates.length === 1 && debouncedQuery) {
      const inmate = data.inmates[0];
      navigate(`/inmates/${inmate.jurisdiction}/${inmate.id}`);
      setQuery('');
      setDebouncedQuery('');
    }
  }, [data, debouncedQuery, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      // If we don't have a single result, navigate to search page
      if (!data || data.inmates.length !== 1) {
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
