import { Panel, PanelBody, PanelHeading, PanelTitle } from '@/components/ui/panel';
import { Skeleton } from '@/components/ui/skeleton';

export function InmateProfileSkeleton() {
  return (
    <Panel>
      <PanelHeading>
        <PanelTitle>Inmate Lookup</PanelTitle>
      </PanelHeading>
      <PanelBody className="space-y-3">
        {[32, 28, 16, 24, 20, 12, 24, 24, 32].map((width, i) => (
          <div key={i} className="flex justify-between gap-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5" style={{ width: `${width * 4}px` }} />
          </div>
        ))}
      </PanelBody>
    </Panel>
  );
}
