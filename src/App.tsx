import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
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
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="inmates/:jurisdiction/:id" element={<InmateDetailPage />} />
        <Route path="units" element={<UnitsPage />} />
        <Route path="units/:jurisdiction/:name" element={<UnitDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
