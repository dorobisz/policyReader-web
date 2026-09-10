import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components';
import './index.css';

import { DashboardView } from './pages/DashboardView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardView />} />
          <Route
            path="upload"
            element={
              <div className="space-y-md">
                <div className="mb-lg">
                  <h2 className="font-display-lg text-display-lg text-on-surface mb-xs">
                    Document Upload
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant">
                    Upload policy documents for processing and extraction.
                  </p>
                </div>
                <div className="p-xl border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest text-center py-16">
                  <span className="material-symbols-outlined text-secondary text-4xl mb-sm block">
                    cloud_upload
                  </span>
                  <p className="font-headline-sm text-headline-sm text-on-surface">
                    Upload View Ready
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                    Krok 3.2 zrealizuje: Przesyłanie plików PDF i przejście do monitorowania paczki.
                  </p>
                </div>
              </div>
            }
          />
          <Route
            path="jobs/:batchId"
            element={
              <div className="space-y-md">
                <div className="mb-lg">
                  <h2 className="font-display-lg text-display-lg text-on-surface mb-xs">
                    Batch Processing Status
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant">
                    Monitoring live processing progress for selected batch.
                  </p>
                </div>
                <div className="p-xl border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest text-center py-16">
                  <span className="material-symbols-outlined text-secondary text-4xl mb-sm block">
                    sync
                  </span>
                  <p className="font-headline-sm text-headline-sm text-on-surface">
                    Batch Status View
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                    Krok 3.3: Monitoring postępu przetwarzania paczki (/jobs/:batchId).
                  </p>
                </div>
              </div>
            }
          />
          <Route
            path="result/:batchId"
            element={
              <div className="space-y-md">
                <div className="mb-lg">
                  <h2 className="font-display-lg text-display-lg text-on-surface mb-xs">
                    Batch Results
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant">
                    Review extracted policy records and confidence scores.
                  </p>
                </div>
                <div className="p-xl border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest text-center py-16">
                  <span className="material-symbols-outlined text-secondary text-4xl mb-sm block">
                    table_chart
                  </span>
                  <p className="font-headline-sm text-headline-sm text-on-surface">
                    Batch Results View
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                    Krok 3.4: Prezentacja wyników ekstrakcji polis (/result/:batchId).
                  </p>
                </div>
              </div>
            }
          />
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
