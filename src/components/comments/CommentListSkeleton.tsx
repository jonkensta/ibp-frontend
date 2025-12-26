import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CommentListSkeleton() {
  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-3">
          {/* Comment items */}
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start justify-between border-b pb-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
        <div className="border-t pt-4">
          <Skeleton className="h-20 w-full mb-3" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
