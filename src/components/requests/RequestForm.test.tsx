import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { QueryWrapper } from '@/test/utils';
import { RequestForm } from './RequestForm';
import * as api from '@/lib/api/requests';

// Mock API calls
vi.mock('@/lib/api/requests');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock UI components to avoid Radix/React conflicts in test
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect: (date: Date) => void }) => (
    <button onClick={() => onSelect(new Date('2024-12-25T12:00:00Z'))}>
      Select Date
    </button>
  ),
}));

// Mock current date for consistent cookie testing
const MOCK_DATE = new Date('2024-12-25T12:00:00Z');
vi.setSystemTime(MOCK_DATE);

describe('RequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  });

  it('should render form elements', async () => {
    render(
      <QueryWrapper>
        <RequestForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    const title = page.getByText(/add new request/i);
    await expect.element(title).toBeInTheDocument();

    const datePicker = page.getByRole('button', { name: /pick a date/i });
    await expect.element(datePicker).toBeInTheDocument();

    const fillButton = page.getByRole('button', { name: /fill/i });
    await expect.element(fillButton).toBeInTheDocument();
    await expect.element(fillButton).toBeDisabled();

    const tossButton = page.getByRole('button', { name: /toss/i });
    await expect.element(tossButton).toBeInTheDocument();
    await expect.element(tossButton).toBeDisabled();
  });

  it('should enable buttons when date is selected', async () => {
    render(
      <QueryWrapper>
        <RequestForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    // Open date picker
    const datePicker = page.getByRole('button', { name: /pick a date/i });
    await datePicker.click();

    // Select a date using the mock
    const selectDate = page.getByText('Select Date');
    await selectDate.click();

    const fillButton = page.getByRole('button', { name: /fill/i });
    await expect.element(fillButton).not.toBeDisabled();

    const tossButton = page.getByRole('button', { name: /toss/i });
    await expect.element(tossButton).not.toBeDisabled();
  });

  it('should show validation warnings when filling', async () => {
    // Mock validation to return warnings
    vi.mocked(api.validateRequest).mockResolvedValue({
      entry_age: 'Inmate entered unit too recently',
      release: undefined,
      postmarkdate: undefined,
    });

    render(
      <QueryWrapper>
        <RequestForm jurisdiction="Texas" inmateId={12345} />
      </QueryWrapper>
    );

    // Select date
    const datePicker = page.getByRole('button', { name: /pick a date/i });
    await datePicker.click();
    await page.getByText('Select Date').click();

    // Click Fill
    const fillButton = page.getByRole('button', { name: /fill/i });
    await fillButton.click();

    // Verify dialog appears
    const dialogTitle = page.getByText(/warnings detected/i);
    await expect.element(dialogTitle).toBeInTheDocument();

    const warningText = page.getByText(/inmate entered unit too recently/i);
    await expect.element(warningText).toBeInTheDocument();
  });
});
