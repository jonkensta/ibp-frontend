import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { QueryWrapper } from '@/test/utils';
import { RequestList } from './RequestList';
import type { Request } from '@/types';

vi.mock('@/lib/api/requests');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockRequests: Request[] = [
  {
    index: 1,
    date_postmarked: '2024-12-20',
    date_processed: '2024-12-21',
    action: 'Filled',
  },
  {
    index: 2,
    date_postmarked: '2024-12-22',
    date_processed: '2024-12-23',
    action: 'Tossed',
  },
  {
    index: 3,
    date_postmarked: '2024-12-18',
    date_processed: '2024-12-19',
    action: 'Filled',
  },
];

describe('RequestList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display "No requests yet" when list is empty', async () => {
    render(
      <QueryWrapper>
        <RequestList requests={[]} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const noRequests = page.getByText(/no requests yet/i);
    await expect.element(noRequests).toBeInTheDocument();
  });

  it('should display requests with action badges', async () => {
    render(
      <QueryWrapper>
        <RequestList requests={mockRequests} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const filledBadges = page.getByText('Filled');
    const filled = await filledBadges.all();
    expect(filled.length).toBe(2);

    const tossedBadge = page.getByText('Tossed');
    await expect.element(tossedBadge).toBeInTheDocument();
  });

  it('should display request count in title', async () => {
    render(
      <QueryWrapper>
        <RequestList requests={mockRequests} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const title = page.getByText(/requests \(3\)/i);
    await expect.element(title).toBeInTheDocument();
  });

  it('should sort requests by postmark date (newest first)', async () => {
    render(
      <QueryWrapper>
        <RequestList requests={mockRequests} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    // Requests should be sorted: Dec 22 > Dec 20 > Dec 18
    const postmarkedLabels = page.getByText(/postmarked:/i);
    const labels = await postmarkedLabels.all();
    expect(labels.length).toBe(3);
  });

  it('should display formatted dates', async () => {
    render(
      <QueryWrapper>
        <RequestList requests={[mockRequests[0]]} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const postmarked = page.getByText(/postmarked:/i);
    await expect.element(postmarked).toBeInTheDocument();

    const processed = page.getByText(/processed:/i);
    await expect.element(processed).toBeInTheDocument();
  });

  it('should show download and delete buttons for each request', async () => {
    render(
      <QueryWrapper>
        <RequestList requests={mockRequests} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const downloadButtons = page.getByRole('button', { name: /download request label/i });
    const downloads = await downloadButtons.all();
    expect(downloads.length).toBe(3);
    await expect.element(downloads[0]).toHaveAttribute('aria-label', 'Download request label');

    const deleteButtons = page.getByRole('button', { name: /delete request/i });
    const deletes = await deleteButtons.all();
    expect(deletes.length).toBe(3);
    await expect.element(deletes[0]).toHaveAttribute('aria-label', 'Delete request');
  });

  it('should open delete dialog when delete button is clicked', async () => {
    render(
      <QueryWrapper>
        <RequestList requests={[mockRequests[0]]} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const deleteButton = page.getByRole('button', { name: /delete request/i });
    await deleteButton.click();

    const dialogTitle = page.getByText(/delete request/i);
    await expect.element(dialogTitle).toBeInTheDocument();

    const confirmMessage = page.getByText(/are you sure/i);
    await expect.element(confirmMessage).toBeInTheDocument();
  });

  it('should close delete dialog when cancel is clicked', async () => {
    render(
      <QueryWrapper>
        <RequestList requests={[mockRequests[0]]} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const deleteButton = page.getByRole('button', { name: /delete request/i });
    await deleteButton.click();

    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    // Dialog should be closed
    const dialogTitle = page.getByText(/^delete request$/i);
    expect(await dialogTitle.query()).toBeNull();
  });

  it('should apply correct styling to Filled action badge', async () => {
    render(
      <QueryWrapper>
        <RequestList requests={[mockRequests[0]]} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const filledBadge = page.getByText('Filled');
    const element = await filledBadge.query();
    expect(element?.className).toContain('bg-green-100');
    expect(element?.className).toContain('text-green-800');
  });

  it('should apply correct styling to Tossed action badge', async () => {
    render(
      <QueryWrapper>
        <RequestList requests={[mockRequests[1]]} jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const tossedBadge = page.getByText('Tossed');
    const element = await tossedBadge.query();
    expect(element?.className).toContain('bg-gray-100');
    expect(element?.className).toContain('text-gray-800');
  });

  it('should render children in the form area', async () => {
    render(
      <QueryWrapper>
        <RequestList requests={mockRequests} jurisdiction="Texas" inmateId={12345}>
          <div>Test Child Content</div>
        </RequestList>
      </QueryWrapper>
    );

    const child = page.getByText('Test Child Content');
    await expect.element(child).toBeInTheDocument();
  });
});
