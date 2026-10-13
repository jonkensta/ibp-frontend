import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router';
import { Panel, PanelBody, PanelHeading, PanelTitle } from '@/components/ui/panel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Inmate, InmateWarnings } from '@/types';

interface InmateProfileProps {
  inmate: Inmate;
  warnings?: InmateWarnings;
}

const NOT_AVAILABLE = 'Not Available';

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  // For date-only strings (YYYY-MM-DD), append time to parse as local midnight
  // For datetime strings with 'T', parse as-is
  const dateString = value.includes('T') ? value : value + 'T00:00:00';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

function WarningIcon({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Tooltip>
      <TooltipTrigger aria-label={message}>
        <AlertCircle className="h-4 w-4 text-yellow-500" />
      </TooltipTrigger>
      <TooltipContent>
        <p>{message}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// One label/value row, label on the left and value right-aligned, like the
// legacy app's horizontal definition list.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 pt-2">
      <dt className="font-semibold">{label}:</dt>
      <dd className="flex items-center gap-2 text-right">{children}</dd>
    </div>
  );
}

export function InmateProfile({ inmate, warnings }: InmateProfileProps) {
  const releaseDate = parseDate(inmate.release);
  const fetchedDate = parseDate(inmate.datetime_fetched);
  const fullName = [inmate.first_name, inmate.last_name].filter(Boolean).join(' ');
  const linkClass = 'text-primary underline';

  return (
    <TooltipProvider>
      <Panel>
        <PanelHeading>
          <PanelTitle>Inmate Lookup</PanelTitle>
        </PanelHeading>
        <PanelBody className="pt-2">
          <dl className="text-sm">
            <Field label="Name">
              {!fullName ? (
                NOT_AVAILABLE
              ) : inmate.url ? (
                <a
                  href={inmate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {fullName}
                </a>
              ) : (
                fullName
              )}
            </Field>

            <Field label="Unit">
              {!inmate.unit ? (
                NOT_AVAILABLE
              ) : inmate.unit.url ? (
                <a
                  href={inmate.unit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {inmate.unit.name}
                </a>
              ) : (
                <Link
                  to={`/units/${encodeURIComponent(inmate.unit.jurisdiction)}/${encodeURIComponent(inmate.unit.name)}`}
                  className={linkClass}
                >
                  {inmate.unit.name}
                </Link>
              )}
            </Field>

            <Field label="Jurisdiction">{inmate.jurisdiction}</Field>
            <Field label="ID">{inmate.id.toString().padStart(8, '0')}</Field>
            <Field label="Race">{inmate.race || NOT_AVAILABLE}</Field>
            <Field label="Sex">{inmate.sex || NOT_AVAILABLE}</Field>

            <Field label="Release date">
              <WarningIcon message={warnings?.release} />
              {releaseDate ? format(releaseDate, 'yyyy-MM-dd') : inmate.release || NOT_AVAILABLE}
            </Field>

            <Field label="Date verified">
              <WarningIcon message={warnings?.entry_age} />
              {fetchedDate ? format(fetchedDate, 'yyyy-MM-dd') : NOT_AVAILABLE}
            </Field>

            <Field label="Lookups">
              <ul>
                {inmate.lookups.map((lookup, index) => (
                  <li key={index}>
                    {format(new Date(lookup.datetime_created), "yyyy-MM-dd 'at' HH:mm")}
                  </li>
                ))}
              </ul>
            </Field>
          </dl>
        </PanelBody>
      </Panel>
    </TooltipProvider>
  );
}
