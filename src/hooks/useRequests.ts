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

export async function printRequestLabel(
  jurisdiction: Jurisdiction,
  inmateId: number,
  requestIndex: number
) {
  const blob = await getRequestLabel(jurisdiction, inmateId, requestIndex);
  const url = window.URL.createObjectURL(blob);

  const printWindow = window.open('', '_blank', 'width=1024,height=768,scrollbars=yes');

  if (!printWindow) {
    // Cleanup URL if popup was blocked
    window.URL.revokeObjectURL(url);
    throw new Error('Failed to open print window. Please allow popups for this site.');
  }

  try {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <img
            src="${url}"
            onload="
              // Clean up URL after print dialog closes
              window.addEventListener('afterprint', () => {
                window.URL.revokeObjectURL('${url}');
                setTimeout(() => window.close(), 100);
              });
              // Fallback cleanup if afterprint doesn't fire
              setTimeout(() => {
                window.URL.revokeObjectURL('${url}');
              }, 60000);
              
              // Trigger print
              window.print();
            "
          />
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch {
    // Cleanup resources on error
    window.URL.revokeObjectURL(url);
    printWindow.close();
    throw new Error('Failed to prepare print window');
  }
}
