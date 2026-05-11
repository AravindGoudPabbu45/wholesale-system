import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiBox, FiShoppingCart, FiUsers, FiTruck, FiMessageSquare, FiHelpCircle, FiBarChart2, FiDollarSign, FiLogOut, FiMenu, FiX, FiLayers, FiActivity, FiUserCheck, FiCpu, FiNavigation, FiBriefcase } from 'react-icons/fi';
import NotificationBell from '../NotificationBell';
import './Layout.css';

/**
 * Layout component with role-aware sidebar navigation and top navbar.
 */
const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => { logout(); navigate('/'); };

    /** Get navigation items based on user role */
    const getNavItems = () => {
        const role = user?.role;
        const branchId = user?.branchId;

        const common = [
            { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
            { to: '/messages', icon: <FiMessageSquare />, label: 'Messages' },
        ];

        switch (role) {
            case 'SUPER_ADMIN':
                return [...common,
                { to: '/branches', icon: <FiLayers />, label: 'Branches' },
                { to: '/employees', icon: <FiUsers />, label: 'Employees' },
                { to: '/products', icon: <FiBox />, label: 'Products' },
                { to: '/inventory', icon: <FiActivity />, label: 'Inventory' },
                { to: '/orders', icon: <FiShoppingCart />, label: 'Orders' },
                { to: '/partners', icon: <FiBriefcase />, label: 'Partners' },
                { to: '/procurement', icon: <FiTruck />, label: 'Procurement' },
                { to: '/finance', icon: <FiDollarSign />, label: 'Finance' },
                { to: '/tickets', icon: <FiHelpCircle />, label: 'Tickets' },
                { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
                { to: '/smart-insights', icon: <FiCpu />, label: 'Smart Insights' },
                { to: '/logistics', icon: <FiNavigation />, label: 'Logistics' },
                ];
            case 'BRANCH_ADMIN':
                return [...common,
                { to: '/employees', icon: <FiUsers />, label: 'Employees' },
                { to: '/products', icon: <FiBox />, label: 'Products' },
                { to: '/inventory', icon: <FiActivity />, label: 'Inventory' },
                { to: '/orders', icon: <FiShoppingCart />, label: 'Orders' },
                { to: '/partners', icon: <FiBriefcase />, label: 'Partners' },
                { to: '/procurement', icon: <FiTruck />, label: 'Procurement' },
                { to: '/finance', icon: <FiDollarSign />, label: 'Finance' },
                { to: '/tickets', icon: <FiHelpCircle />, label: 'Tickets' },
                { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
                { to: '/smart-insights', icon: <FiCpu />, label: 'Smart Insights' },
                ];
            case 'EMPLOYEE':
                return [...common,
                { to: '/orders', icon: <FiShoppingCart />, label: 'Orders' },
                { to: '/inventory', icon: <FiActivity />, label: 'Inventory' },
                { to: '/procurement', icon: <FiTruck />, label: 'Procurement' },
                { to: '/finance', icon: <FiDollarSign />, label: 'Finance' },
                { to: '/tickets', icon: <FiHelpCircle />, label: 'Tickets' },
                { to: '/logistics', icon: <FiNavigation />, label: 'Logistics' },
                ];
            case 'RETAILER':
                return [...common,
                { to: '/products', icon: <FiBox />, label: 'Products' },
                { to: '/orders', icon: <FiShoppingCart />, label: 'My Orders' },
                { to: '/tickets', icon: <FiHelpCircle />, label: 'Support' },
                ];
            case 'SUPPLIER':
                return [...common,
                { to: '/procurement', icon: <FiTruck />, label: 'Procurement' },
                ];
            default:
                return common;
        }
    };

    const getRoleBadge = (role) => {
        const labels = {
            SUPER_ADMIN: 'Super Admin', BRANCH_ADMIN: 'Branch Admin',
            EMPLOYEE: 'Employee', RETAILER: 'Retailer', SUPPLIER: 'Supplier'
        };
        return labels[role] || role;
    };

    return (
        <div className="layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        {sidebarOpen && <><span className="logo-icon">📦</span><span className="logo-text">WholesaleERP</span></>}
                    </div>
                    <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>
                <nav className="sidebar-nav">
                    {getNavItems().map((item) => (
                        <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <span className="nav-icon">{item.icon}</span>
                            {sidebarOpen && <span className="nav-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <span className="nav-icon"><FiLogOut /></span>
                        {sidebarOpen && <span className="nav-label">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                <header className="topbar">
                    <div className="topbar-left">
                        <h2 className="page-greeting">Welcome, {user?.fullName}</h2>
                    </div>
                    <div className="topbar-right">
                        <NotificationBell />
                        <span className={`role-badge role-${user?.role?.toLowerCase()}`}>{getRoleBadge(user?.role)}</span>
                        {user?.branchName && <span className="branch-badge">📍 {user.branchName}</span>}
                    </div>
                </header>
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
