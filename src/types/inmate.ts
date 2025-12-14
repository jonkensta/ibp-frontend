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
  unit: Unit;
  requests: Request[];
  comments: Comment[];
  lookups: Lookup[];
}

export type InmateSearchResult = InmateBase;

export interface InmateSearchResults {
  inmates: InmateSearchResult[];
  errors: string[];
}
