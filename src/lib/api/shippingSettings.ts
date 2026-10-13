import type { ShippingSettings } from '@/types';
import { apiGet, apiPut } from './client';

export async function getShippingSettings(): Promise<ShippingSettings> {
  return apiGet<ShippingSettings>('/shipping-settings');
}

export async function updateShippingSettings(data: ShippingSettings): Promise<ShippingSettings> {
  return apiPut<ShippingSettings>('/shipping-settings', data);
}
