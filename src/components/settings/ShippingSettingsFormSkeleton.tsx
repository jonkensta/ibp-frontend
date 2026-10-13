import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ShippingSettingsFormSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Return address fields */}
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}

        {/* Unit recipient line */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Save button */}
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
