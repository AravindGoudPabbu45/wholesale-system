import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSuperAdminDashboard, getBranchAdminDashboard, getBranchAnalytics, getMyOrders, getMyTickets, getOrderPipeline, getDashboardAlerts } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiLayers, FiUsers, FiShoppingCart, FiDollarSign, FiActivity, FiAlertTriangle, FiCheckCircle, FiTruck, FiPackage, FiNavigation, FiClock, FiCpu, FiArrowRight } from 'react-icons/fi';

const COLORS = ['#4f8cff', '#a855f7', '#34d399', '#fb923c', '#f87171', '#22d3ee'];

const PIPELINE_STEPS = [
  { key: 'pending', label: 'Pending', color: '#8b8fa3', icon: <FiClock /> },
  { key: 'approved', label: 'Approved', color: '#4f8cff', icon: <FiCheckCircle /> },
  { key: 'packed', label: 'Packed', color: '#fb923c', icon: <FiPackage /> },
  { key: 'shipped', label: 'Shipped', color: '#a855f7', icon: <FiTruck /> },
  { key: 'inTransit', label: 'In Transit', color: '#22d3ee', icon: <FiNavigation /> },
  { key: 'delivered', label: 'Delivered', color: '#34d399', icon: <FiCheckCircle /> },
];

