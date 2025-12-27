import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateComment } from '@/hooks';
import type { Jurisdiction } from '@/types';

interface CommentFormProps {
  jurisdiction: Jurisdiction;
  inmateId: number;
}

const commentSchema = z.object({
  author: z.string().min(1, { message: 'Author is required' }),
  body: z
    .string()
    .min(1, { message: 'Comment is required' })
    .max(60, { message: 'Comment must be 60 characters or less' }),
});

type CommentFormData = z.infer<typeof commentSchema>;

export function CommentForm({ jurisdiction, inmateId }: CommentFormProps) {
  const createCommentMutation = useCreateComment(jurisdiction, inmateId);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      author: '',
      body: '',
    },
  });

  const body = useWatch({ control, name: 'body' });
  const bodyLength = body?.length || 0;

  const onSubmit = async (data: CommentFormData) => {
    try {
      await createCommentMutation.mutateAsync(data);
      reset();
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to create comment:', error);
      toast.error('Failed to create comment. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <h3 className="font-semibold text-sm">Add Comment</h3>

      {createCommentMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to create comment.</AlertDescription>
        </Alert>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-[1] space-y-1">
          <Label htmlFor="author" className="text-xs">
            Author
          </Label>
          <Input id="author" placeholder="Initials" {...register('author')} className="h-9" />
        </div>

        <div className="flex-[2] space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="body" className="text-xs">
              Comment
            </Label>
            <span
              className={`text-[10px] ${bodyLength > 60 ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              {bodyLength}/60
            </span>
          </div>
          <Input
            id="body"
            placeholder="Add your comment..."
            {...register('body')}
            maxLength={60}
            className="h-9"
          />
        </div>

        <Button
          type="submit"
          size="sm"
          className="h-9 px-3"
          disabled={createCommentMutation.isPending}
        >
          {createCommentMutation.isPending ? '...' : 'Add'}
        </Button>
      </div>

      {(errors.author || errors.body) && (
        <div className="text-[10px] text-red-500 flex flex-col gap-0">
          {errors.author && <span>Author required. </span>}
          {errors.body && <span>{errors.body.message}</span>}
        </div>
      )}
    </form>
  );
}
