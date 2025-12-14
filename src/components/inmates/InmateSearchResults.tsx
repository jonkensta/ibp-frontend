import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import type { InmateSearchResult } from '@/types';

interface InmateSearchResultsProps {
  inmates: InmateSearchResult[];
  errors: string[];
}

export function InmateSearchResults({ inmates, errors }: InmateSearchResultsProps) {
  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <div className="rounded-md bg-yellow-50 p-4">
          <h3 className="text-sm font-medium text-yellow-800">Provider Warnings</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-yellow-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
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
