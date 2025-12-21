import { format, formatDistanceToNow } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Inmate, InmateWarnings } from '@/types';

interface InmateProfileProps {
  inmate: Inmate;
  warnings?: InmateWarnings;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export function InmateProfile({ inmate, warnings }: InmateProfileProps) {
  const releaseDate = parseDate(inmate.release);
  const fetchedDate = parseDate(inmate.datetime_fetched);

  return (
    <TooltipProvider>
      <Card className="h-[600px] overflow-y-auto">
        <CardHeader>
          <CardTitle>Inmate Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            {inmate.url ? (
              <a
                href={inmate.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline"
              >
                {inmate.last_name}, {inmate.first_name}
              </a>
            ) : (
              <p className="font-medium">
                {inmate.last_name}, {inmate.first_name}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ID</p>
            <p className="font-medium">
              {inmate.jurisdiction} #{inmate.id.toString().padStart(8, '0')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Unit</p>
            <Link
              to={`/units/${encodeURIComponent(inmate.unit.jurisdiction)}/${encodeURIComponent(inmate.unit.name)}`}
              className="font-medium text-primary underline"
            >
              {inmate.unit.name}
            </Link>
          </div>
          {inmate.race && (
            <div>
              <p className="text-sm text-muted-foreground">Race</p>
              <p className="font-medium">{inmate.race}</p>
            </div>
          )}
          {inmate.sex && (
            <div>
              <p className="text-sm text-muted-foreground">Sex</p>
              <p className="font-medium">{inmate.sex}</p>
            </div>
          )}
          {inmate.release && (
            <div>
              <p className="text-sm text-muted-foreground">Release Date</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {releaseDate ? format(releaseDate, 'MMMM d, yyyy') : inmate.release}
                </p>
                {warnings?.release && (
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{warnings.release}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}

          {fetchedDate && (
            <div>
              <p className="text-sm text-muted-foreground">Data Last Updated</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {formatDistanceToNow(fetchedDate, { addSuffix: true })}
                </p>
                {warnings?.entry_age && (
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{warnings.entry_age}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}

          {inmate.lookups.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Recent Lookups</p>
              <ul className="space-y-1 text-sm">
                {inmate.lookups.map((lookup, index) => (
                  <li key={index} className="text-muted-foreground">
                    {format(new Date(lookup.datetime_created), 'MMM d, yyyy h:mm a')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
