import { useQuery } from '@tanstack/react-query';
import { searchInmates, getInmate } from '@/lib/api';
import type { Jurisdiction } from '@/types';

export function useSearchInmates(query: string) {
  return useQuery({
    queryKey: ['inmates', 'search', query],
    queryFn: () => searchInmates(query),
    enabled: query.length > 0,
  });
}

export function useInmate(jurisdiction: Jurisdiction, id: number) {
  return useQuery({
    queryKey: ['inmates', jurisdiction, id],
    queryFn: () => getInmate(jurisdiction, id),
  });
}
