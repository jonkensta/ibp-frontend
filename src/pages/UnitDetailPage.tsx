import { useParams } from 'react-router-dom';

export function UnitDetailPage() {
  const { jurisdiction, name } = useParams<{ jurisdiction: string; name: string }>();

  return (
    <div>
      <h1 className="text-2xl font-bold">Unit Details</h1>
      <p className="mt-2 text-muted-foreground">
        Viewing unit: {jurisdiction} / {name}
      </p>
    </div>
  );
}
