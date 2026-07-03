import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './db/store';
import { LoadingScreen } from './screens/LoadingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { Dashboard } from './screens/Dashboard';
import { EngagementDetail } from './screens/EngagementDetail';
import { WorkingPaperView } from './screens/WorkingPaperView';
import { ReviewDashboard } from './screens/ReviewDashboard';
import { SettingsScreen } from './screens/SettingsScreen';
import { PlanningCanvas } from './screens/PlanningCanvas';
import { PBCMatrix } from './screens/PBCMatrix';
import { ClientPortal } from './screens/ClientPortal';
import { ComplianceTower } from './screens/ComplianceTower';
import { ArchiveViewer } from './screens/ArchiveViewer';
import { Layout } from './components/Layout';

// Protect routes by ensuring current user context exists
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, currentFirm } = useAppStore();
  
  if (!currentUser || !currentFirm) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  const { supabaseSettings, syncFromSupabase } = useAppStore();

  useEffect(() => {
    if (supabaseSettings.isEnabled) {
      console.log('Supabase Cloud Sync Active: Performing initial pull...');
      syncFromSupabase()
        .then(res => {
          if (res.success) {
            console.log('Supabase Cloud Sync Complete: Local database loaded from cloud.');
          } else {
            console.warn('Supabase Cloud Sync Warning:', res.error);
          }
        })
        .catch(err => {
          console.error('Supabase Cloud Sync Fatal:', err);
        });
    }
  }, [supabaseSettings.isEnabled, syncFromSupabase]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Loading screen at root */}
        <Route path="/" element={<LoadingScreen />} />
        
        {/* Login & Onboarding */}
        <Route path="/login" element={<LoginScreen />} />

        {/* Decentralized Unprotected Client Portal access with token */}
        <Route path="/portal/:token" element={<ClientPortal />} />

        {/* Authenticated Workspace Pages */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/engagement/:engagementId" 
          element={
            <ProtectedRoute>
              <EngagementDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/engagement/:engagementId/planning" 
          element={
            <ProtectedRoute>
              <PlanningCanvas />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/engagement/:engagementId/pbc" 
          element={
            <ProtectedRoute>
              <PBCMatrix />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/engagement/:engagementId/archive" 
          element={
            <ProtectedRoute>
              <ArchiveViewer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/wp/:wpId" 
          element={
            <ProtectedRoute>
              <WorkingPaperView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/review" 
          element={
            <ProtectedRoute>
              <ReviewDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/compliance" 
          element={
            <ProtectedRoute>
              <ComplianceTower />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsScreen />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
