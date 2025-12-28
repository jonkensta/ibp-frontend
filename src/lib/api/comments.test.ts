import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createComment, deleteComment } from './comments';
import type { CommentCreate } from '@/types';

const mockFetch = vi.fn();
window.fetch = mockFetch;

describe('Comments API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('createComment', () => {
    it('should create a comment with correct URL and data', async () => {
      const mockComment = {
        index: 1,
        author: 'JD',
        body: 'Test comment',
        datetime_created: '2024-12-25T10:00:00Z',
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockComment), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const commentData: CommentCreate = {
        author: 'JD',
        body: 'Test comment',
      };

      const result = await createComment('Texas', 12345, commentData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/inmates/Texas/12345/comments'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(commentData),
        })
      );
      expect(result).toEqual(mockComment);
    });

    it('should handle jurisdiction with spaces', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const commentData: CommentCreate = {
        author: 'JD',
        body: 'Test',
      };

      await createComment('Texas', 12345, commentData);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('Texas'), expect.anything());
    });

    it('should enforce character limits in data', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const commentData: CommentCreate = {
        author: 'JD',
        body: 'Short comment',
      };

      await createComment('Texas', 12345, commentData);

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.author.length).toBeLessThanOrEqual(60);
      expect(body.body.length).toBeLessThanOrEqual(60);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment with correct URL', async () => {
      mockFetch.mockResolvedValue(
        new Response(null, {
          status: 204,
        })
      );

      await deleteComment('Texas', 12345, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/inmates/Texas/12345/comments/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle jurisdiction with special characters', async () => {
      mockFetch.mockResolvedValue(
        new Response(null, {
          status: 204,
        })
      );

      await deleteComment('Federal', 67890, 2);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('Federal'), expect.anything());
    });

    it('should throw error for failed deletion', async () => {
      mockFetch.mockResolvedValue(
        new Response('Not Found', {
          status: 404,
          statusText: 'Not Found',
        })
      );

      await expect(deleteComment('Texas', 12345, 999)).rejects.toThrow();
    });
  });
});
