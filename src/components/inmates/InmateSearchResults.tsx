import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { InmateSearchResult } from '@/types';

interface InmateSearchResultsProps {
  inmates: InmateSearchResult[];
  errors: string[];
}

export function InmateSearchResults({ inmates, errors }: InmateSearchResultsProps) {
  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>
            {errors.length === 1 ? 'Provider Error' : `${errors.length} Provider Errors`}
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Some providers encountered errors. Search results may be incomplete.
            </p>
            <ul className="list-inside list-disc space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {inmates.length === 0 ? (
        <p className="text-muted-foreground">No inmates found.</p>
      ) : (
        <div className="grid gap-3">
          {inmates.map((inmate) => (
            <Link
              key={`${inmate.jurisdiction}-${inmate.id}`}
              to={`/inmates/${encodeURIComponent(inmate.jurisdiction)}/${inmate.id}`}
            >
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">
                      {inmate.last_name}, {inmate.first_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {inmate.jurisdiction} #{inmate.id.toString().padStart(8, '0')}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {inmate.race && <p>{inmate.race}</p>}
                    {inmate.sex && <p>{inmate.sex}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
