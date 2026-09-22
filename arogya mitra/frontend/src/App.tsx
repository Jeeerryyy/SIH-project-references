import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './lib/auth';
import { AppShell } from './components/layouts/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { ReferralsPage } from './pages/ReferralsPage';
import { MaternalNcdPage } from './pages/MaternalNcdPage';
import { TeleconsultPage } from './pages/TeleconsultPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { PharmacyPage } from './pages/PharmacyPage';
import { LaboratoryPage } from './pages/LaboratoryPage';
import { EmergencyDispatchPage } from './pages/EmergencyDispatchPage';
import { ImmunizationPage } from './pages/ImmunizationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HealthCardPage } from './pages/HealthCardPage';
import { AdminPage } from './pages/AdminPage';
import './styles/globals.css';
import './lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell>{children}</AppShell>;
};

export const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teleconsult"
            element={
              <ProtectedRoute>
                <TeleconsultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/referrals"
            element={
              <ProtectedRoute>
                <ReferralsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ncd-tracking"
            element={
              <ProtectedRoute>
                <MaternalNcdPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab"
            element={
              <ProtectedRoute>
                <LaboratoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute>
                <PharmacyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-dispatch"
            element={
              <ProtectedRoute>
                <EmergencyDispatchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/immunization"
            element={
              <ProtectedRoute>
                <ImmunizationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/health-card"
            element={
              <ProtectedRoute>
                <HealthCardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
