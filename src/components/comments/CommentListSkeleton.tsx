import { Panel, PanelBody, PanelHeading, PanelTitle } from '@/components/ui/panel';
import { Skeleton } from '@/components/ui/skeleton';

export function CommentListSkeleton() {
  return (
    <Panel>
      <PanelHeading>
        <PanelTitle>Comments</PanelTitle>
      </PanelHeading>
      <PanelBody className="flex flex-col gap-4">
        <div className="flex-1 rounded-md border">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2 border-b px-3 py-2 last:border-b-0">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
        <Skeleton className="mx-auto h-9 w-32" />
      </PanelBody>
    </Panel>
  );
}
