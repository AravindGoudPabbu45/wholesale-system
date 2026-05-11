import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOrdersByBranch, updateOrderStatus, getBranches } from '../services/api';
import { FiPackage, FiTruck, FiNavigation, FiCheckCircle, FiMapPin, FiClock, FiRefreshCw } from 'react-icons/fi';
import './Logistics.css';

const LOGISTICS_STATUSES = ['PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'];

const STATUS_CONFIG = {
  PACKED: { icon: <FiPackage />, color: '#fb923c', label: 'Packed', step: 0 },
  SHIPPED: { icon: <FiTruck />, color: '#4f8cff', label: 'Shipped', step: 1 },
  IN_TRANSIT: { icon: <FiNavigation />, color: '#a855f7', label: 'In Transit', step: 2 },
  DELIVERED: { icon: <FiCheckCircle />, color: '#34d399', label: 'Delivered', step: 3 },
};

const Logistics = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(user?.branchId || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => { fetchInit(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedBranch) fetchOrders(); }, [selectedBranch]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInit = async () => {
    try {
      const branchRes = await getBranches();
      setBranches(branchRes.data.filter(b => b.isActive));
      if (!selectedBranch && branchRes.data.length > 0) setSelectedBranch(branchRes.data[0].id);
    } catch {} setLoading(false);
  };

  const fetchOrders = async () => {
    try {
      const res = await getOrdersByBranch(selectedBranch);
      // Only show orders that are in logistics pipeline
      setOrders(res.data.filter(o => [...LOGISTICS_STATUSES, 'APPROVED'].includes(o.status)));
    } catch {} setLoading(false);
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, { status, remarks: `Logistics: ${status}` });
      fetchOrders();
    } catch (e) { alert(e.response?.data?.message || 'Error updating status'); }
  };

  const getNextAction = (order) => {
    switch (order.status) {
      case 'PACKED': return { label: 'Mark Shipped', status: 'SHIPPED', icon: <FiTruck /> };
      case 'SHIPPED': return { label: 'In Transit', status: 'IN_TRANSIT', icon: <FiNavigation /> };
      case 'IN_TRANSIT': return { label: 'Mark Delivered', status: 'DELIVERED', icon: <FiCheckCircle /> };
      default: return null;
    }
  };

  const filtered = statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter);
  const counts = {
    ALL: orders.length,
    PACKED: orders.filter(o => o.status === 'PACKED').length,
    SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
    IN_TRANSIT: orders.filter(o => o.status === 'IN_TRANSIT').length,
    DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
  };

  if (loading) return <div className="loading">Loading logistics...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiNavigation style={{ color: '#a855f7' }} /> Logistics & Shipments
          </h1>
          <p style={{ color: '#8b8fa3', marginTop: '4px' }}>Track and manage deliveries in real-time</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'BRANCH_ADMIN') && (
            <select className="form-input" style={{ width: '200px' }} value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <button className="btn btn-secondary" onClick={fetchOrders}><FiRefreshCw /></button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="logistics-kpis">
        {['PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].map(s => (
          <div key={s} className="logistics-kpi" onClick={() => setStatusFilter(s === statusFilter ? 'ALL' : s)}
            style={{ borderLeft: `4px solid ${STATUS_CONFIG[s].color}`, cursor: 'pointer',
              background: statusFilter === s ? `${STATUS_CONFIG[s].color}11` : undefined }}>
            <div className="logistics-kpi-icon" style={{ background: `${STATUS_CONFIG[s].color}22`, color: STATUS_CONFIG[s].color }}>
              {STATUS_CONFIG[s].icon}
            </div>
            <div>
              <div className="logistics-kpi-value">{counts[s]}</div>
              <div className="logistics-kpi-label">{STATUS_CONFIG[s].label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="logistics-tabs">
        {['ALL', ...LOGISTICS_STATUSES].map(s => (
          <button key={s} className={`logistics-tab ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}>
            {s === 'ALL' ? `All (${counts.ALL})` : `${STATUS_CONFIG[s]?.label || s} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {/* Shipment Cards */}
      <div className="logistics-grid">
        {filtered.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px' }}>
            <FiPackage size={48} style={{ color: '#2a2d3e', marginBottom: '12px' }} />
            <h3 style={{ color: '#8b8fa3' }}>No shipments in this category</h3>
          </div>
        ) : filtered.map(order => {
          const statusConf = STATUS_CONFIG[order.status] || { step: -1, color: '#8b8fa3' };
          const nextAction = getNextAction(order);
          const isExpanded = expandedOrder === order.id;

          return (
            <div key={order.id} className="logistics-card">
              {/* Card Header */}
              <div className="logistics-card-header">
                <div>
                  <h3 className="logistics-order-num">{order.orderNumber}</h3>
                  <span style={{ color: '#8b8fa3', fontSize: '0.85rem' }}>{order.retailerName} — {order.businessName}</span>
                </div>
                <span className="logistics-status-badge" style={{
                  background: `${statusConf.color}22`, color: statusConf.color
                }}>
                  {statusConf.icon} {statusConf.label || order.status}
                </span>
              </div>

              {/* Timeline Stepper */}
              <div className="logistics-timeline">
                {LOGISTICS_STATUSES.map((s, i) => {
                  const conf = STATUS_CONFIG[s];
                  const isCompleted = statusConf.step >= i;
                  const isCurrent = statusConf.step === i;
                  return (
                    <div key={s} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="timeline-dot" style={{
                        background: isCompleted ? conf.color : '#2a2d3e',
                        borderColor: isCompleted ? conf.color : '#3a3d4e',
                        boxShadow: isCurrent ? `0 0 12px ${conf.color}66` : 'none',
                      }}>
                        {isCompleted ? conf.icon : <span style={{ fontSize: '10px' }}>{i + 1}</span>}
                      </div>
                      <span className="timeline-label">{conf.label}</span>
                      {i < LOGISTICS_STATUSES.length - 1 && (
                        <div className="timeline-line" style={{ background: isCompleted ? conf.color : '#2a2d3e' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Order Details */}
              <div className="logistics-details">
                <div className="logistics-detail-item">
                  <FiMapPin size={14} /> <span>{order.branchName}</span>
                </div>
                <div className="logistics-detail-item">
                  <FiClock size={14} /> <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="logistics-detail-item" style={{ fontWeight: 700, color: '#e8eaed' }}>
                  ₹{order.totalAmount?.toLocaleString()}
                </div>
              </div>

              {/* Expand Items */}
              <button className="logistics-expand-btn" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                {isExpanded ? 'Hide Items ▲' : `View ${order.items?.length || 0} Items ▼`}
              </button>
              {isExpanded && order.items && (
                <div className="logistics-items">
                  {order.items.map(item => (
                    <div key={item.id} className="logistics-item-row">
                      <span>{item.productName}</span>
                      <span style={{ color: '#8b8fa3' }}>×{item.quantity}</span>
                      <span style={{ color: '#4f8cff' }}>₹{item.totalPrice?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              {nextAction && user?.role !== 'RETAILER' && (
                <button className="logistics-action-btn" onClick={() => handleStatusUpdate(order.id, nextAction.status)}
                  style={{ background: `linear-gradient(135deg, ${statusConf.color}, ${statusConf.color}cc)` }}>
                  {nextAction.icon} {nextAction.label}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Logistics;
