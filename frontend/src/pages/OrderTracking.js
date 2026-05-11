import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderTracking, simulateTracking } from '../services/api';
import { FiArrowLeft, FiPackage, FiCheckCircle, FiTruck, FiNavigation, FiMapPin, FiClock, FiPlay } from 'react-icons/fi';
import './OrderTracking.css';

const STATUS_CONFIG = {
  PENDING: { icon: <FiClock />, color: '#8b8fa3', label: 'Order Placed' },
  APPROVED: { icon: <FiCheckCircle />, color: '#4f8cff', label: 'Order Confirmed' },
  PACKED: { icon: <FiPackage />, color: '#fb923c', label: 'Packed' },
  SHIPPED: { icon: <FiTruck />, color: '#a855f7', label: 'Shipped' },
  IN_TRANSIT: { icon: <FiNavigation />, color: '#22d3ee', label: 'In Transit' },
  NEARBY: { icon: <FiMapPin />, color: '#eab308', label: 'Nearby' },
  OUT_FOR_DELIVERY: { icon: <FiTruck />, color: '#34d399', label: 'Out for Delivery' },
  DELIVERED: { icon: <FiCheckCircle />, color: '#10b981', label: 'Delivered' },
};

// Simulated GPS coordinates for each stage
const MAP_COORDS = {
  PENDING: { lat: 17.385, lng: 78.4867, label: 'Warehouse — Hyderabad' },
  APPROVED: { lat: 17.385, lng: 78.4867, label: 'Warehouse — Hyderabad' },
  PACKED: { lat: 17.385, lng: 78.4867, label: 'Warehouse — Hyderabad' },
  SHIPPED: { lat: 17.44, lng: 78.35, label: 'Left Warehouse' },
  IN_TRANSIT: { lat: 15.35, lng: 78.05, label: 'Regional Hub — Kurnool' },
  NEARBY: { lat: 13.08, lng: 77.57, label: 'Local Center — Bengaluru' },
  OUT_FOR_DELIVERY: { lat: 12.97, lng: 77.59, label: 'Delivery Vehicle — Your Area' },
  DELIVERED: { lat: 12.96, lng: 77.60, label: 'Delivered — Your Location' },
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchTracking = useCallback(async () => {
    try {
      const res = await getOrderTracking(orderId);
      setTracking(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchTracking(); }, [fetchTracking]);

  // Auto-poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchTracking, 10000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await simulateTracking(orderId);
      setTracking(res.data);
    } catch (e) { alert(e.response?.data?.message || 'Cannot simulate further'); }
    setSimulating(false);
  };

  if (loading) return <div className="loading">Loading tracking...</div>;
  if (!tracking) return <div className="loading">Order not found</div>;

  const currentCoords = MAP_COORDS[tracking.currentStatus] || MAP_COORDS.PENDING;
  const isDelivered = tracking.currentStatus === 'DELIVERED';

  return (
    <div className="tracking-page">
      {/* Header */}
      <div className="tracking-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>
        <div>
          <h1 className="tracking-order-num">{tracking.orderNumber}</h1>
          <p className="tracking-subtitle">{tracking.retailerName} • {tracking.branchName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="tracking-amount">₹{tracking.totalAmount?.toLocaleString()}</div>
          {!isDelivered && (
            <button className="btn btn-primary btn-sm" onClick={handleSimulate} disabled={simulating}
              style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiPlay /> {simulating ? 'Simulating...' : 'Simulate Next'}
            </button>
          )}
        </div>
      </div>

      {/* Current Status Banner */}
      <div className="tracking-status-banner" style={{
        borderLeft: `4px solid ${STATUS_CONFIG[tracking.currentStatus]?.color || '#8b8fa3'}`,
        background: `${STATUS_CONFIG[tracking.currentStatus]?.color || '#8b8fa3'}11`,
      }}>
        <div className="tracking-status-icon" style={{ color: STATUS_CONFIG[tracking.currentStatus]?.color }}>
          {STATUS_CONFIG[tracking.currentStatus]?.icon}
        </div>
        <div>
          <div className="tracking-status-text">
            {isDelivered ? '🎉 Delivered Successfully!' : `📍 ${STATUS_CONFIG[tracking.currentStatus]?.label}`}
          </div>
          <div className="tracking-status-location">{currentCoords.label}</div>
        </div>
        {tracking.estimatedDelivery && !isDelivered && (
          <div className="tracking-eta">
            <span className="tracking-eta-label">Est. Delivery</span>
            <span className="tracking-eta-date">{new Date(tracking.estimatedDelivery).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="tracking-content">
        {/* Timeline */}
        <div className="tracking-timeline-section">
          <h3 className="tracking-section-title">Tracking Timeline</h3>
          <div className="tracking-timeline-vertical">
            {tracking.timeline?.map((event, i) => {
              const config = STATUS_CONFIG[event.status] || { color: '#8b8fa3', icon: <FiClock />, label: event.status };
              return (
                <div key={i} className={`timeline-entry ${event.isCompleted ? 'completed' : ''} ${event.isCurrent ? 'current' : ''}`}>
                  <div className="timeline-connector">
                    <div className="timeline-dot-v" style={{
                      background: event.isCompleted ? config.color : '#2a2d3e',
                      borderColor: event.isCompleted ? config.color : '#3a3d4e',
                      boxShadow: event.isCurrent ? `0 0 16px ${config.color}88` : 'none',
                    }}>
                      {event.isCompleted ? config.icon : <span style={{ fontSize: '10px', color: '#6b6f83' }}>{i + 1}</span>}
                    </div>
                    {i < (tracking.timeline?.length || 0) - 1 && (
                      <div className="timeline-line-v" style={{ background: event.isCompleted ? config.color : '#2a2d3e' }} />
                    )}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-event-title" style={{ color: event.isCompleted ? '#e8eaed' : '#6b6f83' }}>
                      {config.label}
                    </div>
                    <div className="timeline-event-location">
                      <FiMapPin size={12} /> {event.location}
                    </div>
                    <div className="timeline-event-desc">{event.description}</div>
                    {event.timestamp && (
                      <div className="timeline-event-time">
                        <FiClock size={11} /> {new Date(event.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map Simulation */}
        <div className="tracking-map-section">
          <h3 className="tracking-section-title">📍 Live Location</h3>
          <div className="tracking-map">
            {/* Simulated map with route markers */}
            <div className="map-bg">
              {Object.entries(MAP_COORDS).map(([status, coords], i) => {
                const config = STATUS_CONFIG[status] || {};
                const completed = tracking.timeline?.find(e => e.status === status)?.isCompleted;
                const isCurrent = tracking.currentStatus === status;
                const topPct = 10 + (i * 10);
                const leftPct = 10 + (i * 10);
                return (
                  <div key={status} className={`map-marker ${completed ? 'active' : ''} ${isCurrent ? 'current-marker' : ''}`}
                    style={{ top: `${topPct}%`, left: `${leftPct}%` }}>
                    <div className="map-marker-dot" style={{
                      background: completed ? config.color : '#2a2d3e',
                      boxShadow: isCurrent ? `0 0 20px ${config.color}cc, 0 0 40px ${config.color}44` : 'none',
                      transform: isCurrent ? 'scale(1.4)' : 'scale(1)',
                    }}>
                      {isCurrent && <span className="map-pulse" style={{ borderColor: config.color }} />}
                    </div>
                    <span className="map-label" style={{ color: completed ? '#e8eaed' : '#4a4d5e' }}>
                      {coords.label.split('—')[0]}
                    </span>
                    {/* Route line */}
                    {i < Object.keys(MAP_COORDS).length - 1 && completed && (
                      <div className="map-route" style={{ background: config.color }} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="map-legend">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b8fa3', fontSize: '0.78rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f8cff' }} /> Completed
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a2d3e', marginLeft: 12 }} /> Upcoming
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
