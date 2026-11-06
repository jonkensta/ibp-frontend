import { QueryClient } from '@tanstack/react-query';

/** A QueryClient with the app's settings (tests use it to match production). */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
