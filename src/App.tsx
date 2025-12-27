import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load page components for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const InmateDetailPage = lazy(() => import('./pages/InmateDetailPage').then(m => ({ default: m.InmateDetailPage })));
const UnitsPage = lazy(() => import('./pages/UnitsPage').then(m => ({ default: m.UnitsPage })));
const CreateUnitPage = lazy(() => import('./pages/CreateUnitPage').then(m => ({ default: m.CreateUnitPage })));
const UnitDetailPage = lazy(() => import('./pages/UnitDetailPage').then(m => ({ default: m.UnitDetailPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <HomePage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="search" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <SearchPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="inmates/:jurisdiction/:id" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <InmateDetailPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="units" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <UnitsPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="units/new" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <CreateUnitPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="units/:jurisdiction/:name" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <UnitDetailPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="*" element={
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        } />
      </Route>
    </Routes>
  );
}

export default App;
