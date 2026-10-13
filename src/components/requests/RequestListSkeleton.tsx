import { Panel, PanelBody, PanelHeading, PanelTitle } from '@/components/ui/panel';
import { Skeleton } from '@/components/ui/skeleton';

export function RequestListSkeleton() {
  return (
    <Panel>
      <PanelHeading>
        <PanelTitle>Package Requests</PanelTitle>
      </PanelHeading>
      <PanelBody className="flex flex-col gap-4">
        <div className="flex-1 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b pb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16 flex-1" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-full" />
      </PanelBody>
    </Panel>
  );
}
