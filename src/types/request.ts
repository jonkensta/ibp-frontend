import type { Action } from './common';

export interface Request {
  index: number;
  date_processed: string;
  date_postmarked: string;
  action: Action;
}

export interface RequestCreate {
  date_processed: string;
  date_postmarked: string;
  action: Action;
}

export interface RequestUpdate {
  date_processed?: string;
  date_postmarked?: string;
  action?: Action;
}

export interface InmateWarnings {
  entry_age?: string;
  release?: string;
}

export interface RequestValidationWarnings {
  entry_age?: string;
  release?: string;
  postmarkdate?: string;
}
