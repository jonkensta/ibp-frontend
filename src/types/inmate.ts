import type { Jurisdiction } from './common';
import type { Unit } from './unit';
import type { Request } from './request';
import type { Comment } from './comment';

export interface Lookup {
  datetime_created: string;
}

export interface InmateBase {
  jurisdiction: Jurisdiction;
  id: number;
  first_name: string | null;
  last_name: string | null;
  race: string | null;
  sex: string | null;
  release: string | null;
  url: string | null;
}

export interface Inmate extends InmateBase {
  datetime_fetched: string | null;
  unit: Unit | null;
  requests: Request[];
  comments: Comment[];
  lookups: Lookup[];
}

export interface InmateSearchResult extends InmateBase {
  /** Set when this result came from the legacy request ID searched for
   *  (an old package label), not from the inmate ID search. */
  via_request?: number;
}

export interface InmateSearchResults {
  inmates: InmateSearchResult[];
  errors: string[];
}
