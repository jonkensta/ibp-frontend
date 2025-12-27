import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteRequest, downloadRequestLabel } from '@/hooks';
import type { Request, Jurisdiction } from '@/types';

interface RequestListProps {
  requests: Request[];
  jurisdiction: Jurisdiction;
  inmateId: number;
  children?: React.ReactNode;
  focusRequestIndex?: number | null;
  onPrintLabel?: () => void;
}

export function RequestList({
  requests,
  jurisdiction,
  inmateId,
  children,
  focusRequestIndex,
  onPrintLabel,
}: RequestListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);
  const deleteRequestMutation = useDeleteRequest(jurisdiction, inmateId);
  const printButtonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const sortedRequests = [...requests].sort(
    (a, b) => new Date(b.date_postmarked + 'T00:00:00').getTime() - new Date(a.date_postmarked + 'T00:00:00').getTime()
  );

  // Focus print button when a new request is created
  useEffect(() => {
    if (focusRequestIndex !== null && focusRequestIndex !== undefined) {
      // Retry mechanism to wait for DOM to update after query refetch
      let attempts = 0;
      const maxAttempts = 10;

      const tryFocus = () => {
        const button = printButtonRefs.current.get(focusRequestIndex);
        if (button) {
          button.focus();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(tryFocus, 100);
        }
      };

      // Start trying after a small initial delay
      setTimeout(tryFocus, 100);
    }
  }, [focusRequestIndex, requests]);

  const handleDeleteClick = (requestIndex: number) => {
    setRequestToDelete(requestIndex);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (requestToDelete === null) return;

    try {
      await deleteRequestMutation.mutateAsync(requestToDelete);
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
      toast.success('Request deleted');
    } catch (error) {
      console.error('Failed to delete request:', error);
      toast.error('Failed to delete request. Please try again.');
      // Keep dialog open on error so user can see the error message
    }
  };

  const handleDownload = async (requestIndex: number) => {
    try {
      await downloadRequestLabel(jurisdiction, inmateId, requestIndex);
      toast.success('Label downloaded');
      onPrintLabel?.();
    } catch (error) {
      console.error('Failed to download label:', error);
      toast.error(`Failed to download label: ${error}`);
    }
  };

  if (requests.length === 0) {
    return (
      <Card className="flex flex-col h-[600px]">
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0">
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          </div>
          <div className="border-t pt-4" />
          {children}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex flex-col h-[600px]">
        <CardHeader>
          <CardTitle>Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-3">
            {sortedRequests.map((request) => (
              <div
                key={request.index}
                className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        request.action === 'Filled'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {request.action}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Postmarked: {format(new Date(request.date_postmarked + 'T00:00:00'), 'PP')}</p>
                    <p>Processed: {format(new Date(request.date_processed + 'T00:00:00'), 'PP')}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    ref={(el) => {
                      if (el) {
                        printButtonRefs.current.set(request.index, el);
                      } else {
                        printButtonRefs.current.delete(request.index);
                      }
                    }}
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(request.index)}
                    aria-label="Download request label"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteClick(request.index)}
                    disabled={deleteRequestMutation.isPending}
                    aria-label="Delete request"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4" />
          {children}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteRequestMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>Failed to delete request. Please try again.</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteRequestMutation.isPending}
            >
              {deleteRequestMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
