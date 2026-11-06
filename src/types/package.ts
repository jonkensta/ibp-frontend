import type { InmateBase } from './inmate';
import type { InmateWarnings, Request } from './request';
import type { Unit } from './unit';

/** Where a package item's title and author came from. */
export type ItemSource = 'isbn' | 'manual';

/** A book recorded in a package. */
export interface PackageItem {
  id: number;
  /** ISBN-13, or null for a book recorded without one. */
  isbn: string | null;
  title: string;
  author: string;
  source: ItemSource;
  /** Incremented by every edit; edits send the revision they were based on. */
  revision: number;
  /** Set once the book is registered on the TDCJ Book Portal (read-only then). */
  registered_at: string | null;
  created_at: string;
  updated_at: string;
}

/** The response to adding an item. */
export interface PackageItemCreated extends PackageItem {
  /** Codes of the inmate's other requests that already contain this ISBN. */
  previously_sent: string[];
}

export interface PackageItemCreate {
  isbn?: string | null;
  title: string;
  author: string;
  /** `isbn` (from an ISBN lookup, needs `isbn`) or `manual` (typed in). */
  source: ItemSource;
}

export interface PackageItemUpdate {
  isbn: string | null;
  title: string;
  author: string;
  revision: number;
  /** Also save the title and author to the ISBN lookup cache. */
  update_cache: boolean;
}

export interface PackageRequest extends Request {
  /** Incremented by every add, edit or delete of an item. */
  contents_revision: number;
}

export interface PackageInmate extends InmateBase {
  unit: Unit | null;
}

/** A filled request with its inmate, books and the inmate's warnings. */
export interface Package {
  request: PackageRequest;
  inmate: PackageInmate;
  items: PackageItem[];
  warnings: InmateWarnings;
}
