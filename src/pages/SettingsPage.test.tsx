import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createWrapper } from '@/test/utils';
import { SettingsPage } from './SettingsPage';

const mockFetch = vi.fn();
window.fetch = mockFetch;

vi.mock('@/components/settings', async () => {
  const actual = await vi.importActual('@/components/settings');
  return {
    ...actual,
    ShippingSettingsForm: ({ settings }: { settings: { unit_recipient_name: string } }) => (
      <div data-testid="shipping-settings-form">Form: {settings.unit_recipient_name}</div>
    ),
    ShippingSettingsFormSkeleton: () => <div data-testid="shipping-settings-skeleton" />,
  };
});

const mockSettings = {
  return_address: {
    name: 'Inside Books Project',
    street1: 'PO Box 301029',
    street2: '12 ST BOOKS',
    city: 'Austin',
    state: 'TX',
    zipcode: '78703',
  },
  unit_recipient_name: 'ATTN: MAILROOM STAFF',
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should display a loading skeleton while fetching settings', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    await render(<SettingsPage />, { wrapper: createWrapper() });

    await expect.element(page.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    await expect.element(page.getByTestId('shipping-settings-skeleton')).toBeInTheDocument();
  });

  it('should render the form with the loaded settings', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockSettings), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await render(<SettingsPage />, { wrapper: createWrapper() });

    await expect
      .element(page.getByTestId('shipping-settings-form'))
      .toHaveTextContent('Form: ATTN: MAILROOM STAFF');
    expect(mockFetch).toHaveBeenCalledWith('/api/shipping-settings', expect.anything());
  });

  it('should display an error when settings fail to load', async () => {
    mockFetch.mockResolvedValue(new Response('boom', { status: 500 }));

    await render(<SettingsPage />, { wrapper: createWrapper() });

    await expect.element(page.getByText(/failed to load shipping settings/i)).toBeInTheDocument();
  });
});
