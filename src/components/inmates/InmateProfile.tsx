import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Inmate } from '@/types';

interface InmateProfileProps {
  inmate: Inmate;
}

export function InmateProfile({ inmate }: InmateProfileProps) {
  const releaseDate = inmate.release ? new Date(inmate.release) : null;
  const fetchedDate = inmate.datetime_fetched ? new Date(inmate.datetime_fetched) : null;

  return (
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
          {releaseDate && (
            <div>
              <p className="text-sm text-muted-foreground">Release Date</p>
              <p className="font-medium">{format(releaseDate, 'MMMM d, yyyy')}</p>
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
        <div className="text-sm text-muted-foreground md:col-span-2">
          Data last updated {formatDistanceToNow(fetchedDate, { addSuffix: true })}
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
  );
}
