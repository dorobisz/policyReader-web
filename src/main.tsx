import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout, ToastProvider, ErrorBoundary } from "./components";
import "./index.css";

import {
  VehicleRegBatchesView,
  VehicleRegUploadView,
  VehicleRegStatusView,
  VehicleRegResultsView,
} from "./features/vehicle-registration";
import { SettingsView } from "./features/settings";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route
              index
              element={
                <ErrorBoundary>
                  <VehicleRegBatchesView />
                </ErrorBoundary>
              }
            />
            <Route
              path="upload"
              element={
                <ErrorBoundary>
                  <VehicleRegUploadView />
                </ErrorBoundary>
              }
            />
            <Route
              path="jobs/:batchId"
              element={
                <ErrorBoundary>
                  <VehicleRegStatusView />
                </ErrorBoundary>
              }
            />
            <Route
              path="result/:batchId"
              element={
                <ErrorBoundary>
                  <VehicleRegResultsView />
                </ErrorBoundary>
              }
            />
            <Route
              path="settings"
              element={
                <ErrorBoundary>
                  <SettingsView />
                </ErrorBoundary>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);