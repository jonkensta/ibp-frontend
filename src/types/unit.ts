import type { Jurisdiction, ShippingMethod } from './common';

export interface Unit {
  name: string;
  street1: string;
  street2: string | null;
  city: string;
  zipcode: string;
  state: string;
  url: string | null;
  jurisdiction: Jurisdiction;
  shipping_method: ShippingMethod | null;
}

export type UnitCreate = Unit;

export interface UnitUpdate {
  name?: string;
  street1?: string;
  street2?: string | null;
  city?: string;
  zipcode?: string;
  state?: string;
  url?: string | null;
  jurisdiction?: Jurisdiction;
  shipping_method?: ShippingMethod | null;
}
