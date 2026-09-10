import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route
            index
            element={
              <div className="space-y-md">
                <div className="flex justify-between items-end mb-xl">
                  <div>
                    <h2 className="font-display-lg text-display-lg text-on-surface">Overview</h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
                      Manage your recent policy processing batches.
                    </p>
                  </div>
                </div>
                <div className="p-xl border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest text-center py-16">
                  <span className="material-symbols-outlined text-secondary text-4xl mb-sm block">
                    dashboard
                  </span>
                  <p className="font-headline-sm text-headline-sm text-on-surface">
                    AppLayout Shell Ready
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                    Krok 2.1 zrealizowany: Główny kontener z fixowanym paskiem bocznym i scrollowanym obszarem treści.
                  </p>
                </div>
              </div>
            }
          />
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
                    Krok 2.2 zrealizowany: Nawigacja SideNavBar z automatycznym podświetlaniem aktywnej sekcji (NavLink).
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
