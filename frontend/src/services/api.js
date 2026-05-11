import axios from 'axios';

/**
 * Axios API instance with JWT interceptor.
 * Automatically attaches Authorization header from localStorage.
 * Uses REACT_APP_API_URL env var in production, falls back to localhost in dev.
 */
const getBaseURL = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    return `http://${window.location.hostname}:8080/api`;
};

const API = axios.create({
    baseURL: getBaseURL(),
    headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach JWT token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - handle 401 errors
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.clear();
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// ===== AUTH =====
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);

// ===== DASHBOARD =====
export const getSuperAdminDashboard = () => API.get('/dashboard/super-admin');
export const getBranchAdminDashboard = (branchId) => API.get(`/dashboard/branch-admin/${branchId}`);

// ===== BRANCHES =====
export const getBranches = () => API.get('/branches');
export const getBranchById = (id) => API.get(`/branches/${id}`);
export const createBranch = (data) => API.post('/branches', data);
export const updateBranch = (id, data) => API.put(`/branches/${id}`, data);
export const deleteBranch = (id) => API.delete(`/branches/${id}`);
export const activateBranch = (id) => API.put(`/branches/${id}/activate`);
export const permanentDeleteBranch = (id) => API.delete(`/branches/${id}/permanent`);
export const getBranchAnalytics = () => API.get('/branches/analytics');

// ===== EMPLOYEES =====
export const getEmployees = () => API.get('/employees');
export const getEmployeesByBranch = (branchId) => API.get(`/employees/branch/${branchId}`);
export const getEmployeeById = (id) => API.get(`/employees/${id}`);
export const addEmployee = (data) => API.post('/employees', data);
export const updateEmployee = (id, data) => API.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => API.delete(`/employees/${id}`);
export const activateEmployee = (id) => API.put(`/employees/${id}/activate`);
export const permanentDeleteEmployee = (id) => API.delete(`/employees/${id}/permanent`);

// ===== PRODUCTS =====
export const getProducts = () => API.get('/products');
export const getProductById = (id) => API.get(`/products/${id}`);
export const createProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);

// ===== INVENTORY =====
export const getInventoryByBranch = (branchId) => API.get(`/inventory/branch/${branchId}`);
export const getLowStockByBranch = (branchId) => API.get(`/inventory/branch/${branchId}/low-stock`);
export const getAllLowStock = () => API.get('/inventory/low-stock');
export const getStockMovements = (branchId) => API.get(`/inventory/branch/${branchId}/movements`);

// ===== ORDERS =====
export const placeOrder = (data) => API.post('/orders', data);
export const getOrdersByBranch = (branchId) => API.get(`/orders/branch/${branchId}`);
export const getOrdersByStatus = (branchId, status) => API.get(`/orders/branch/${branchId}/status/${status}`);
export const getMyOrders = () => API.get('/orders/my-orders');
export const getOrderById = (id) => API.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => API.put(`/orders/${id}/status`, data);
export const getOrderTimeline = (id) => API.get(`/orders/${id}/timeline`);

// ===== PROCUREMENT =====
export const createProcurement = (data) => API.post('/procurement', data);
export const getProcurementByBranch = (branchId) => API.get(`/procurement/branch/${branchId}`);
export const getProcurementBySupplier = (supplierId) => API.get(`/procurement/supplier/${supplierId}`);
export const updateProcurementStatus = (id, status) => API.put(`/procurement/${id}/status?status=${status}`);
export const getAllProcurement = () => API.get('/procurement');

// ===== FINANCE =====
export const recordPayment = (data) => API.post('/finance/payments', data);
export const getPaymentByOrder = (orderId) => API.get(`/finance/payments/order/${orderId}`);
export const getPendingPayments = () => API.get('/finance/payments/pending');
export const getAllPayments = () => API.get('/finance/payments');
export const getAllSales = () => API.get('/finance/sales');

// ===== MESSAGES =====
export const sendMessage = (data) => API.post('/messages', data);
export const getConversation = (otherUserId) => API.get(`/messages/conversation/${otherUserId}`);
export const getUnreadCount = () => API.get('/messages/unread-count');
export const markAsRead = (otherUserId) => API.put(`/messages/read/${otherUserId}`);
export const getContacts = () => API.get('/messages/contacts');

// ===== TICKETS =====
export const createTicket = (data) => API.post('/tickets', data);
export const updateTicket = (id, data) => API.put(`/tickets/${id}`, data);
export const getMyTickets = () => API.get('/tickets/my-tickets');
export const getTicketsByBranch = (branchId) => API.get(`/tickets/branch/${branchId}`);
export const getAllTickets = () => API.get('/tickets');

// ===== RETAILERS =====
export const getAllRetailers = () => API.get('/retailers');
export const getPendingRetailers = () => API.get('/retailers/pending');
export const approveRetailer = (id) => API.put(`/retailers/${id}/approve`);
export const rejectRetailer = (id) => API.put(`/retailers/${id}/reject`);

// ===== AI =====
export const getDemandForecast = (branchId) => API.get(`/ai/forecast/${branchId}`);
export const detectAnomalies = (branchId) => API.get(`/ai/anomalies/detect/${branchId}`);
export const getAnomalies = (branchId) => API.get(`/ai/anomalies/${branchId}`);

// ===== NOTIFICATIONS =====
export const getNotifications = () => API.get('/notifications');
export const getUnreadNotifCount = () => API.get('/notifications/unread-count');
export const markNotifRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotifsRead = () => API.put('/notifications/read-all');

// ===== DASHBOARD PIPELINE & ALERTS =====
export const getOrderPipeline = () => API.get('/dashboard/order-pipeline');
export const getDashboardAlerts = () => API.get('/dashboard/alerts');

// ===== ORDER TRACKING =====
export const getOrderTracking = (orderId) => API.get(`/tracking/${orderId}`);
export const getTrackingTimeline = (orderId) => API.get(`/tracking/${orderId}/timeline`);
export const simulateTracking = (orderId) => API.post(`/tracking/${orderId}/simulate`);

// ===== INVENTORY ACTIONS =====
export const adjustStock = (data) => API.post('/inventory/adjust', data);
export const updateThreshold = (productId, data) => API.put(`/products/${productId}/threshold`, data);

export default API;
