import { useParams } from 'react-router-dom';

export function InmateDetailPage() {
  const { jurisdiction, id } = useParams<{ jurisdiction: string; id: string }>();

  return (
    <div>
      <h1 className="text-2xl font-bold">Inmate Details</h1>
      <p className="mt-2 text-muted-foreground">
        Viewing inmate: {jurisdiction} / {id}
      </p>
    </div>
  );
}
