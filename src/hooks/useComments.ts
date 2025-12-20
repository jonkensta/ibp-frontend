import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment, deleteComment } from '@/lib/api';
import type { Jurisdiction, CommentCreate } from '@/types';

export function useCreateComment(jurisdiction: Jurisdiction, inmateId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CommentCreate) => createComment(jurisdiction, inmateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inmates', jurisdiction, inmateId] });
    },
  });
}

export function useDeleteComment(jurisdiction: Jurisdiction, inmateId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentIndex: number) => deleteComment(jurisdiction, inmateId, commentIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inmates', jurisdiction, inmateId] });
    },
  });
}
