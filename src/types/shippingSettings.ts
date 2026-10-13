export interface ReturnAddress {
  name: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zipcode: string;
}

export interface ShippingSettings {
  return_address: ReturnAddress;
  unit_recipient_name: string;
}
