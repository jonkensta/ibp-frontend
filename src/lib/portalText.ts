// Titles and authors must pass the TDCJ Book Portal's own checks: 3 to 100
// characters after trimming, counted as JavaScript counts them (UTF-16 code
// units, so an emoji counts as two). Mirrors ibp-backend's PortalText, which
// cleans the text the same way before checking it.
export const PORTAL_MIN_LENGTH = 3;
export const PORTAL_MAX_LENGTH = 100;
export const PORTAL_LENGTH_MESSAGE = `Must be ${PORTAL_MIN_LENGTH} to ${PORTAL_MAX_LENGTH} characters.`;

// Exactly the characters Python's str.isspace() accepts (the backend's test),
// spelled out because JS's \s differs: it lacks U+001C to U+001F and U+0085,
// and includes U+FEFF, which Python treats as a format character to drop.
const PYTHON_WHITESPACE =
  // eslint-disable-next-line no-control-regex -- matching them is the point
  /[\t\n\v\f\r\x1C-\x1F \x85\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g;

/**
 * Drop control and format characters and collapse whitespace, as the backend
 * does. Whitespace controls (tabs, newlines) become spaces first.
 */
export function cleanPortalText(value: string): string {
  return value
    .replace(PYTHON_WHITESPACE, ' ')
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .split(' ')
    .filter(Boolean)
    .join(' ');
}

/** True if the portal would take `value` (after cleaning) as a title or author. */
export function isPortalLength(value: string | null | undefined): boolean {
  if (value == null) return false;
  const length = cleanPortalText(value).length;
  return length >= PORTAL_MIN_LENGTH && length <= PORTAL_MAX_LENGTH;
}
