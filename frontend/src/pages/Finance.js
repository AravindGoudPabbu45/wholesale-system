import React, { useState, useEffect } from 'react';
import { getAllPayments, getAllSales, recordPayment } from '../services/api';
import { FiDollarSign, FiCreditCard, FiTrendingUp, FiCheckCircle, FiClock, FiCheck } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#34d399', '#fb923c', '#4f8cff', '#a855f7', '#f87171'];

const Finance = () => {
  const [payments, setPayments] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetchFinance();
  }, []);

  const fetchFinance = async () => {
    try {
      const [payRes, salesRes] = await Promise.all([getAllPayments(), getAllSales()]);
      setPayments(payRes.data);
      setSales(salesRes.data);
    } catch {}
    setLoading(false);
  };

  const handleMarkPaid = async (paymentId) => {
    try {
      await recordPayment({ id: paymentId, paymentStatus: 'PAID', paymentMethod: 'MANUAL' });
      fetchFinance();
    } catch (e) { alert(e.response?.data?.message || 'Error marking payment'); }
  };

  if (loading) return <div className="loading">Loading finance...</div>;

  const paidPayments = payments.filter(p => p.paymentStatus === 'PAID');
  const pendingPayments = payments.filter(p => p.paymentStatus === 'PENDING');
  const totalRevenue = sales.reduce((sum, s) => sum + (s.revenue || 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
  const totalCost = sales.reduce((sum, s) => sum + (s.cost || 0), 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Payment status chart data
  const paymentStatusData = [
    { name: 'Paid', value: paidPayments.length, color: '#34d399' },
    { name: 'Pending', value: pendingPayments.length, color: '#fb923c' },
  ].filter(d => d.value > 0);

  // Revenue vs Cost bar chart
  const revenueData = [
    { name: 'Revenue', amount: totalRevenue },
    { name: 'Cost', amount: totalCost },
    { name: 'Profit', amount: totalProfit },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiDollarSign style={{ color: '#34d399' }} /> Finance Dashboard
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-green">
          <div className="kpi-icon"><FiTrendingUp /></div>
          <div className="kpi-value">₹{(totalRevenue / 1000).toFixed(1)}K</div>
          <div className="kpi-label">Total Revenue</div>
        </div>
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon"><FiDollarSign /></div>
          <div className="kpi-value">₹{(totalProfit / 1000).toFixed(1)}K</div>
          <div className="kpi-label">Net Profit</div>
        </div>
        <div className="kpi-card kpi-purple">
          <div className="kpi-icon"><FiCreditCard /></div>
          <div className="kpi-value">{profitMargin}%</div>
          <div className="kpi-label">Profit Margin</div>
        </div>
        <div className="kpi-card kpi-orange">
          <div className="kpi-icon"><FiClock /></div>
          <div className="kpi-value">₹{(totalPending / 1000).toFixed(1)}K</div>
          <div className="kpi-label">Pending Payments</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {['overview', 'payments', 'sales'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: '20px', border: `1px solid ${tab === t ? '#4f8cff' : '#2a2d3e'}`,
            background: tab === t ? '#4f8cff22' : 'transparent', color: tab === t ? '#4f8cff' : '#8b8fa3',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Revenue vs Cost vs Profit</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="name" stroke="#8b8fa3" fontSize={12} />
                <YAxis stroke="#8b8fa3" fontSize={12} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#e8eaed' }}
                  formatter={v => `₹${v.toLocaleString()}`} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {revenueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3>Payment Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={paymentStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {paymentStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#e8eaed' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <span style={{ color: '#34d399', fontWeight: 700 }}>✓ {paidPayments.length} Paid</span>
              <span style={{ color: '#8b8fa3', margin: '0 8px' }}>|</span>
              <span style={{ color: '#fb923c', fontWeight: 700 }}>⏳ {pendingPayments.length} Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div className="card">
          <div className="card-header"><h3>All Payments</h3></div>
          <table className="data-table">
            <thead>
              <tr><th>Order #</th><th>Amount</th><th>Status</th><th>Method</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: '#4f8cff' }}>{p.orderNumber}</td>
                  <td style={{ fontWeight: 700 }}>₹{p.amount?.toLocaleString()}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600,
                      background: p.paymentStatus === 'PAID' ? '#34d39922' : '#fb923c22',
                      color: p.paymentStatus === 'PAID' ? '#34d399' : '#fb923c',
                    }}>
                      {p.paymentStatus === 'PAID' ? <FiCheckCircle /> : <FiClock />} {p.paymentStatus}
                    </span>
                  </td>
                  <td style={{ color: '#8b8fa3' }}>{p.paymentMethod || '—'}</td>
                  <td style={{ color: '#8b8fa3' }}>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</td>
                  <td>
                    {p.paymentStatus === 'PENDING' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleMarkPaid(p.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiCheck /> Mark Received
                      </button>
                    )}
                    {p.paymentStatus === 'PAID' && (
                      <span style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: 600 }}>✓ Completed</span>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#8b8fa3' }}>No payments recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sales Tab */}
      {tab === 'sales' && (
        <div className="card">
          <div className="card-header"><h3>Sales Records</h3></div>
          <table className="data-table">
            <thead>
              <tr><th>Order #</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin</th><th>Date</th></tr>
            </thead>
            <tbody>
              {sales.map(s => {
                const margin = s.revenue > 0 ? ((s.profit / s.revenue) * 100).toFixed(1) : 0;
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: '#4f8cff' }}>{s.orderNumber}</td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>₹{s.revenue?.toLocaleString()}</td>
                    <td style={{ color: '#f87171' }}>₹{s.cost?.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: s.profit > 0 ? '#34d399' : '#f87171' }}>₹{s.profit?.toLocaleString()}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                        background: margin > 20 ? '#34d39922' : '#fb923c22',
                        color: margin > 20 ? '#34d399' : '#fb923c',
                      }}>{margin}%</span>
                    </td>
                    <td style={{ color: '#8b8fa3' }}>{s.recordedAt ? new Date(s.recordedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                );
              })}
              {sales.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#8b8fa3' }}>No sales recorded yet. Sales are auto-created when orders are delivered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Finance;
