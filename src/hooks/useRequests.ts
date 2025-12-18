import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRequest,
  deleteRequest,
  getRequestLabel,
  getInmateWarnings,
  validateRequest,
} from '@/lib/api';
import type { Jurisdiction, RequestCreate } from '@/types';

export function useInmateWarnings(jurisdiction: Jurisdiction, inmateId: number) {
  return useQuery({
    queryKey: ['inmates', jurisdiction, inmateId, 'warnings'],
    queryFn: () => getInmateWarnings(jurisdiction, inmateId),
  });
}

export function useCreateRequest(jurisdiction: Jurisdiction, inmateId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RequestCreate) => createRequest(jurisdiction, inmateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inmates', jurisdiction, inmateId] });
    },
  });
}

export function useDeleteRequest(jurisdiction: Jurisdiction, inmateId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestIndex: number) => deleteRequest(jurisdiction, inmateId, requestIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inmates', jurisdiction, inmateId] });
    },
  });
}

export function useValidateRequest(jurisdiction: Jurisdiction, inmateId: number) {
  return useMutation({
    mutationFn: (data: RequestCreate) => validateRequest(jurisdiction, inmateId, data),
  });
}

export async function downloadRequestLabel(
  jurisdiction: Jurisdiction,
  inmateId: number,
  requestIndex: number
) {
  const blob = await getRequestLabel(jurisdiction, inmateId, requestIndex);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `label-${jurisdiction}-${inmateId}-${requestIndex}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
