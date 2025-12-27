import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { QueryWrapper } from '@/test/utils';
import { CommentForm } from './CommentForm';
import { useCreateComment } from '@/hooks/useComments';

vi.mock('@/hooks/useComments');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CommentForm', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
    } as any);
  });

  it('should render form fields and submit button', async () => {
    render(
      <QueryWrapper>
        <CommentForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const authorInput = page.getByLabelText(/author/i);
    await expect.element(authorInput).toBeInTheDocument();

    const commentInput = page.getByLabelText(/^comment$/i);
    await expect.element(commentInput).toBeInTheDocument();

    const submitButton = page.getByRole('button', { name: /add/i });
    await expect.element(submitButton).toBeInTheDocument();
  });

  it('should display character counter', async () => {
    render(
      <QueryWrapper>
        <CommentForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const counter = page.getByText('0/60');
    await expect.element(counter).toBeInTheDocument();
  });

  it('should update character counter when typing', async () => {
    render(
      <QueryWrapper>
        <CommentForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const commentInput = page.getByLabelText(/^comment$/i);
    await commentInput.fill('Test comment');

    const counter = page.getByText('12/60');
    await expect.element(counter).toBeInTheDocument();
  });

  it('should show validation error for empty author', async () => {
    render(
      <QueryWrapper>
        <CommentForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const commentInput = page.getByLabelText(/^comment$/i);
    await commentInput.fill('Test comment');

    const submitButton = page.getByRole('button', { name: /add/i });
    await submitButton.click();

    const error = page.getByText(/author required/i);
    await expect.element(error).toBeInTheDocument();
  });

  it('should show validation error for empty comment', async () => {
    render(
      <QueryWrapper>
        <CommentForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const authorInput = page.getByLabelText(/author/i);
    await authorInput.fill('JD');

    const submitButton = page.getByRole('button', { name: /add/i });
    await submitButton.click();

    const error = page.getByText(/comment is required/i);
    await expect.element(error).toBeInTheDocument();
  });

  it('should enforce 60 character limit', async () => {
    render(
      <QueryWrapper>
        <CommentForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const commentInput = page.getByLabelText(/^comment$/i);
    const longText = 'a'.repeat(70);
    await commentInput.fill(longText);

    const element = await commentInput.query();
    // maxLength attribute enforces 60 characters
    expect(element?.value.length).toBeLessThanOrEqual(60);
  });

  it('should call mutation when form is valid', async () => {
    mockMutateAsync.mockResolvedValue({ index: 1 });

    render(
      <QueryWrapper>
        <CommentForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const authorInput = page.getByLabelText(/author/i);
    await authorInput.fill('JD');

    const commentInput = page.getByLabelText(/^comment$/i);
    await commentInput.fill('Test comment');

    const submitButton = page.getByRole('button', { name: /add/i });
    await submitButton.click();

    await page.waitForFunction(() => mockMutateAsync.mock.calls.length > 0);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      author: 'JD',
      body: 'Test comment',
    });
  });

  it('should reset form after successful submission', async () => {
    mockMutateAsync.mockResolvedValue({ index: 1 });

    render(
      <QueryWrapper>
        <CommentForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const authorInput = page.getByLabelText(/author/i);
    await authorInput.fill('JD');

    const commentInput = page.getByLabelText(/^comment$/i);
    await commentInput.fill('Test comment');

    const submitButton = page.getByRole('button', { name: /add/i });
    await submitButton.click();

    // Wait for form to reset
    await page.waitForFunction(async () => {
      const author = await authorInput.query();
      const comment = await commentInput.query();
      return author?.value === '' && comment?.value === '';
    });

    const authorElement = await authorInput.query();
    const commentElement = await commentInput.query();
    expect(authorElement?.value).toBe('');
    expect(commentElement?.value).toBe('');
  });

  it('should disable submit button when pending', async () => {
    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
    } as any);

    render(
      <QueryWrapper>
        <CommentForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const submitButton = page.getByRole('button', { name: /\.\.\./i });
    await expect.element(submitButton).toBeDisabled();
  });
});
