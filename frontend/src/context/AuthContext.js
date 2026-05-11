import React, { createContext, useState, useContext, useEffect } from 'react';

/**
 * AuthContext - manages user authentication state across the app.
 * Stores JWT token and user info in both state and localStorage.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore user from localStorage on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    /** Login - store token and user data */
    const loginUser = (authResponse) => {
        localStorage.setItem('token', authResponse.token);
        localStorage.setItem('user', JSON.stringify(authResponse));
        setUser(authResponse);
    };

    /** Logout - clear everything */
    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    /** Check if user has a specific role */
    const hasRole = (role) => user?.role === role;

    /** Check if authenticated */
    const isAuthenticated = () => !!user?.token;

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, loginUser, logout, hasRole, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export default AuthContext;
