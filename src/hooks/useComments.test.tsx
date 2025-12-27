import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import { useCreateComment, useDeleteComment } from './useComments';
import * as api from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Jurisdiction } from '@/types';

// Mock the API module
vi.mock('@/lib/api', () => ({
  createComment: vi.fn(),
  deleteComment: vi.fn(),
}));

// Test components
function CreateCommentTest({ jurisdiction, id, data }: { jurisdiction: Jurisdiction; id: number; data: { author: string; body: string } }) {
  const mutation = useCreateComment(jurisdiction, id);
  return (
    <div>
      <button onClick={() => mutation.mutate(data)}>Mutate</button>
      {mutation.isPending && <div>Pending</div>}
      {mutation.isSuccess && <div>Success</div>}
      {mutation.isError && <div>Error: {(mutation.error as Error).message}</div>}
      {mutation.data && <div data-testid="result">{JSON.stringify(mutation.data)}</div>}
    </div>
  );
}

function DeleteCommentTest({ jurisdiction, id, commentIndex = 1 }: { jurisdiction: Jurisdiction; id: number; commentIndex?: number }) {
  const mutation = useDeleteComment(jurisdiction, id);
  return (
    <div>
      <button data-testid="delete-btn" onClick={() => mutation.mutate(commentIndex)}>Delete</button>
      {mutation.isPending && <div>Pending</div>}
      {mutation.isSuccess && <div>Success</div>}
      {mutation.isError && <div>Error: {(mutation.error as Error).message}</div>}
    </div>
  );
}

describe('useComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCreateComment', () => {
    it('should create comment successfully', async () => {
      const commentData = {
        author: 'JD',
        body: 'Test comment',
      };

      const createdComment = {
        index: 1,
        author: 'JD',
        body: 'Test comment',
        datetime_created: '2024-12-25T10:00:00Z',
      };

      vi.mocked(api.createComment).mockResolvedValue(createdComment);

      const Wrapper = createWrapper();
      render(<CreateCommentTest jurisdiction="Texas" id={12345} data={commentData} />, { wrapper: Wrapper });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      expect(api.createComment).toHaveBeenCalledWith('Texas', 12345, commentData);
      
      const result = page.getByTestId('result');
      await expect.element(result).toHaveTextContent(JSON.stringify(createdComment));
    });

    it('should invalidate inmate query on success', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const createdComment = {
        index: 1,
        author: 'JD',
        body: 'Test comment',
        datetime_created: '2024-12-25T10:00:00Z',
      };

      vi.mocked(api.createComment).mockResolvedValue(createdComment);

      render(<CreateCommentTest jurisdiction="Texas" id={12345} data={{ author: 'JD', body: 'Test comment' }} />, { wrapper: Wrapper });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      // Should invalidate the inmate query to refresh comments list
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['inmates', 'Texas', 12345] });
    });

    it('should handle creation errors', async () => {
      vi.mocked(api.createComment).mockRejectedValue(new Error('Failed to create comment'));

      const Wrapper = createWrapper();
      render(<CreateCommentTest jurisdiction="Texas" id={12345} data={{ author: 'JD', body: 'Test' }} />, { wrapper: Wrapper });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const error = page.getByText('Error: Failed to create comment');
      await expect.element(error).toBeInTheDocument();
    });

    it('should show pending state during mutation', async () => {
      vi.mocked(api.createComment).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const Wrapper = createWrapper();
      render(<CreateCommentTest jurisdiction="Texas" id={12345} data={{ author: 'JD', body: 'Test' }} />, { wrapper: Wrapper });

      const button = page.getByRole('button', { name: 'Mutate' });
      await button.click();

      const pending = page.getByText('Pending');
      await expect.element(pending).toBeInTheDocument();
    });
  });

  describe('useDeleteComment', () => {
    it('should delete comment successfully', async () => {
      vi.mocked(api.deleteComment).mockResolvedValue(undefined);

      const Wrapper = createWrapper();
      render(<DeleteCommentTest jurisdiction="Texas" id={12345} commentIndex={1} />, { wrapper: Wrapper });

      const button = page.getByTestId('delete-btn');
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      expect(api.deleteComment).toHaveBeenCalledWith('Texas', 12345, 1);
    });

    it('should invalidate inmate query on success', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      vi.mocked(api.deleteComment).mockResolvedValue(undefined);

      render(<DeleteCommentTest jurisdiction="Federal" id={67890} commentIndex={2} />, { wrapper: Wrapper });

      const button = page.getByTestId('delete-btn');
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      // Should invalidate the inmate query to refresh comments list
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['inmates', 'Federal', 67890] });
    });

    it('should handle deletion errors', async () => {
      vi.mocked(api.deleteComment).mockRejectedValue(new Error('Failed to delete comment'));

      const Wrapper = createWrapper();
      render(<DeleteCommentTest jurisdiction="Texas" id={12345} commentIndex={1} />, { wrapper: Wrapper });

      const button = page.getByTestId('delete-btn');
      await button.click();

      const error = page.getByText('Error: Failed to delete comment');
      await expect.element(error).toBeInTheDocument();
    });

    it('should show pending state during deletion', async () => {
      vi.mocked(api.deleteComment).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const Wrapper = createWrapper();
      render(<DeleteCommentTest jurisdiction="Texas" id={12345} commentIndex={1} />, { wrapper: Wrapper });

      const button = page.getByTestId('delete-btn');
      await button.click();

      const pending = page.getByText('Pending');
      await expect.element(pending).toBeInTheDocument();
    });

    it('should handle deleting different comment indices', async () => {
      vi.mocked(api.deleteComment).mockResolvedValue(undefined);

      const Wrapper = createWrapper();
      render(<DeleteCommentTest jurisdiction="Texas" id={12345} commentIndex={5} />, { wrapper: Wrapper });

      const button = page.getByTestId('delete-btn');
      await button.click();

      const success = page.getByText('Success');
      await expect.element(success).toBeInTheDocument();

      expect(api.deleteComment).toHaveBeenCalledWith('Texas', 12345, 5);
    });
  });
});
