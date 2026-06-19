// quality/frontend/src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import QualitySidebar from "./components/Sidebar"; // ← This should work now

import QCDashboardPage from "./pages/QCDashboardPage";
import QCLotsPage from "./pages/QCLotsPage";
import QCLotDetailPage from "./pages/QCLotDetailPage";
import QCPlansPage from "./pages/QCPlansPage";
import CAPAPage from "./pages/CAPAPage";

// 🆕 NEW PAGES
import QCParametersPage from "./pages/QCParametersPage";
import QCResultsPage from "./pages/QCResultsPage";
import QCDefectsPage from "./pages/QCDefectsPage";
import QCTemplatesPage from "./pages/QCTemplatesPage";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>
        <QualitySidebar />
        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/qc" replace />} />
            <Route path="/qc" element={<QCDashboardPage />} />

            {/* 🆕 NEW ROUTES */}
            <Route path="/qc/parameters" element={<QCParametersPage />} />
            <Route path="/qc/templates" element={<QCTemplatesPage />} />
            <Route path="/qc/results" element={<QCResultsPage />} />
            <Route path="/qc/defects" element={<QCDefectsPage />} />

            {/* ✅ EXISTING ROUTES */}
            <Route path="/qc/lots" element={<QCLotsPage />} />
            <Route path="/qc/lots/:id" element={<QCLotDetailPage />} />
            <Route path="/qc/plans" element={<QCPlansPage />} />
            <Route path="/qc/capa" element={<CAPAPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