/**
 * Role-based Dashboard with live order pipeline, alerts, and AI recommendations.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [branchData, setBranchData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pipeline, setPipeline] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.role === 'SUPER_ADMIN') {
          const [statsRes, branchRes, pipeRes, alertRes] = await Promise.all([
            getSuperAdminDashboard(), getBranchAnalytics(), getOrderPipeline(), getDashboardAlerts()
          ]);
          setStats(statsRes.data);
          setBranchData(branchRes.data);
          setPipeline(pipeRes.data);
          setAlerts(alertRes.data);
        } else if (user.role === 'BRANCH_ADMIN' && user.branchId) {
          const [res, pipeRes, alertRes] = await Promise.all([
            getBranchAdminDashboard(user.branchId), getOrderPipeline(), getDashboardAlerts()
          ]);
          setStats(res.data);
          setPipeline(pipeRes.data);
          setAlerts(alertRes.data);
        } else if (user.role === 'EMPLOYEE') {
          try {
            const [pipeRes, alertRes] = await Promise.all([getOrderPipeline(), getDashboardAlerts()]);
            setPipeline(pipeRes.data);
            setAlerts(alertRes.data);
          } catch {}
        } else if (user.role === 'RETAILER') {
          const [ordersRes, ticketsRes] = await Promise.all([getMyOrders(), getMyTickets()]);
          setOrders(ordersRes.data);
          setStats({
            totalOrders: ordersRes.data.length,
            pendingOrders: ordersRes.data.filter(o => ['PENDING', 'VALIDATED', 'APPROVED'].includes(o.status)).length,
            deliveredOrders: ordersRes.data.filter(o => o.status === 'DELIVERED').length,
            openTickets: ticketsRes.data.filter(t => t.status !== 'CLOSED').length
          });
        }
      } catch (err) { console.error('Dashboard error:', err); }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{user.role === 'SUPER_ADMIN' ? '🏢 Company Overview' : user.role === 'BRANCH_ADMIN' ? '📊 Branch Dashboard' : user.role === 'EMPLOYEE' ? '⚡ My Workspace' : '🛒 My Dashboard'}</h1>
      </div>

      {/* ========== ORDER PIPELINE (Admin/Employee) ========== */}
      {pipeline && (user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN' || user.role === 'EMPLOYEE') && (
        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#e8eaed', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiActivity style={{ color: '#4f8cff' }} /> Live Order Pipeline
            </h3>
            <span style={{ color: '#8b8fa3', fontSize: '0.85rem' }}>{pipeline.total} total orders</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {PIPELINE_STEPS.map((step, i) => {
              const count = pipeline[step.key] || 0;
              const pct = pipeline.total > 0 ? (count / pipeline.total) * 100 : 0;
              return (
                <React.Fragment key={step.key}>
                  <div
                    onClick={() => navigate('/orders')}
                    style={{
                      flex: 1, cursor: 'pointer', padding: '16px 12px',
                      background: count > 0 ? `${step.color}15` : '#141622',
                      border: `1px solid ${count > 0 ? step.color + '44' : '#2a2d3e'}`,
                      borderRadius: '12px', textAlign: 'center',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${step.color}22`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  >
                    <div style={{ color: step.color, fontSize: '18px', marginBottom: '6px' }}>{step.icon}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: count > 0 ? '#e8eaed' : '#3a3d4e' }}>{count}</div>
                    <div style={{ fontSize: '0.72rem', color: '#8b8fa3', fontWeight: 600, marginTop: '2px' }}>{step.label}</div>
                    {count > 0 && (
                      <div style={{ marginTop: '8px', height: '3px', borderRadius: '2px', background: '#2a2d3e', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 10)}%`, height: '100%', background: step.color, borderRadius: '2px', transition: 'width 0.5s' }} />
                      </div>
                    )}
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <FiArrowRight style={{ color: '#3a3d4e', fontSize: '14px', flexShrink: 0 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== KPI Cards ========== */}
      {stats && (
        <div className="kpi-grid">
          {user.role === 'SUPER_ADMIN' && (
            <>
              <KPI icon={<FiLayers />} value={stats.totalBranches} label="Active Branches" cls="kpi-blue" onClick={() => navigate('/branches')} />
              <KPI icon={<FiUsers />} value={stats.totalEmployees} label="Total Employees" cls="kpi-purple" onClick={() => navigate('/employees')} />
              <KPI icon={<FiShoppingCart />} value={stats.totalOrders} label="Total Orders" cls="kpi-cyan" onClick={() => navigate('/orders')} />
              <KPI icon={<FiDollarSign />} value={`₹${(stats.totalRevenue / 1000).toFixed(1)}K`} label="Total Revenue" cls="kpi-green" onClick={() => navigate('/finance')} />
              <KPI icon={<FiActivity />} value={`₹${(stats.totalProfit / 1000).toFixed(1)}K`} label="Total Profit" cls="kpi-orange" onClick={() => navigate('/finance')} />
              <KPI icon={<FiAlertTriangle />} value={stats.lowStockAlerts} label="Low Stock Alerts" cls="kpi-red" onClick={() => navigate('/smart-insights')} />
            </>
          )}
          {user.role === 'BRANCH_ADMIN' && (
            <>
              <KPI icon={<FiUsers />} value={stats.totalEmployees} label="Employees" cls="kpi-blue" onClick={() => navigate('/employees')} />
              <KPI icon={<FiShoppingCart />} value={stats.totalOrders} label="Total Orders" cls="kpi-purple" onClick={() => navigate('/orders')} />
              <KPI icon={<FiDollarSign />} value={`₹${((stats.totalRevenue || 0) / 1000).toFixed(1)}K`} label="Revenue" cls="kpi-green" onClick={() => navigate('/finance')} />
              <KPI icon={<FiAlertTriangle />} value={stats.lowStockAlerts} label="Low Stock" cls="kpi-red" onClick={() => navigate('/smart-insights')} />
            </>
          )}
          {user.role === 'RETAILER' && (
            <>
              <KPI icon={<FiShoppingCart />} value={stats.totalOrders} label="My Orders" cls="kpi-blue" onClick={() => navigate('/orders')} />
              <KPI icon={<FiTruck />} value={stats.pendingOrders} label="In Progress" cls="kpi-orange" onClick={() => navigate('/orders')} />
              <KPI icon={<FiCheckCircle />} value={stats.deliveredOrders} label="Delivered" cls="kpi-green" onClick={() => navigate('/orders')} />
              <KPI icon={<FiAlertTriangle />} value={stats.openTickets} label="Open Tickets" cls="kpi-red" onClick={() => navigate('/tickets')} />
            </>
          )}
          {(user.role === 'EMPLOYEE' || user.role === 'SUPPLIER') && !pipeline && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3>Welcome to WholesaleERP</h3>
              <p className="text-muted mt-2">Use the sidebar to navigate to your assigned modules.</p>
            </div>
          )}
        </div>
      )}

      {/* ========== ALERTS SECTION ========== */}
      {alerts.length > 0 && (user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN') && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiAlertTriangle style={{ color: '#f87171' }} /> System Alerts
              <span style={{ background: '#ef444422', color: '#ef4444', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>{alerts.length}</span>
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {alerts.slice(0, 10).map((alert, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                background: '#141622', borderRadius: '10px',
                borderLeft: `3px solid ${alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'HIGH' ? '#f97316' : '#eab308'}`,
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0,
                  background: alert.type === 'STOCK' ? '#f8717122' : '#eab30822',
                  color: alert.type === 'STOCK' ? '#f87171' : '#eab308',
                }}>
                  {alert.type === 'STOCK' ? <FiAlertTriangle /> : <FiDollarSign />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#e8eaed', fontSize: '0.85rem' }}>{alert.title}</div>
                  <div style={{ color: '#8b8fa3', fontSize: '0.78rem' }}>{alert.message}</div>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700,
                  background: alert.severity === 'CRITICAL' ? '#ef444422' : alert.severity === 'HIGH' ? '#f9731622' : '#eab30822',
                  color: alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'HIGH' ? '#f97316' : '#eab308',
                }}>{alert.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts - Super Admin */}
      {user.role === 'SUPER_ADMIN' && branchData.length > 0 && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Branch Revenue Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="branchName" stroke="#8b8fa3" fontSize={12} />
                <YAxis stroke="#8b8fa3" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#e8eaed' }} />
                <Bar dataKey="revenue" fill="#4f8cff" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3>Employee Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={branchData} dataKey="employeeCount" nameKey="branchName" cx="50%" cy="50%" outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`} labelLine={true}>
                  {branchData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#e8eaed' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Orders - Retailer */}
      {user.role === 'RETAILER' && orders.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Recent Orders</h3></div>
          <table className="data-table">
            <thead><tr><th>Order #</th><th>Branch</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {orders.slice(0, 5).map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                  <td>{o.branchName}</td>
                  <td>₹{o.totalAmount?.toLocaleString()}</td>
                  <td><span className={`status-badge status-${o.status?.toLowerCase()}`}>{o.status}</span></td>
                  <td className="text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/** Reusable KPI Card component */
const KPI = ({ icon, value, label, cls, onClick }) => (
  <div className={`kpi-card ${cls}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-label">{label}</div>
  </div>
);

export default Dashboard;
