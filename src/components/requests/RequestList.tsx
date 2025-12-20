import { useState } from 'react';
import { format } from 'date-fns';
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
}

export function RequestList({ requests, jurisdiction, inmateId, children }: RequestListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);
  const deleteRequestMutation = useDeleteRequest(jurisdiction, inmateId);

  const sortedRequests = [...requests].sort(
    (a, b) => new Date(b.date_postmarked).getTime() - new Date(a.date_postmarked).getTime()
  );

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
    } catch (error) {
      console.error('Failed to delete request:', error);
      // Keep dialog open on error so user can see the error message
    }
  };

  const handleDownload = async (requestIndex: number) => {
    try {
      await downloadRequestLabel(jurisdiction, inmateId, requestIndex);
    } catch (error) {
      alert(`Failed to download label: ${error}`);
    }
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">No requests yet.</p>
          {children && (
            <>
              <div className="border-t" />
              {children}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {sortedRequests.map((request) => (
              <div
                key={request.index}
                className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Request #{request.index}</span>
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
                    <p>Postmarked: {format(new Date(request.date_postmarked), 'PP')}</p>
                    <p>Processed: {format(new Date(request.date_processed), 'PP')}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleDownload(request.index)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteClick(request.index)}
                    disabled={deleteRequestMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {children && (
            <>
              <div className="border-t" />
              {children}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete request #{requestToDelete}? This action cannot be
              undone.
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
