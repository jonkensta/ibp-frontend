import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getShippingSettings, updateShippingSettings } from './shippingSettings';
import { ApiError, getValidationErrors } from './client';
import type { ShippingSettings } from '@/types';

const mockFetch = vi.fn();
window.fetch = mockFetch;

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

describe('Shipping settings API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getShippingSettings', () => {
    it('should fetch shipping settings', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockSettings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await getShippingSettings();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/shipping-settings',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockSettings);
    });
  });

  describe('updateShippingSettings', () => {
    it('should PUT the settings and return the saved object', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockSettings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await updateShippingSettings(mockSettings);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/shipping-settings',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockSettings),
        })
      );
      expect(result).toEqual(mockSettings);
    });

    it('should expose field errors from a 422 response', async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: [
              {
                type: 'string_pattern_mismatch',
                loc: ['body', 'return_address', 'zipcode'],
                msg: "String should match pattern '^\\d{5}(-\\d{4})?$'",
                input: 'abc',
              },
            ],
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const error = await updateShippingSettings(mockSettings).catch((e) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(getValidationErrors(error)).toEqual([
        {
          field: 'return_address.zipcode',
          message: "String should match pattern '^\\d{5}(-\\d{4})?$'",
        },
      ]);
    });
  });
});

describe('getValidationErrors', () => {
  it('should return no errors for non-422 errors', () => {
    expect(getValidationErrors(new ApiError(500, 'boom'))).toEqual([]);
    expect(getValidationErrors(new Error('boom'))).toEqual([]);
  });

  it('should return no errors when the 422 detail is a plain string', () => {
    expect(getValidationErrors(new ApiError(422, 'Unprocessable'))).toEqual([]);
  });
});
