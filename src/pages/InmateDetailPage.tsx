import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { InmateProfile, InmateProfileSkeleton } from '@/components/inmates';
import { RequestList, RequestForm, RequestListSkeleton } from '@/components/requests';
import { CommentList, CommentForm, CommentListSkeleton } from '@/components/comments';
import { Skeleton } from '@/components/ui/skeleton';
import { useInmate, useInmateWarnings } from '@/hooks';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';
import type { Jurisdiction } from '@/types';

export function InmateDetailPage() {
  const { jurisdiction, id } = useParams<{ jurisdiction: string; id: string }>();
  const [focusRequestIndex, setFocusRequestIndex] = useState<number | null>(null);
  const { globalSearchRef } = useGlobalSearch();

  const inmateId = id ? parseInt(id, 10) : 0;
  const { data: inmate, isLoading, error } = useInmate(jurisdiction as Jurisdiction, inmateId);
  const { data: warnings } = useInmateWarnings(jurisdiction as Jurisdiction, inmateId);

  const handleRequestCreated = (requestIndex: number, action: 'Filled' | 'Tossed') => {
    if (action === 'Tossed') {
      // For Tossed requests, skip Print Label and go directly to search
      setTimeout(() => {
        globalSearchRef.current?.focus();
      }, 100);
    } else {
      // For Filled requests, focus the Print Label button
      setFocusRequestIndex(requestIndex);
    }
  };

  const handlePrintLabel = () => {
    // Focus global search after print label
    setTimeout(() => {
      globalSearchRef.current?.focus();
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/search" className="text-sm text-muted-foreground hover:underline">
              &larr; Back to search
            </Link>
            <Skeleton className="h-8 w-64 mt-2" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <InmateProfileSkeleton />
          <RequestListSkeleton />
          <CommentListSkeleton />
        </div>
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
          focusRequestIndex={focusRequestIndex}
          onPrintLabel={handlePrintLabel}
        >
          <RequestForm
            jurisdiction={jurisdiction as Jurisdiction}
            inmateId={inmateId}
            onRequestCreated={handleRequestCreated}
          />
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
