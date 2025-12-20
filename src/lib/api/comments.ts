import type { Comment, CommentCreate, Jurisdiction } from '@/types';
import { apiPost, apiDelete } from './client';

export async function createComment(
  jurisdiction: Jurisdiction,
  inmateId: number,
  data: CommentCreate
): Promise<Comment> {
  return apiPost<Comment>(
    `/inmates/${encodeURIComponent(jurisdiction)}/${inmateId}/comments`,
    data
  );
}

export async function deleteComment(
  jurisdiction: Jurisdiction,
  inmateId: number,
  commentIndex: number
): Promise<void> {
  return apiDelete<void>(
    `/inmates/${encodeURIComponent(jurisdiction)}/${inmateId}/comments/${commentIndex}`
  );
}
