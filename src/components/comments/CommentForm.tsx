import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    watch,
    formState: { errors },
    reset,
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      author: '',
      body: '',
    },
  });

  const body = watch('body');
  const bodyLength = body?.length || 0;

  const onSubmit = async (data: CommentFormData) => {
    try {
      await createCommentMutation.mutateAsync(data);
      reset();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Comment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {createCommentMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>Failed to create comment. Please try again.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input id="author" placeholder="Your name" {...register('author')} />
            {errors.author && <p className="text-sm text-red-500">{errors.author.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Comment</Label>
              <span
                className={`text-xs ${bodyLength > 60 ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                {bodyLength}/60
              </span>
            </div>
            <Input
              id="body"
              placeholder="Add your comment..."
              {...register('body')}
              maxLength={60}
            />
            {errors.body && <p className="text-sm text-red-500">{errors.body.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={createCommentMutation.isPending}>
            {createCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
