// ISBN handling mirroring ibp-backend's books.normalize_isbn.

function isbn10CheckDigit(first9: string): string {
  const total = [...first9].reduce((sum, digit, i) => sum + (10 - i) * Number(digit), 0);
  const check = (11 - (total % 11)) % 11;
  return check === 10 ? 'X' : String(check);
}

function isbn13CheckDigit(first12: string): string {
  const total = [...first12].reduce(
    (sum, digit, i) => sum + (i % 2 === 0 ? 1 : 3) * Number(digit),
    0
  );
  return String((10 - (total % 10)) % 10);
}

// A leading label such as "ISBN", "ISBN-13:" or "isbn 10". The 10/13 only
// counts as part of the label when no digit follows it, so an ISBN-10 that
// starts with 10 or 13 ("ISBN 1305504917") keeps its digits.
const ISBN_LABEL = /^ISBN(?:[- ]?1[03](?!\d))?[ :]*/i;

/**
 * Strip what an ISBN may come with: invisible characters (the left-to-right
 * marks a copy from a web page brings along) are dropped, any dash reads as a
 * hyphen and any space as a space; then a leading label goes, then the
 * hyphens and spaces.
 */
function compact(raw: string): string {
  const text = raw
    .replace(/\p{Cf}/gu, '')
    .replace(/\p{Pd}/gu, '-')
    .replace(/[\s\p{Z}]/gu, ' ')
    .trim();
  return text.replace(ISBN_LABEL, '').replace(/[ -]/g, '').toUpperCase();
}

/**
 * The ISBN-13 for an ISBN-10, ISBN-13 or 18-digit EAN (ISBN-13 plus a price
 * add-on), or null. See `compact` for what is ignored; bad check digits are
 * rejected.
 */
export function normalizeIsbn(raw: string): string | null {
  let digits = compact(raw);
  if (digits.length === 18 && (digits.startsWith('978') || digits.startsWith('979'))) {
    digits = digits.slice(0, 13);
  }
  if (/^\d{9}[\dX]$/.test(digits)) {
    if (isbn10CheckDigit(digits.slice(0, 9)) !== digits[9]) return null;
    const first12 = '978' + digits.slice(0, 9);
    return first12 + isbn13CheckDigit(first12);
  }
  if (/^97[89]\d{10}$/.test(digits)) {
    return isbn13CheckDigit(digits.slice(0, 12)) === digits[12] ? digits : null;
  }
  return null;
}

/** True if `raw` has the shape of an ISBN or book barcode (check digit not checked). */
export function looksLikeIsbn(raw: string): boolean {
  const digits = compact(raw);
  return /^\d{9}[\dX]$/.test(digits) || /^97[89](\d{10}|\d{15})$/.test(digits);
}
