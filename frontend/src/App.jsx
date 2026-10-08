import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SecurityProvider } from './context/SecurityContext';
import { LandingPage } from './pages/landing/LandingPage';
import { DashboardApp } from './pages/DashboardApp';
import './index.css';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Dashboard App (Source of Truth from ZIP) */}
      <Route path="/dashboard" element={<DashboardApp initialPage="dashboard" />} />
      <Route path="/firewall" element={<DashboardApp initialPage="firewall" />} />
      <Route path="/threats" element={<DashboardApp initialPage="threats" />} />
      <Route path="/attacks" element={<DashboardApp initialPage="attacks" />} />
      <Route path="/policies" element={<DashboardApp initialPage="policies" />} />
      <Route path="/audit" element={<DashboardApp initialPage="audit" />} />
      <Route path="/settings" element={<DashboardApp initialPage="settings" />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SecurityProvider>
          <AppRoutes />
        </SecurityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;