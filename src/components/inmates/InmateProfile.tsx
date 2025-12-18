import { format, formatDistanceToNow } from 'date-fns';
import { AlertCircle } from 'lucide-react';
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
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inmate Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">
                {inmate.last_name}, {inmate.first_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-medium">
                {inmate.jurisdiction} #{inmate.id.toString().padStart(8, '0')}
              </p>
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
            {inmate.url && (
              <div>
                <p className="text-sm text-muted-foreground">Official Record</p>
                <a
                  href={inmate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  View on provider site
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Unit Name</p>
              <p className="font-medium">{inmate.unit.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">
                {inmate.unit.street1}
                {inmate.unit.street2 && (
                  <>
                    <br />
                    {inmate.unit.street2}
                  </>
                )}
                <br />
                {inmate.unit.city}, {inmate.unit.state} {inmate.unit.zipcode}
              </p>
            </div>
            {inmate.unit.shipping_method && (
              <div>
                <p className="text-sm text-muted-foreground">Shipping Method</p>
                <p className="font-medium">{inmate.unit.shipping_method}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {fetchedDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
            <span>Data last updated {formatDistanceToNow(fetchedDate, { addSuffix: true })}</span>
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
        )}

        {inmate.lookups.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Lookups</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {inmate.lookups.map((lookup, index) => (
                  <li key={index} className="text-muted-foreground">
                    {format(new Date(lookup.datetime_created), 'MMM d, yyyy h:mm a')}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
