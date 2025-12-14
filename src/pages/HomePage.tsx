import { useNavigate } from 'react-router-dom';
import { InmateSearchForm } from '@/components/inmates';

export function HomePage() {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Inside Books Project</h1>
        <p className="mt-2 text-muted-foreground">
          Search for inmates to view their information and manage book requests.
        </p>
      </div>

      <div className="max-w-2xl">
        <InmateSearchForm onSearch={handleSearch} />
      </div>
    </div>
  );
}
