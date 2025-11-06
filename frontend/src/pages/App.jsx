import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardLayout from '../components/DashboardLayout';

import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Settings from './Settings';
import Flights from './Flights';
import Airports from './Airports';
import Aircraft from './Aircraft';
import Airlines from './Airlines';
import RoutesPage from './Routes';
import Crew from './Crew';
import Reservations from './Reservations';
import Tickets from './Tickets';
import Payments from './Payments';

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/flights"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Flights />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/airports"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Airports />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/aircraft"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Aircraft />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/airlines"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Airlines />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/routes"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RoutesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crew"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Crew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reservations"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Reservations />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Tickets />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Payments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
