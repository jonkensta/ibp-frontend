import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
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
import { useDeleteComment } from '@/hooks';
import type { Comment, Jurisdiction } from '@/types';

interface CommentListProps {
  comments: Comment[];
  jurisdiction: Jurisdiction;
  inmateId: number;
  children?: React.ReactNode;
}

export function CommentList({ comments, jurisdiction, inmateId, children }: CommentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const deleteCommentMutation = useDeleteComment(jurisdiction, inmateId);

  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.datetime_created).getTime() - new Date(a.datetime_created).getTime()
  );

  const handleDeleteClick = (commentIndex: number) => {
    setCommentToDelete(commentIndex);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (commentToDelete === null) return;

    try {
      await deleteCommentMutation.mutateAsync(commentToDelete);
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment. Please try again.');
    }
  };

  return (
    <>
      <Panel>
        <PanelHeading>
          <PanelTitle>Comments ({comments.length})</PanelTitle>
        </PanelHeading>
        <PanelBody className="flex flex-col gap-4">
          <ul className="flex-1 max-h-[250px] overflow-y-auto rounded-md border empty:border-0">
            {sortedComments.map((comment) => (
              <li key={comment.index} className="group border-b px-3 py-2 last:border-b-0">
                <div className="flex items-center justify-between gap-2">
                  <small className="text-xs">
                    {format(new Date(comment.datetime_created), 'yyyy-MM-dd')}
                    {comment.author && (
                      <>
                        {' by '}
                        <strong>{comment.author}</strong>
                      </>
                    )}
                  </small>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    className="size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => handleDeleteClick(comment.index)}
                    disabled={deleteCommentMutation.isPending}
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="mt-1 text-sm">{comment.body}</p>
              </li>
            ))}
          </ul>
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
          {children}
        </PanelBody>
      </Panel>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteCommentMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>Failed to delete comment. Please try again.</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteCommentMutation.isPending}
            >
              {deleteCommentMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
