import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - wraps routes that require authentication and optionally specific roles.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();

    if (!user || !user.token) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
