import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { QueryWrapper } from '@/test/utils';
import { UnitForm } from './UnitForm';
import type { Unit } from '@/types';

const mockFetch = vi.fn();
window.fetch = mockFetch;

// Mock UI Select components to avoid Radix/React conflicts
vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
  }) => (
    <div data-select-value={value}>
      <button onClick={() => onValueChange && onValueChange('TX')}>Change</button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

const mockUnit: Unit = {
  jurisdiction: 'Texas',
  name: 'Test Unit',
  street1: '123 Main St',
  street2: null,
  city: 'Austin',
  state: 'TX',
  zipcode: '78701',
  url: null,
  shipping_method: 'Box',
};

describe('UnitForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should render form with all fields', async () => {
    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    const title = page.getByText(/edit unit/i);
    await expect.element(title).toBeInTheDocument();

    const nameInput = page.getByLabelText(/^name$/i);
    await expect.element(nameInput).toBeInTheDocument();

    const street1Input = page.getByLabelText(/street address$/i);
    await expect.element(street1Input).toBeInTheDocument();

    const cityInput = page.getByLabelText(/city/i);
    await expect.element(cityInput).toBeInTheDocument();

    const zipcodeInput = page.getByLabelText(/zipcode/i);
    await expect.element(zipcodeInput).toBeInTheDocument();
  });

  it('should populate form with unit data', async () => {
    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    const nameInput = page.getByLabelText(/^name$/i);
    await expect.element(nameInput).toHaveValue('Test Unit');

    const street1Input = page.getByLabelText(/street address$/i);
    await expect.element(street1Input).toHaveValue('123 Main St');

    const cityInput = page.getByLabelText(/city/i);
    await expect.element(cityInput).toHaveValue('Austin');

    const zipcodeInput = page.getByLabelText(/zipcode/i);
    await expect.element(zipcodeInput).toHaveValue('78701');
  });

  it('should have save button disabled initially (form not dirty)', async () => {
    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    const saveButton = page.getByRole('button', { name: /save changes/i });
    await expect.element(saveButton).toBeDisabled();
  });

  it('should enable save button when form is modified', async () => {
    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    const cityInput = page.getByLabelText(/city/i);
    await cityInput.fill('Houston');

    const saveButton = page.getByRole('button', { name: /save changes/i });
    await expect.element(saveButton).not.toBeDisabled();
  });

  it('should show validation error for empty required fields', async () => {
    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    // Clear a required field
    const street1Input = page.getByLabelText(/street address$/i);
    await street1Input.fill('');

    // Try to submit
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();

    // Should show validation error
    const error = page.getByText(/street address is required/i);
    await expect.element(error).toBeInTheDocument();
  });

  it('should accept valid URL or empty value', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnit), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    // Enter valid URL
    const urlInput = page.getByLabelText(/url/i);
    await urlInput.fill('https://example.com');

    // Submit should work
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify API was called successfully (no validation error blocked it)
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should submit form with updated data', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          ...mockUnit,
          city: 'Houston',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    // Modify city
    const cityInput = page.getByLabelText(/city/i);
    await cityInput.fill('Houston');

    // Submit form
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();

    // Wait for submission
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify API was called
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/units/Texas/Test%20Unit'),
      expect.objectContaining({
        method: 'PUT',
      })
    );
  });

  it('should show success message after successful update', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnit), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    // Modify field
    const cityInput = page.getByLabelText(/city/i);
    await cityInput.fill('Dallas');

    // Submit
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();

    // Should show success message
    const successMessage = page.getByText(/unit updated successfully/i);
    await expect.element(successMessage).toBeInTheDocument();
  });

  it('should show error message when update fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    // Modify field
    const cityInput = page.getByLabelText(/city/i);
    await cityInput.fill('Dallas');

    // Submit
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();

    // Should show error message
    const errorMessage = page.getByText(/failed to update unit/i);
    await expect.element(errorMessage).toBeInTheDocument();
  });

  it('should show "Saving..." text while submitting', async () => {
    // Make the request slow
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(
              new Response(JSON.stringify(mockUnit), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              })
            );
          }, 1000);
        })
    );

    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    // Modify field
    const cityInput = page.getByLabelText(/city/i);
    await cityInput.fill('Dallas');

    // Submit
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();

    // Should show "Saving..." immediately
    await new Promise((resolve) => setTimeout(resolve, 50));
    const savingButton = page.getByRole('button', { name: /saving/i });
    await expect.element(savingButton).toBeInTheDocument();
    await expect.element(savingButton).toBeDisabled();
  });

  it('should convert empty optional fields to null', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnit), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const unitWithOptionalFields: Unit = {
      ...mockUnit,
      street2: 'Suite 100',
      url: 'https://example.com',
    };

    render(
      <QueryWrapper>
        <UnitForm unit={unitWithOptionalFields} />
      </QueryWrapper>
    );

    // Clear optional fields
    const street2Input = page.getByLabelText(/street address 2/i);
    await street2Input.fill('');

    const urlInput = page.getByLabelText(/url/i);
    await urlInput.fill('');

    // Submit
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the request body has null for empty fields
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.street2).toBeNull();
    expect(body.url).toBeNull();
  });

  it('should handle unit with null optional fields', async () => {
    const unitWithNulls: Unit = {
      ...mockUnit,
      street2: null,
      url: null,
      shipping_method: null,
    };

    render(
      <QueryWrapper>
        <UnitForm unit={unitWithNulls} />
      </QueryWrapper>
    );

    const street2Input = page.getByLabelText(/street address 2/i);
    await expect.element(street2Input).toHaveValue('');

    const urlInput = page.getByLabelText(/url/i);
    await expect.element(urlInput).toHaveValue('');
  });

  it('should validate zipcode length', async () => {
    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    // Enter zipcode that's too short
    const zipcodeInput = page.getByLabelText(/zipcode/i);
    await zipcodeInput.fill('123');

    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();

    const error = page.getByText(/zipcode must be at least 5 characters/i);
    await expect.element(error).toBeInTheDocument();
  });

  it('should accept valid zipcode formats', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockUnit), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    // Enter extended zipcode
    const zipcodeInput = page.getByLabelText(/zipcode/i);
    await zipcodeInput.fill('78701-1234');

    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not show validation error
    const error = page.getByText(/zipcode must be/i);
    const errorElement = await error.query();
    expect(errorElement).toBeNull();
  });

  it('should have name field disabled to prevent breaking inmate associations', async () => {
    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    const nameInput = page.getByLabelText(/^name$/i);
    await expect.element(nameInput).toBeDisabled();
    await expect.element(nameInput).toHaveValue('Test Unit');

    // Should show helper text explaining why it's disabled
    const helperText = page.getByText(
      /unit name cannot be changed to prevent breaking inmate associations/i
    );
    await expect.element(helperText).toBeInTheDocument();
  });

  it('should have jurisdiction field disabled to prevent breaking inmate associations', async () => {
    render(
      <QueryWrapper>
        <UnitForm unit={mockUnit} />
      </QueryWrapper>
    );

    const jurisdictionInput = page.getByLabelText(/jurisdiction/i);
    await expect.element(jurisdictionInput).toBeDisabled();
    await expect.element(jurisdictionInput).toHaveValue('Texas');

    // Should show helper text explaining why it's disabled
    const helperText = page.getByText(
      /jurisdiction cannot be changed to prevent breaking inmate associations/i
    );
    await expect.element(helperText).toBeInTheDocument();
  });
});
