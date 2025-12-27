import { useParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UnitForm, UnitFormSkeleton } from '@/components/units';
import { useUnit } from '@/hooks';
import type { Jurisdiction } from '@/types';

export function UnitDetailPage() {
  const { jurisdiction, name } = useParams<{ jurisdiction: string; name: string }>();

  const { data: unit, isLoading, isError } = useUnit(jurisdiction as Jurisdiction, name as string);

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Unit Details</h1>
        <UnitFormSkeleton />
      </div>
    );
  }

  if (isError || !unit) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Unit Details</h1>
        <Alert variant="destructive">
          <AlertDescription>Failed to load unit. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{unit.name}</h1>
      <p className="text-muted-foreground mb-6">
        {unit.jurisdiction} Jurisdiction
      </p>
      <UnitForm unit={unit} />
    </div>
  );
}
