import { Navigate, Route, Routes } from 'react-router-dom';
import { DocumentsPage } from '../../pages/DocumentsPage';
import { SearchPage } from '../../pages/SearchPage';
import { IndexingPage } from '../../pages/IndexingPage';
import { EvaluationPage } from '../../pages/EvaluationPage';
import { AnalyticsPage } from '../../pages/AnalyticsPage';
import { CrudPlaceholderPage } from '../../pages/CrudPlaceholderPage';
import { QueriesPage } from '../../pages/QueriesPage';
import { ResultsPage } from '../../pages/ResultsPage';
import { DataSourcePage } from '../../pages/DataSourcePage';
import { ExperimentsPage } from '../../pages/ExperimentsPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/data-source" replace />} />
      <Route path="/data-source" element={<DataSourcePage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/queries" element={<QueriesPage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/indexing" element={<IndexingPage />} />
      <Route path="/evaluation" element={<EvaluationPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/experiments" element={<ExperimentsPage />} />
      <Route path="/settings" element={<CrudPlaceholderPage title="Settings" />} />
    </Routes>
  );
}
