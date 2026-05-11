import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import Employees from './pages/Employees';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Procurement from './pages/Procurement';
import Finance from './pages/Finance';
import Messages from './pages/Messages';
import Tickets from './pages/Tickets';
import Analytics from './pages/Analytics';
import Retailers from './pages/Retailers';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import SmartInsights from './pages/SmartInsights';
import Logistics from './pages/Logistics';
import BusinessPartners from './pages/BusinessPartners';
import OrderTracking from './pages/OrderTracking';
import './index.css';

/**
 * App root component with AuthProvider, ToastProvider, ErrorBoundary,
 * and role-based routing.
 */
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user?.token ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={user?.token ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user?.token ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Authenticated routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/branches" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN']}><Layout><Branches /></Layout></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN']}><Layout><Employees /></Layout></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Layout><Inventory /></Layout></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
      <Route path="/procurement" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE', 'SUPPLIER']}><Layout><Procurement /></Layout></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE']}><Layout><Finance /></Layout></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Layout><Messages /></Layout></ProtectedRoute>} />
      <Route path="/tickets" element={<ProtectedRoute><Layout><Tickets /></Layout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN']}><Layout><Analytics /></Layout></ProtectedRoute>} />
      <Route path="/retailers" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN']}><Layout><Retailers /></Layout></ProtectedRoute>} />
      <Route path="/smart-insights" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN']}><Layout><SmartInsights /></Layout></ProtectedRoute>} />
      <Route path="/logistics" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE']}><Layout><Logistics /></Layout></ProtectedRoute>} />
      <Route path="/partners" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN']}><Layout><BusinessPartners /></Layout></ProtectedRoute>} />
      <Route path="/tracking/:orderId" element={<ProtectedRoute><Layout><OrderTracking /></Layout></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to={user?.token ? "/dashboard" : "/"} />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <ErrorBoundary>
        <Router>
          <AppRoutes />
        </Router>
      </ErrorBoundary>
    </ToastProvider>
  </AuthProvider>
);

export default App;
