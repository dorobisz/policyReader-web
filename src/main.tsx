import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components';
import './index.css';

import { DashboardView } from './pages/DashboardView';
import { UploadView } from './pages/UploadView';
import { BatchStatusView } from './pages/BatchStatusView';
import { BatchResultsView } from './pages/BatchResultsView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="upload" element={<UploadView />} />
          <Route path="jobs/:batchId" element={<BatchStatusView />} />
          <Route path="result/:batchId" element={<BatchResultsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
