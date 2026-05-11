import React, { useState, useEffect, useRef } from 'react';
import { getNotifications, getUnreadNotifCount, markNotifRead, markAllNotifsRead } from '../services/api';
import { FiBell, FiCheck, FiCheckCircle, FiPackage, FiDollarSign, FiTruck, FiAlertTriangle, FiCpu } from 'react-icons/fi';

const ICON_MAP = {
  ORDER: <FiPackage />,
  STOCK: <FiAlertTriangle />,
  PAYMENT: <FiDollarSign />,
  DELIVERY: <FiTruck />,
  PROCUREMENT: <FiCpu />,
  SYSTEM: <FiCheckCircle />,
};

const COLOR_MAP = {
  ORDER: '#4f8cff',
  STOCK: '#f87171',
  PAYMENT: '#34d399',
  DELIVERY: '#a855f7',
  PROCUREMENT: '#fb923c',
  SYSTEM: '#8b8fa3',
};

/**
 * NotificationBell — dropdown bell icon with unread count badge.
 * Auto-polls every 30s for new notifications.
 */
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchData = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([getNotifications(), getUnreadNotifCount()]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try { await markNotifRead(id); fetchData(); } catch {}
  };

  const handleMarkAllRead = async () => {
    try { await markAllNotifsRead(); fetchData(); } catch {}
  };

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#8b8fa3', fontSize: '20px', position: 'relative',
          padding: '8px', borderRadius: '8px', transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.target.style.color = '#e8eaed'}
        onMouseLeave={e => e.target.style.color = '#8b8fa3'}
      >
        <FiBell />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            background: '#ef4444', color: '#fff', borderRadius: '50%',
            width: '18px', height: '18px', fontSize: '10px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #1c1e2e',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '8px',
          width: '380px', maxHeight: '480px', overflowY: 'auto',
          background: '#1c1e2e', border: '1px solid #2a2d3e',
          borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderBottom: '1px solid #2a2d3e',
          }}>
            <span style={{ fontWeight: 700, color: '#e8eaed', fontSize: '0.95rem' }}>
              Notifications {unreadCount > 0 && <span style={{ color: '#4f8cff' }}>({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{
                background: 'transparent', border: 'none', color: '#4f8cff',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <FiCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8b8fa3' }}>
              <FiBell size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                style={{
                  display: 'flex', gap: '12px', padding: '14px 20px',
                  borderBottom: '1px solid #2a2d3e22', cursor: 'pointer',
                  background: n.isRead ? 'transparent' : 'rgba(79,140,255,0.05)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#2a2d3e44'}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(79,140,255,0.05)'}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${COLOR_MAP[n.type] || '#8b8fa3'}22`,
                  color: COLOR_MAP[n.type] || '#8b8fa3', fontSize: '16px',
                }}>
                  {ICON_MAP[n.type] || <FiBell />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: n.isRead ? 500 : 700, color: '#e8eaed',
                    fontSize: '0.85rem', marginBottom: '2px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {n.title}
                  </div>
                  <div style={{
                    color: '#8b8fa3', fontSize: '0.78rem',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {n.message}
                  </div>
                  <div style={{ color: '#6b6f83', fontSize: '0.72rem', marginTop: '4px' }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                {!n.isRead && (
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#4f8cff', flexShrink: 0, marginTop: '6px',
                  }} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
