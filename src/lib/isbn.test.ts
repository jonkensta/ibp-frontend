import { describe, it, expect } from 'vitest';
import { looksLikeIsbn, normalizeIsbn } from './isbn';

const HOBBIT = '9780547928227';

// Written as escapes so the invisible characters stay visible here.
const LRM = String.fromCharCode(0x200e);
const RLM = String.fromCharCode(0x200f);
const NBSP = String.fromCharCode(0xa0);
const NB_HYPHEN = String.fromCharCode(0x2011);
const EN_DASH = String.fromCharCode(0x2013);
const EM_DASH = String.fromCharCode(0x2014);
const BOM = String.fromCharCode(0xfeff);
const ZWSP = String.fromCharCode(0x200b);

describe('normalizeIsbn', () => {
  it.each([
    [HOBBIT, HOBBIT],
    ['978-0-547-92822-7', HOBBIT],
    ['0547928211', '9780547928210'],
    [HOBBIT + '51599', HOBBIT],
    // Copied from a web page: left-to-right marks, no-break spaces, Unicode
    // dashes, an "ISBN-13 :" label.
    [`${LRM}978-0547928227`, HOBBIT],
    [`${NBSP}${NBSP}978${NB_HYPHEN}0547928227${RLM}`, HOBBIT],
    [`978${EN_DASH}0${EM_DASH}547928227`, HOBBIT],
    ['ISBN-13 : 978-0547928227', HOBBIT],
    ['isbn 0547928211', '9780547928210'],
    [`${BOM}9780547928227${ZWSP}`, HOBBIT],
    // An ISBN-10 starting with 13 or 10 isn't read as an "ISBN-13" label.
    ['1305504917', '9781305504912'],
    ['ISBN 1305504917', '9781305504912'],
    ['ISBN: 1305504917', '9781305504912'],
    ['ISBN-10 1305504917', '9781305504912'],
    ['ISBN13 9780547928227', HOBBIT],
    ['ISBN 1005504911', '9781005504915'],
  ])('normalizes %j', (raw, expected) => {
    expect(normalizeIsbn(raw)).toBe(expected);
  });

  it.each(['9780547928228', '1234', 'TEX-1234-0', 'ISBN'])('rejects %j', (raw) => {
    expect(normalizeIsbn(raw)).toBeNull();
  });
});

describe('looksLikeIsbn', () => {
  it('sees through a pasted ISBN', () => {
    expect(looksLikeIsbn(`${LRM}978-1503280786`)).toBe(true);
    expect(looksLikeIsbn('TEX-1234-0')).toBe(false);
  });
});
