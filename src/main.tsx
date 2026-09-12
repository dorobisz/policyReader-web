import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout, ToastProvider, ErrorBoundary } from "./components";
import "./index.css";

import { DashboardView } from "./pages/DashboardView";
import { UploadView } from "./pages/UploadView";
import { BatchStatusView } from "./pages/BatchStatusView";
import { BatchResultsView } from "./pages/BatchResultsView";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<ErrorBoundary><DashboardView /></ErrorBoundary>} />
            <Route path="upload" element={<ErrorBoundary><UploadView /></ErrorBoundary>} />
            <Route path="jobs/:batchId" element={<ErrorBoundary><BatchStatusView /></ErrorBoundary>} />
            <Route path="result/:batchId" element={<ErrorBoundary><BatchResultsView /></ErrorBoundary>} />
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