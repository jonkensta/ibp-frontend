import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Package } from '@/types';

function formatDate(value: string): string {
  const date = new Date(value + 'T00:00:00');
  return isNaN(date.getTime()) ? value : format(date, 'MMM d, yyyy');
}

/** Who the package is for, its postmark date and the inmate's warnings. */
export function PackageHeader({ pkg }: { pkg: Package }) {
  const { inmate, request, warnings } = pkg;
  const name = [inmate.first_name, inmate.last_name].filter(Boolean).join(' ') || 'Name unknown';
  const warningMessages = [warnings.entry_age, warnings.release].filter(Boolean) as string[];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{name}</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            <span>
              {inmate.jurisdiction} #{inmate.id.toString().padStart(8, '0')}
            </span>
            <span className="mx-2">·</span>
            <span>{inmate.unit?.name ?? 'Unit unknown'}</span>
            <span className="mx-2">·</span>
            <span className="font-mono">{request.code}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Postmarked</div>
          <div className="text-2xl font-semibold" data-testid="postmark-date">
            {formatDate(request.date_postmarked)}
          </div>
        </div>
      </div>

      {warningMessages.map((message) => (
        <Alert key={message} className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertTriangle className="text-yellow-600" />
          <AlertDescription className="text-foreground">{message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
