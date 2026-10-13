import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShippingSettings, updateShippingSettings } from '@/lib/api';
import type { ShippingSettings } from '@/types';

export function useShippingSettings() {
  return useQuery({
    queryKey: ['shipping-settings'],
    queryFn: getShippingSettings,
  });
}

export function useUpdateShippingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ShippingSettings) => updateShippingSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-settings'] });
    },
  });
}
