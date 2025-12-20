import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
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
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (comments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">No comments yet.</p>
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
          <CardTitle>Comments ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {sortedComments.map((comment) => (
              <div
                key={comment.index}
                className="flex items-start justify-between border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.datetime_created), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{comment.body}</p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteClick(comment.index)}
                  disabled={deleteCommentMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
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
