import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function InmateProfileSkeleton() {
  return (
    <Card className="h-[600px] overflow-y-auto">
      <CardHeader>
        <CardTitle>Inmate Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Name */}
        <div>
          <Skeleton className="h-4 w-12 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>

        {/* ID */}
        <div>
          <Skeleton className="h-4 w-8 mb-2" />
          <Skeleton className="h-5 w-40" />
        </div>

        {/* Unit */}
        <div>
          <Skeleton className="h-4 w-12 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Race */}
        <div>
          <Skeleton className="h-4 w-12 mb-2" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Sex */}
        <div>
          <Skeleton className="h-4 w-10 mb-2" />
          <Skeleton className="h-5 w-16" />
        </div>

        {/* Release Date */}
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-5 w-36" />
        </div>

        {/* Data Last Updated */}
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-5 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
