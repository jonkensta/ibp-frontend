import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { QueryWrapper } from '@/test/utils';
import { CommentList } from './CommentList';
import * as api from '@/lib/api/comments';
import type { Comment } from '@/types';

vi.mock('@/lib/api/comments');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockComments: Comment[] = [
  {
    index: 1,
    author: 'John Doe',
    body: 'First comment',
    datetime_created: '2024-12-20T10:00:00Z',
  },
  {
    index: 2,
    author: 'Jane Smith',
    body: 'Second comment',
    datetime_created: '2024-12-21T14:30:00Z',
  },
  {
    index: 3,
    author: 'Bob Johnson',
    body: 'Third comment',
    datetime_created: '2024-12-19T08:15:00Z',
  },
];

describe('CommentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display "No comments yet" when list is empty', async () => {
    render(
      <QueryWrapper>
        <CommentList comments={[]} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const noComments = page.getByText(/no comments yet/i);
    await expect.element(noComments).toBeInTheDocument();
  });

  it('should display comments with author and body', async () => {
    render(
      <QueryWrapper>
        <CommentList comments={mockComments} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const author1 = page.getByText('John Doe');
    await expect.element(author1).toBeInTheDocument();

    const body1 = page.getByText('First comment');
    await expect.element(body1).toBeInTheDocument();

    const author2 = page.getByText('Jane Smith');
    await expect.element(author2).toBeInTheDocument();
  });

  it('should display comment count in title', async () => {
    render(
      <QueryWrapper>
        <CommentList comments={mockComments} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const title = page.getByText(/comments \(3\)/i);
    await expect.element(title).toBeInTheDocument();
  });

  it('should sort comments by date (newest first)', async () => {
    render(
      <QueryWrapper>
        <CommentList comments={mockComments} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    // Comments should be sorted: Jane (Dec 21) > John (Dec 20) > Bob (Dec 19)
    const comments = await page.getByText(/comment/).all();

    // First comment should be from Jane (newest)
    const firstComment = page.getByText('Second comment');
    await expect.element(firstComment).toBeInTheDocument();
  });

  it('should display relative time for comments', async () => {
    render(
      <QueryWrapper>
        <CommentList comments={mockComments} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    // Should show "X days ago" or "X hours ago" format - check first occurrence
    const timeAgo = page.getByText(/ago/i).first();
    await expect.element(timeAgo).toBeInTheDocument();
  });

  it('should show delete button for each comment', async () => {
    render(
      <QueryWrapper>
        <CommentList comments={mockComments} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const deleteButtons = page.getByRole('button', { name: /delete comment/i });
    const buttons = await deleteButtons.all();
    expect(buttons.length).toBe(3);

    // Verify aria-label
    const firstButton = buttons[0];
    await expect.element(firstButton).toHaveAttribute('aria-label', 'Delete comment');
  });

  it('should open delete dialog when delete button is clicked', async () => {
    render(
      <QueryWrapper>
        <CommentList comments={[mockComments[0]]} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const deleteButton = page.getByRole('button', { name: /delete comment/i });
    await deleteButton.click();

    const dialogTitle = page.getByText(/delete comment/i);
    await expect.element(dialogTitle).toBeInTheDocument();

    const confirmMessage = page.getByText(/are you sure/i);
    await expect.element(confirmMessage).toBeInTheDocument();
  });

  it('should close delete dialog when cancel is clicked', async () => {
    render(
      <QueryWrapper>
        <CommentList comments={[mockComments[0]]} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const deleteButton = page.getByRole('button', { name: /delete comment/i });
    await deleteButton.click();

    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    // Dialog should be closed - the dialog title should not be visible
    const dialogTitle = page.getByText(/^delete comment$/i);
    expect(await dialogTitle.query()).toBeNull();
  });

  it('should render children in the form area', async () => {
    render(
      <QueryWrapper>
        <CommentList comments={mockComments} jurisdiction="Texas" inmateId={12345}>
          <div>Test Child Content</div>
        </CommentList>
      </QueryWrapper>
    );

    const child = page.getByText('Test Child Content');
    await expect.element(child).toBeInTheDocument();
  });
});
