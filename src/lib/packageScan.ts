import { looksLikeIsbn } from './isbn';
import { parseLegacyRequestId } from './legacyRequest';

// What was scanned or typed into the packing station's package box. Request
// codes are opaque to the frontend (the backend parses them), so anything that
// isn't plainly something else is passed on as a code; an unknown one shows
// "Package not found". Plain numbers and ISBNs get a hint instead, since those
// are the usual mistakes: an inmate number, an old label, or a book.
export type PackageScan =
  | { kind: 'empty' }
  | { kind: 'code'; code: string }
  | { kind: 'hint'; message: string };

const SCAN_THE_LABEL = 'Scan the package label instead: it starts with TEX- or FED-.';

/** True if `text` has the shape of a package label code (`TEX-1234567-2`). */
export function looksLikePackageCode(text: string): boolean {
  return /^(TEX|FED)-\d+-\d+$/i.test(text.trim());
}

export function classifyPackageScan(text: string): PackageScan {
  const trimmed = text.trim();
  if (!trimmed) return { kind: 'empty' };
  if (looksLikeIsbn(trimmed)) {
    return {
      kind: 'hint',
      message: `That's a book's ISBN, not a package label. ${SCAN_THE_LABEL}`,
    };
  }
  if (parseLegacyRequestId(trimmed) !== null) {
    return {
      kind: 'hint',
      message: `That's an old label's request number. Packages with old labels aren't recorded here. ${SCAN_THE_LABEL}`,
    };
  }
  if (/^[\d\s-]+$/.test(trimmed)) {
    return {
      kind: 'hint',
      message: `That's a number (an inmate number?), not a package label. ${SCAN_THE_LABEL}`,
    };
  }
  return { kind: 'code', code: trimmed };
}
