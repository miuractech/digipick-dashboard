import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, Loader, Center } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Suspense, lazy } from 'react';
import './App.css'
// Import Mantine styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import { AuthProvider } from './auth/AuthContexttype';

// Lazy load components
const AdminLogin = lazy(() => import('./auth/AdminLogin'));
const AdminLayout = lazy(() => import('./auth/AdminLayout'));
const ProtectedRoute = lazy(() => import('./auth/ProtectedRoute'));
const PublicRoute = lazy(() => import('./auth/PublicRoute'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const Organization = lazy(() => import('./pages/organization'));
const OrganizationDetail = lazy(() => import('./pages/organization-detail'));
const Devices = lazy(() => import('./pages/devices'));
const Users = lazy(() => import('./pages/users'));
const Settings = lazy(() => import('./pages/settings'));
const ServiceRequest = lazy(() => import('./pages/service'));
const ServiceEngineers = lazy(() => import('./pages/service-engineers'));

const LoadingFallback = () => (
  <Center h="100vh">
    <Loader size="lg" />
  </Center>
);

function App() {


  return (
    <MantineProvider>
      <Notifications />
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Redirect root to admin login */}
              <Route path="/" element={<Navigate to="/admin/login" replace />} />
              {/* Admin routes */}
              <Route path="/admin/login" element={
                <PublicRoute>
                  <AdminLogin />
                </PublicRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="organization" element={<Organization />} />
                <Route path="organization/:id" element={<OrganizationDetail />} />
                <Route path="devices" element={<Devices />} />
                <Route path="users" element={<Users />} />
                <Route path="service-request" element={<ServiceRequest />} />
                <Route path="service-engineers" element={<ServiceEngineers />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;