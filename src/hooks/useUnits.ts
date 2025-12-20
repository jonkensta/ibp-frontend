import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUnits, getUnit, updateUnit } from '@/lib/api';
import type { Jurisdiction, UnitUpdate } from '@/types';

export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: getAllUnits,
  });
}

export function useUnit(jurisdiction: Jurisdiction, name: string) {
  return useQuery({
    queryKey: ['units', jurisdiction, name],
    queryFn: () => getUnit(jurisdiction, name),
  });
}

export function useUpdateUnit(jurisdiction: Jurisdiction, name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UnitUpdate) => updateUnit(jurisdiction, name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['units', jurisdiction, name] });
    },
  });
}
