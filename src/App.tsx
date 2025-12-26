import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  HomePage,
  SearchPage,
  InmateDetailPage,
  UnitsPage,
  UnitDetailPage,
  NotFoundPage,
} from './pages';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
        <Route path="search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
        <Route path="inmates/:jurisdiction/:id" element={<ErrorBoundary><InmateDetailPage /></ErrorBoundary>} />
        <Route path="units" element={<ErrorBoundary><UnitsPage /></ErrorBoundary>} />
        <Route path="units/:jurisdiction/:name" element={<ErrorBoundary><UnitDetailPage /></ErrorBoundary>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
