import { describe, it, expect } from 'vitest';
import { cleanPortalText, isPortalLength } from './portalText';
import { looksLikeIsbn, normalizeIsbn } from './isbn';
import { classifyPackageScan, looksLikePackageCode } from './packageScan';

describe('portal text', () => {
  it('cleans like the backend', () => {
    expect(cleanPortalText('  The\tOdyssey \n')).toBe('The Odyssey');
    expect(cleanPortalText('Ho​mer')).toBe('Homer');
    expect(cleanPortalText('a\u0007b')).toBe('ab');
  });

  it('checks 3 to 100 UTF-16 units after cleaning', () => {
    expect(isPortalLength('Al')).toBe(false);
    expect(isPortalLength('  Al  ')).toBe(false);
    expect(isPortalLength('Ali')).toBe(true);
    expect(isPortalLength('x'.repeat(100))).toBe(true);
    expect(isPortalLength('x'.repeat(101))).toBe(false);
    // An emoji is two UTF-16 units, as the portal counts it.
    expect(isPortalLength('x'.repeat(98) + '\u{1F600}')).toBe(true);
    expect(isPortalLength('x'.repeat(99) + '\u{1F600}')).toBe(false);
    expect(isPortalLength(null)).toBe(false);
  });
});

describe('isbn', () => {
  it('normalizes ISBN-10, ISBN-13 and EAN add-ons like the backend', () => {
    expect(normalizeIsbn('0-14-044913-2')).toBe('9780140449136');
    expect(normalizeIsbn('9780140449136')).toBe('9780140449136');
    expect(normalizeIsbn('978014044913690000')).toBe('9780140449136');
    expect(normalizeIsbn('080442957X')).toBe('9780804429573');
    expect(normalizeIsbn('9780140449137')).toBeNull();
    expect(normalizeIsbn('12345')).toBeNull();
  });

  it('recognizes the shape of an ISBN without checking it', () => {
    expect(looksLikeIsbn('9780140449137')).toBe(true);
    expect(looksLikeIsbn('0-14-044913-2')).toBe(true);
    expect(looksLikeIsbn('12345678')).toBe(false);
  });
});

describe('classifyPackageScan', () => {
  it('passes a package code on as typed', () => {
    expect(classifyPackageScan(' tex-1234567-2 ')).toEqual({ kind: 'code', code: 'tex-1234567-2' });
    expect(classifyPackageScan('FED-12345678-0')).toEqual({ kind: 'code', code: 'FED-12345678-0' });
    expect(looksLikePackageCode('TEX-01234567-2')).toBe(true);
    expect(looksLikePackageCode('9780140449136')).toBe(false);
  });

  it('ignores an empty scan', () => {
    expect(classifyPackageScan('   ')).toEqual({ kind: 'empty' });
  });

  it('hints on an ISBN, a legacy request number or an inmate number', () => {
    const isbn = classifyPackageScan('9780140449136');
    expect(isbn.kind === 'hint' && isbn.message).toMatch(/ISBN/);
    const legacy = classifyPackageScan('268213');
    expect(legacy.kind === 'hint' && legacy.message).toMatch(/old label/);
    const inmate = classifyPackageScan('01234567');
    expect(inmate.kind === 'hint' && inmate.message).toMatch(/inmate number/);
    const fbop = classifyPackageScan('12345-678');
    expect(fbop.kind).toBe('hint');
  });
});
