import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RequestListSkeleton() {
  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>Requests</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-3">
          {/* Request items */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between border-b pb-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-44" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-4">
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
