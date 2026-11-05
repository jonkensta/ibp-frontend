import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { InmateProfile, InmateProfileSkeleton } from '@/components/inmates';
import { RequestList, RequestForm, RequestListSkeleton } from '@/components/requests';
import { CommentList, CommentForm, CommentListSkeleton } from '@/components/comments';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInmateView, useInmateWarnings } from '@/hooks';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';
import type { Jurisdiction } from '@/types';

export function InmateDetailPage() {
  const { jurisdiction, id } = useParams<{ jurisdiction: string; id: string }>();
  const [focusRequestIndex, setFocusRequestIndex] = useState<number | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const { globalSearchRef } = useGlobalSearch();
  const location = useLocation();

  // Query carried from the search page (or a single-result auto-redirect) so
  // "Back to search" restores the results. `fromInmateDetail` tells the search
  // page not to auto-redirect straight back here on a single-result query.
  const searchQuery = (location.state as { searchQuery?: string } | null)?.searchQuery;
  const backToSearch = searchQuery ? `/search?q=${encodeURIComponent(searchQuery)}` : '/search';
  const backToSearchState = { fromInmateDetail: true };

  const inmateId = id ? parseInt(id, 10) : 0;
  // One lookup is recorded per navigation to this page (location.key);
  // refetches after adding/deleting requests or comments are read-only.
  const {
    data: inmate,
    isLoading,
    error,
  } = useInmateView(jurisdiction as Jurisdiction, inmateId, location.key);
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

  const pageHeader = (
    <div className="border-b pb-2">
      <Link
        to={backToSearch}
        state={backToSearchState}
        className="text-sm text-muted-foreground hover:underline"
      >
        &larr; Back to search
      </Link>
      <h1 className="mt-2 text-3xl font-medium">Inmate Information</h1>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {pageHeader}

        <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <Link to={backToSearch} state={backToSearchState} className="text-primary underline">
          Back to search
        </Link>
      </div>
    );
  }

  if (!inmate) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Inmate not found.</p>
        <Link to={backToSearch} state={backToSearchState} className="text-primary underline">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pageHeader}

      <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="text-center">
            <Button onClick={() => setCommentDialogOpen(true)}>Add Comment</Button>
          </div>
        </CommentList>
      </div>

      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>
          <CommentForm
            jurisdiction={jurisdiction as Jurisdiction}
            inmateId={inmateId}
            onSuccess={() => setCommentDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
