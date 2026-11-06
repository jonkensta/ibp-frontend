import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRequest,
  deleteRequest,
  getRequestLabel,
  getRequestLabelPdfUrl,
  getInmateWarnings,
  validateRequest,
} from '@/lib/api';
import { printLabelViaPrintServer } from '@/lib/printServer';
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
    mutationFn: (code: string) => deleteRequest(code),
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

export type PrintLabelResult =
  | { method: 'print-server' }
  | { method: 'browser'; printServerError: string; pdfUrl: string };

/**
 * Print a request label, given its code (e.g. `TEX-1234567-2`).
 *
 * First tries the print server for silent one-click printing. If it is
 * unreachable or errors, returns the URL of the label as a PDF for the caller
 * to offer as a link. The PDF page is exactly the label size, so the browser's
 * PDF viewer prints it without the scaling and margin problems of printing an
 * HTML page (notably in Firefox).
 *
 * The PDF is deliberately not opened here: by the time the print server has
 * failed, the click's user activation may have expired and `window.open`
 * would be blocked as a popup. A link the volunteer clicks never is.
 */
export async function printRequestLabel(code: string): Promise<PrintLabelResult> {
  const blob = await getRequestLabel(code);

  try {
    await printLabelViaPrintServer(blob);
    return { method: 'print-server' };
  } catch (error) {
    console.warn('Print server unavailable, falling back to the label PDF:', error);
    return {
      method: 'browser',
      printServerError: error instanceof Error ? error.message : String(error),
      pdfUrl: getRequestLabelPdfUrl(code),
    };
  }
}
