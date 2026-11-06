import type { Book } from '@/types';
import { apiGet } from './client';

/** Look up a book by ISBN. 422 "Not a valid ISBN.", 404 "Book not found." */
export async function getBook(isbn: string): Promise<Book> {
  return apiGet<Book>(`/books/${encodeURIComponent(isbn)}`);
}
