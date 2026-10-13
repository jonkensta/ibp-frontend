import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Trash2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, PanelBody, PanelHeading, PanelTitle } from '@/components/ui/panel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteRequest, printRequestLabel } from '@/hooks';
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
    (a, b) =>
      new Date(b.date_postmarked + 'T00:00:00').getTime() -
      new Date(a.date_postmarked + 'T00:00:00').getTime()
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

  const handlePrint = async (requestIndex: number) => {
    try {
      const result = await printRequestLabel(jurisdiction, inmateId, requestIndex);
      if (result.method === 'print-server') {
        toast.success('Label sent to the label printer');
      } else {
        // Browser print dialog provides its own feedback; just explain why it appeared
        toast.message('Print server unavailable — using the browser print dialog', {
          description: result.printServerError,
        });
      }
      onPrintLabel?.();
    } catch (error) {
      console.error('Failed to print label:', error);
      toast.error(`Failed to print label: ${error}`);
    }
  };

  return (
    <>
      <Panel>
        <PanelHeading>
          <PanelTitle>Package Requests ({requests.length})</PanelTitle>
        </PanelHeading>
        <PanelBody className="flex flex-col gap-4">
          <div className="flex-1 max-h-[250px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 font-semibold">Postmark</th>
                  <th className="py-2 font-semibold">Action</th>
                  <th className="w-10" />
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {sortedRequests.map((request) => (
                  <tr
                    key={request.index}
                    className="group border-b last:border-b-0 hover:bg-muted/50"
                    title={`Processed ${request.date_processed}`}
                  >
                    <td className="py-1.5">{request.date_postmarked}</td>
                    <td className="py-1.5">{request.action}</td>
                    <td className="py-1.5">
                      {request.action !== 'Tossed' && (
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
                          onClick={() => handlePrint(request.index)}
                          aria-label="Print request label"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                    <td className="py-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={() => handleDeleteClick(request.index)}
                        disabled={deleteRequestMutation.isPending}
                        aria-label="Delete request"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
              <p className="pt-2 text-sm text-muted-foreground">No requests yet.</p>
            )}
          </div>
          {children}
        </PanelBody>
      </Panel>

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
