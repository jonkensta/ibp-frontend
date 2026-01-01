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
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
            body { display: flex; justify-content: center; align-items: center; }
            canvas { max-width: 100%; max-height: 100%; }
            @media print {
              @page {
                size: 85mm 32mm;
                margin: 0;
              }
              * { margin: 0; padding: 0; }
              html, body {
                width: 85mm;
                height: 32mm;
                display: block;
                overflow: hidden;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
              }
              canvas {
                display: block;
                width: 85mm !important;
                height: 32mm !important;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <canvas id="label"></canvas>
          <script>
            const img = new Image();
            img.onload = function() {
              const canvas = document.getElementById('label');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);

              // Close window after print dialog closes
              window.addEventListener('afterprint', () => {
                setTimeout(() => window.close(), 100);
              });

              // Trigger print
              window.print();
            };
            img.src = '${base64}';
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
