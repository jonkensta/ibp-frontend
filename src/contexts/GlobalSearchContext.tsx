/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useRef, type RefObject } from 'react';
import type { GlobalSearchRef } from '@/components/layout/GlobalSearch';

interface GlobalSearchContextType {
  globalSearchRef: RefObject<GlobalSearchRef | null>;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null);

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const globalSearchRef = useRef<GlobalSearchRef>(null);

  return (
    <GlobalSearchContext.Provider value={{ globalSearchRef }}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  }
  return context;
}
