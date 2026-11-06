import { describe, it, expect } from 'vitest';
import { looksLikeIsbn, normalizeIsbn } from './isbn';

const HOBBIT = '9780547928227';

describe('normalizeIsbn', () => {
  it.each([
    [HOBBIT, HOBBIT],
    ['978-0-547-92822-7', HOBBIT],
    ['0547928211', '9780547928210'],
    [HOBBIT + '51599', HOBBIT],
    // Copied from a web page: left-to-right marks, no-break spaces, Unicode
    // dashes, an "ISBN-13 :" label.
    ['‎978-0547928227', HOBBIT],
    ['  978‑0547928227‏', HOBBIT],
    ['978–0—547928227', HOBBIT],
    ['ISBN-13 : 978-0547928227', HOBBIT],
    ['isbn 0547928211', '9780547928210'],
    ['﻿9780547928227​', HOBBIT],
  ])('normalizes %j', (raw, expected) => {
    expect(normalizeIsbn(raw)).toBe(expected);
  });

  it.each(['9780547928228', '1234', 'TEX-1234-0', 'ISBN'])('rejects %j', (raw) => {
    expect(normalizeIsbn(raw)).toBeNull();
  });
});

describe('looksLikeIsbn', () => {
  it('sees through a pasted ISBN', () => {
    expect(looksLikeIsbn('‎978-1503280786')).toBe(true);
    expect(looksLikeIsbn('TEX-1234-0')).toBe(false);
  });
});
