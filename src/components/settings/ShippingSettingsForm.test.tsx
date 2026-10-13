import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { toast } from 'sonner';
import { QueryWrapper } from '@/test/utils';
import { ShippingSettingsForm } from './ShippingSettingsForm';
import type { ShippingSettings } from '@/types';

const mockFetch = vi.fn();
window.fetch = mockFetch;

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSettings: ShippingSettings = {
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function renderForm(settings: ShippingSettings = mockSettings) {
  return render(
    <QueryWrapper>
      <ShippingSettingsForm settings={settings} />
    </QueryWrapper>
  );
}

const saveButton = () => page.getByRole('button', { name: /save changes/i });

describe('ShippingSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should populate the form with the loaded settings', async () => {
    await renderForm();

    await expect.element(page.getByLabelText(/^name$/i)).toHaveValue('Inside Books Project');
    await expect.element(page.getByLabelText(/^street address$/i)).toHaveValue('PO Box 301029');
    await expect.element(page.getByLabelText(/street address 2/i)).toHaveValue('12 ST BOOKS');
    await expect.element(page.getByLabelText(/city/i)).toHaveValue('Austin');
    await expect.element(page.getByLabelText(/state/i)).toHaveValue('TX');
    await expect.element(page.getByLabelText(/zipcode/i)).toHaveValue('78703');
    await expect
      .element(page.getByLabelText(/unit recipient line/i))
      .toHaveValue('ATTN: MAILROOM STAFF');
  });

  it('should preview the return address block as it reads on a label', async () => {
    await renderForm();

    const preview = page.getByTestId('return-address-preview');
    await expect
      .element(preview)
      .toHaveTextContent('Inside Books ProjectPO Box 30102912 ST BOOKSAustin, TX 78703');
    const lines = (await preview.query())?.querySelectorAll('div');
    expect(Array.from(lines ?? []).map((line) => line.textContent)).toEqual([
      'Inside Books Project',
      'PO Box 301029',
      '12 ST BOOKS',
      'Austin, TX 78703',
    ]);
  });

  it('should omit street2 from the preview when it is blank', async () => {
    await renderForm({
      ...mockSettings,
      return_address: { ...mockSettings.return_address, street2: null },
    });

    await expect.element(page.getByLabelText(/street address 2/i)).toHaveValue('');
    const preview = await page.getByTestId('return-address-preview').query();
    expect(Array.from(preview?.querySelectorAll('div') ?? []).map((l) => l.textContent)).toEqual([
      'Inside Books Project',
      'PO Box 301029',
      'Austin, TX 78703',
    ]);
  });

  it('should keep the preview in sync with edits', async () => {
    await renderForm();

    await page.getByLabelText(/city/i).fill('Houston');

    await expect
      .element(page.getByTestId('return-address-preview'))
      .toHaveTextContent(/Houston, TX 78703/);
  });

  it('should have the save button disabled until the form is changed', async () => {
    await renderForm();

    await expect.element(saveButton()).toBeDisabled();

    await page.getByLabelText(/unit recipient line/i).fill('ATTN: MAILROOM');

    await expect.element(saveButton()).not.toBeDisabled();
  });

  it('should show an error for an invalid zipcode', async () => {
    await renderForm();

    await page.getByLabelText(/zipcode/i).fill('7870');
    await saveButton().click();

    await expect.element(page.getByText(/zipcode must be 5 digits/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should show an error for a 3-letter state', async () => {
    await renderForm();

    await page.getByLabelText(/state/i).fill('TEX');
    await saveButton().click();

    await expect.element(page.getByText(/state must be a 2-letter code/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should show errors for blank required fields', async () => {
    await renderForm();

    await page.getByLabelText(/^name$/i).fill('   ');
    await page.getByLabelText(/unit recipient line/i).fill('');
    await saveButton().click();

    await expect.element(page.getByText(/^name is required/i)).toBeInTheDocument();
    await expect.element(page.getByText(/unit recipient line is required/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should PUT the settings and show a success toast', async () => {
    const saved: ShippingSettings = {
      return_address: {
        name: 'Inside Books Project',
        street1: 'PO Box 301029',
        street2: null,
        city: 'Austin',
        state: 'TX',
        zipcode: '78703-1234',
      },
      unit_recipient_name: 'ATTN: MAILROOM',
    };
    mockFetch.mockResolvedValue(jsonResponse(saved));

    await renderForm();

    await page.getByLabelText(/street address 2/i).fill('  ');
    await page.getByLabelText(/state/i).fill('tx');
    await page.getByLabelText(/zipcode/i).fill('78703-1234');
    await page.getByLabelText(/unit recipient line/i).fill(' ATTN: MAILROOM ');
    await saveButton().click();

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Shipping settings saved'));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/shipping-settings');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual(saved);

    // Form resets to the saved values, so Save is disabled again.
    await expect.element(saveButton()).toBeDisabled();
  });

  it('should show server validation errors next to the matching field', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        {
          detail: [
            {
              type: 'value_error',
              loc: ['body', 'return_address', 'city'],
              msg: 'Value error, city is not deliverable',
              input: 'Nowhere',
            },
          ],
        },
        422
      )
    );

    await renderForm();

    await page.getByLabelText(/city/i).fill('Nowhere');
    await saveButton().click();

    await expect
      .element(page.getByText('Value error, city is not deliverable'))
      .toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      'Some fields were rejected by the server. Please review them.'
    );
  });

  it('should show an error toast when saving fails', async () => {
    mockFetch.mockResolvedValue(new Response('boom', { status: 500 }));

    await renderForm();

    await page.getByLabelText(/city/i).fill('Houston');
    await saveButton().click();

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to save shipping settings. Please try again.'
      )
    );
  });
});
