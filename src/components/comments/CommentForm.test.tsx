import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { QueryWrapper } from '@/test/utils';
import { CommentForm } from './CommentForm';
import * as api from '@/lib/api/comments';

// Mock the API layer instead of the hooks
vi.mock('@/lib/api/comments');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CommentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
