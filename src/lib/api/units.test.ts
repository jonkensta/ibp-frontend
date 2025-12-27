import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllUnits, getUnit, updateUnit } from './units';
import type { UnitUpdate } from '@/types';

const mockFetch = vi.fn();
window.fetch = mockFetch;

describe('Units API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getAllUnits', () => {
    it('should fetch all units', async () => {
      const mockUnits = [
        {
          jurisdiction: 'Texas',
          name: 'Unit A',
          street1: '123 Main St',
          street2: null,
          city: 'Austin',
          state: 'TX',
          zipcode: '78701',
          url: null,
          shipping_method: 'Box',
        },
        {
          jurisdiction: 'Federal',
          name: 'Unit B',
          street1: '456 Oak Ave',
          street2: null,
          city: 'Dallas',
          state: 'TX',
          zipcode: '75201',
          url: null,
          shipping_method: 'Box',
        },
      ];

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockUnits), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await getAllUnits();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/units'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockUnits);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no units exist', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await getAllUnits();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('getUnit', () => {
    it('should fetch single unit by jurisdiction and name', async () => {
      const mockUnit = {
        jurisdiction: 'Texas',
        name: 'Test Unit',
        street1: '123 Main St',
        street2: 'Suite 100',
        city: 'Austin',
        state: 'TX',
        zipcode: '78701',
        url: 'https://example.com',
        shipping_method: 'Box',
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockUnit), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await getUnit('Texas', 'Test Unit');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/units/Texas/Test%20Unit'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockUnit);
    });

    it('should handle jurisdiction and name with spaces', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await getUnit('Texas', 'Maximum Security Unit');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Texas/Maximum%20Security%20Unit'),
        expect.anything()
      );
    });

    it('should throw error for not found unit', async () => {
      mockFetch.mockResolvedValue(
        new Response('Not Found', {
          status: 404,
          statusText: 'Not Found',
        })
      );

      await expect(getUnit('Texas', 'Nonexistent Unit')).rejects.toThrow();
    });
  });

  describe('updateUnit', () => {
    it('should update unit with correct URL and data', async () => {
      const mockUpdatedUnit = {
        jurisdiction: 'Texas',
        name: 'Test Unit',
        street1: '456 New St',
        street2: null,
        city: 'Houston',
        state: 'TX',
        zipcode: '77001',
        url: null,
        shipping_method: 'Box',
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockUpdatedUnit), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const updateData: UnitUpdate = {
        street1: '456 New St',
        street2: null,
        city: 'Houston',
        state: 'TX',
        zipcode: '77001',
        url: null,
        shipping_method: 'Box',
      };

      const result = await updateUnit('Texas', 'Test Unit', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/units/Texas/Test%20Unit'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(mockUpdatedUnit);
    });

    it('should handle special characters in jurisdiction and name', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const updateData: UnitUpdate = {
        street1: '123 Main',
        street2: null,
        city: 'City',
        state: 'TX',
        zipcode: '12345',
        url: null,
        shipping_method: 'Box',
      };

      await updateUnit('Texas', "O'Brien Unit", updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("Texas/O'Brien%20Unit"),
        expect.anything()
      );
    });

    it('should throw error for failed update', async () => {
      mockFetch.mockResolvedValue(
        new Response('Bad Request', {
          status: 400,
          statusText: 'Bad Request',
        })
      );

      const updateData: UnitUpdate = {
        street1: '',
        street2: null,
        city: '',
        state: 'TX',
        zipcode: '',
        url: null,
        shipping_method: 'Box',
      };

      await expect(updateUnit('Texas', 'Test Unit', updateData)).rejects.toThrow();
    });
  });
});
