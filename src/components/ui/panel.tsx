import * as React from 'react';

import { cn } from '@/lib/utils';

// Bootstrap-style panel: a bordered box with a shaded heading bar. Used on the
// inmate page to match the layout volunteers know from the legacy app.
function Panel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel"
      className={cn(
        'bg-card text-card-foreground flex flex-col rounded-md border shadow-sm',
        className
      )}
      {...props}
    />
  );
}

function PanelHeading({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-heading"
      className={cn(
        'rounded-t-md border-b bg-gradient-to-b from-muted/40 to-muted px-4 py-2.5',
        className
      )}
      {...props}
    />
  );
}

function PanelTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3 data-slot="panel-title" className={cn('text-base font-medium', className)} {...props} />
  );
}

function PanelBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="panel-body" className={cn('flex-1 p-4', className)} {...props} />;
}

export { Panel, PanelHeading, PanelTitle, PanelBody };
