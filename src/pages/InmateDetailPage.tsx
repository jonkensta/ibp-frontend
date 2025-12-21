import { useParams, Link } from 'react-router-dom';
import { InmateProfile } from '@/components/inmates';
import { RequestList, RequestForm } from '@/components/requests';
import { CommentList, CommentForm } from '@/components/comments';
import { useInmate, useInmateWarnings } from '@/hooks';
import type { Jurisdiction } from '@/types';

export function InmateDetailPage() {
  const { jurisdiction, id } = useParams<{ jurisdiction: string; id: string }>();

  const inmateId = id ? parseInt(id, 10) : 0;
  const { data: inmate, isLoading, error } = useInmate(jurisdiction as Jurisdiction, inmateId);
  const { data: warnings } = useInmateWarnings(jurisdiction as Jurisdiction, inmateId);

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Loading inmate information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to load inmate information.'}
          </p>
        </div>
        <Link to="/search" className="text-primary underline">
          Back to search
        </Link>
      </div>
    );
  }

  if (!inmate) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Inmate not found.</p>
        <Link to="/search" className="text-primary underline">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/search" className="text-sm text-muted-foreground hover:underline">
            &larr; Back to search
          </Link>
          <h1 className="mt-2 text-2xl font-bold">
            {inmate.last_name}, {inmate.first_name}
          </h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <InmateProfile inmate={inmate} warnings={warnings} />

        <RequestList
          requests={inmate.requests}
          jurisdiction={jurisdiction as Jurisdiction}
          inmateId={inmateId}
        >
          <RequestForm jurisdiction={jurisdiction as Jurisdiction} inmateId={inmateId} />
        </RequestList>

        <CommentList
          comments={inmate.comments}
          jurisdiction={jurisdiction as Jurisdiction}
          inmateId={inmateId}
        >
          <CommentForm jurisdiction={jurisdiction as Jurisdiction} inmateId={inmateId} />
        </CommentList>
      </div>
    </div>
  );
}
