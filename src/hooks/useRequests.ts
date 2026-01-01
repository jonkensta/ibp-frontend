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

  // Convert blob to base64 data URL (may work better with Firefox printing)
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  const printWindow = window.open('', '_blank', 'width=1024,height=768,scrollbars=yes');

  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups for this site.');
  }

  try {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label</title>
          <style>
            @page {
              size: 85mm 32mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            img {
              width: 85mm;
              height: 32mm;
              display: block;
              /* Ensure the image fills the printable area */
              position: absolute;
              top: 0;
              left: 0;
            }
          </style>
        </head>
        <body>
          <img id="label-img" src="${base64}" />
          <script>
            // Wait for window to be fully loaded, not just the image
            window.addEventListener('load', () => {
              // Set up handlers before printing
              let printCompleted = false;

              window.addEventListener('beforeprint', () => {
                console.log('Print dialog opening');
              });

              window.addEventListener('afterprint', () => {
                console.log('Print dialog closed');
                printCompleted = true;
                // Keep window open longer to ensure print job completes
                setTimeout(() => window.close(), 1000);
              });

              // Trigger print
              window.print();

              // Fallback: if afterprint doesn't fire, close after timeout
              setTimeout(() => {
                if (!printCompleted) {
                  console.log('Print timeout - closing window');
                  window.close();
                }
              }, 30000); // 30 second timeout
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch {
    printWindow.close();
    throw new Error('Failed to prepare print window');
  }
}
