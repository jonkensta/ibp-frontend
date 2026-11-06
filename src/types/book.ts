/** A book from the ISBN lookup (`GET /books/{isbn}`). */
export interface Book {
  /** ISBN-13, normalized by the backend. */
  isbn: string;
  title: string;
  /** Null when no provider knew the author. */
  author: string | null;
  source: string;
  confidence: string | null;
}
