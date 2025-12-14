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
