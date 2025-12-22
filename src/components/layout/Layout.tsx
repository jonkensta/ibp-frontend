import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { GlobalSearchProvider } from '@/contexts/GlobalSearchContext';

export function Layout() {
  return (
    <GlobalSearchProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    </GlobalSearchProvider>
  );
}
