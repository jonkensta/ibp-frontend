import { describe, it, expect } from 'vitest';
import { LEGACY_MAX_REQUEST_ID, LEGACY_RECENT_MIN, parseLegacyRequestId } from './legacyRequest';

describe('parseLegacyRequestId', () => {
  it('accepts a bare number in the recent legacy range', () => {
    expect(parseLegacyRequestId(String(LEGACY_RECENT_MIN))).toBe(LEGACY_RECENT_MIN);
    expect(parseLegacyRequestId('268213')).toBe(268213);
    expect(parseLegacyRequestId(` ${LEGACY_MAX_REQUEST_ID} `)).toBe(LEGACY_MAX_REQUEST_ID);
  });

  it('rejects numbers outside the recent legacy range', () => {
    expect(parseLegacyRequestId(String(LEGACY_RECENT_MIN - 1))).toBeNull();
    expect(parseLegacyRequestId(String(LEGACY_MAX_REQUEST_ID + 1))).toBeNull();
    expect(parseLegacyRequestId('2584921')).toBeNull();
  });

  it('treats a number with leading zeros as an inmate ID', () => {
    expect(parseLegacyRequestId('00268213')).toBeNull();
    expect(parseLegacyRequestId('0268213')).toBeNull();
  });

  it('rejects names and formatted IDs', () => {
    expect(parseLegacyRequestId('John Doe')).toBeNull();
    expect(parseLegacyRequestId('268-213')).toBeNull();
    expect(parseLegacyRequestId('')).toBeNull();
  });
});
