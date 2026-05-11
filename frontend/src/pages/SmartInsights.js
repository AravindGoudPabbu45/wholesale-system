import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkeletonStats, SkeletonTable } from '../components/SkeletonLoader';
import API from '../services/api';
import { FiAlertTriangle, FiTrendingUp, FiTrendingDown, FiCheckCircle, FiPackage, FiCpu, FiRefreshCw } from 'react-icons/fi';
import './SmartInsights.css';

/**
 * Smart Insights Dashboard — AI-powered inventory intelligence.
 * Visually flags overstocked/understocked items and enables one-click procurement approval.
 */
const SmartInsights = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [forecast, setForecast] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(user?.branchId || '');
    const [branches, setBranches] = useState([]);
    const [applying, setApplying] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());

    const fetchBranches = useCallback(async () => {
        try {
            const res = await API.get('/branches');
            setBranches(res.data.filter(b => b.isActive));
            if (!selectedBranch && res.data.length > 0) {
                setSelectedBranch(res.data[0].id);
            }
        } catch { /* ignore */ }
    }, [selectedBranch]);

    const fetchInsights = useCallback(async () => {
        if (!selectedBranch) return;
        setLoading(true);
        try {
            const [forecastRes, reorderRes] = await Promise.all([
                API.get(`/ai/forecast/advanced/${selectedBranch}`),
                API.get(`/ai/reorder-recommendations/${selectedBranch}`)
            ]);
            setForecast(forecastRes.data);
            setRecommendations(reorderRes.data || []);
        } catch (err) {
            console.error('Failed to load insights:', err);
            // Show empty state if AI endpoints aren't available yet
            setForecast(null);
            setRecommendations([]);
        }
        setLoading(false);
    }, [selectedBranch]);

    useEffect(() => { fetchBranches(); }, [fetchBranches]);
    useEffect(() => { if (selectedBranch) fetchInsights(); }, [selectedBranch, fetchInsights]);

    const handleApplyAll = async () => {
        if (!selectedBranch) return;
        setApplying(true);
        try {
            await API.post(`/ai/apply-recommendations/${selectedBranch}`);
            showToast('AI recommendations applied successfully!', 'success');
            fetchInsights();
        } catch (err) {
            showToast('Failed to apply recommendations', 'error');
        }
        setApplying(false);
    };

    const toggleItem = (id) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedItems.size === recommendations.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(recommendations.map((_, i) => i)));
        }
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'CRITICAL': return '#ef4444';
            case 'HIGH': return '#f97316';
            case 'MEDIUM': return '#eab308';
            case 'LOW': return '#22c55e';
            default: return '#8b8fa3';
        }
    };

    const getStockStatus = (quantity, threshold) => {
        if (quantity <= 0) return { label: 'Out of Stock', color: '#ef4444', icon: <FiAlertTriangle /> };
        if (quantity <= threshold * 0.5) return { label: 'Critical', color: '#ef4444', icon: <FiTrendingDown /> };
        if (quantity <= threshold) return { label: 'Low Stock', color: '#f97316', icon: <FiTrendingDown /> };
        if (quantity > threshold * 3) return { label: 'Overstocked', color: '#3b82f6', icon: <FiTrendingUp /> };
        return { label: 'Healthy', color: '#22c55e', icon: <FiCheckCircle /> };
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FiCpu style={{ color: '#818cf8' }} /> Smart Insights
                    </h1>
                    <p style={{ color: '#8b8fa3', marginTop: '4px' }}>AI-powered inventory intelligence & demand forecasting</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {user?.role === 'SUPER_ADMIN' && (
                        <select className="form-input" style={{ width: '200px' }} value={selectedBranch}
                            onChange={e => setSelectedBranch(e.target.value)}>
                            <option value="">Select Branch</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    )}
                    <button className="btn btn-secondary" onClick={fetchInsights} title="Refresh">
                        <FiRefreshCw />
                    </button>
                </div>
            </div>

            {loading ? (
                <>
                    <SkeletonStats count={4} />
                    <div style={{ marginTop: '24px' }}><SkeletonTable rows={6} cols={6} /></div>
                </>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Total Products Tracked</div>
                            <div className="stat-value" style={{ color: '#818cf8' }}>
                                {forecast?.totalProducts || recommendations.length || 0}
                            </div>
                            <div className="stat-sublabel">Across this branch</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Items Need Reorder</div>
                            <div className="stat-value" style={{ color: '#ef4444' }}>
                                {recommendations.length}
                            </div>
                            <div className="stat-sublabel">Below threshold</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Critical Items</div>
                            <div className="stat-value" style={{ color: '#f97316' }}>
                                {recommendations.filter(r => r.urgency === 'CRITICAL' || r.urgency === 'HIGH').length}
                            </div>
                            <div className="stat-sublabel">Immediate attention needed</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">AI Confidence</div>
                            <div className="stat-value" style={{ color: '#22c55e' }}>
                                {forecast?.averageConfidence ? `${(forecast.averageConfidence * 100).toFixed(0)}%` : '—'}
                            </div>
                            <div className="stat-sublabel">Forecast reliability</div>
                        </div>
                    </div>

                    {/* Actions Bar */}
                    {recommendations.length > 0 && (
                        <div className="card" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <strong style={{ color: '#fff' }}>🤖 AI Recommendations</strong>
                                <span style={{ color: '#8b8fa3', marginLeft: '8px', fontSize: '0.85rem' }}>
                                    {recommendations.length} items need restocking based on demand analysis
                                </span>
                            </div>
                            <button className="btn btn-primary" onClick={handleApplyAll} disabled={applying}
                                style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', gap: '8px', display: 'flex', alignItems: 'center' }}>
                                <FiCpu /> {applying ? 'Applying...' : 'Apply All AI Recommendations'}
                            </button>
                        </div>
                    )}

                    {/* Reorder Recommendations Grid */}
                    {recommendations.length > 0 ? (
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '0 8px' }}>
                                <input type="checkbox" className="custom-checkbox" 
                                    checked={selectedItems.size === recommendations.length} onChange={toggleAll} />
                                <span style={{ color: '#8b8fa3', fontSize: '0.9rem' }}>Select All {recommendations.length} items</span>
                            </div>
                            <div className="insights-grid">
                                {recommendations.map((rec, idx) => {
                                    const status = getStockStatus(rec.currentStock, rec.reorderPoint || 10);
                                    const urgencyClass = (rec.urgency || '').toLowerCase();
                                    const isSelected = selectedItems.has(idx);

                                    return (
                                        <div key={idx} className={`insight-card ${isSelected ? 'selected' : ''}`} onClick={() => toggleItem(idx)} style={{ cursor: 'pointer' }}>
                                            <div className={`urgency-badge ${urgencyClass}`}>{rec.urgency || 'N/A'}</div>
                                            
                                            <div className="insight-card-header">
                                                <div className="insight-card-title">
                                                    <div className="insight-card-checkbox" onClick={(e) => e.stopPropagation()}>
                                                        <input type="checkbox" className="custom-checkbox" checked={isSelected} onChange={() => toggleItem(idx)} />
                                                    </div>
                                                    <div>
                                                        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '4px' }}>{rec.productName}</h3>
                                                        <span style={{ fontSize: '0.85rem', color: '#8b8fa3', fontFamily: 'monospace' }}>{rec.sku || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="insight-card-metrics">
                                                <div className="metric-box" style={{ borderLeft: `3px solid ${status.color}` }}>
                                                    <span className="metric-label">Current Stock</span>
                                                    <span className="metric-val" style={{ color: status.color }}>{rec.currentStock}</span>
                                                </div>
                                                <div className="metric-box">
                                                    <span className="metric-label">Suggested Qty</span>
                                                    <span className="metric-val" style={{ color: '#818cf8' }}>{rec.suggestedOrderQuantity || rec.eoq || '—'}</span>
                                                </div>
                                            </div>

                                            <div className="insight-card-footer">
                                                <span className="status-pill" style={{ background: `${status.color}22`, color: status.color }}>
                                                    {status.icon} {status.label}
                                                </span>
                                                <span style={{ display: 'flex', gap: '16px' }}>
                                                    <span>⏳ {rec.daysUntilStockout != null ? `${rec.daysUntilStockout} days` : '—'}</span>
                                                    <span>📈 {rec.avgDailyDemand != null ? rec.avgDailyDemand.toFixed(1) : '—'}/day</span>
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ marginTop: '24px', textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
                            <h3 style={{ color: '#fff', marginBottom: '8px' }}>All stock levels are healthy</h3>
                            <p style={{ color: '#8b8fa3' }}>No items currently need reordering based on AI analysis.</p>
                        </div>
                    )}

                    {/* Forecast Details Grid */}
                    {forecast?.forecasts && forecast.forecasts.length > 0 && (
                        <div style={{ marginTop: '32px' }}>
                            <h3 style={{ color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FiPackage style={{ color: '#818cf8' }} /> Product Forecast Details
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                                {forecast.forecasts.slice(0, 12).map((f, i) => (
                                    <div key={i} className="card" style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{f.productName}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#8b8fa3' }}>{f.sku || ''}</div>
                                            </div>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem',
                                                fontWeight: 700, height: 'fit-content',
                                                background: f.trendDirection === 'UP' ? '#22c55e22' : f.trendDirection === 'DOWN' ? '#ef444422' : '#8b8fa322',
                                                color: f.trendDirection === 'UP' ? '#22c55e' : f.trendDirection === 'DOWN' ? '#ef4444' : '#8b8fa3'
                                            }}>
                                                {f.trendDirection === 'UP' ? '↑ Trending Up' : f.trendDirection === 'DOWN' ? '↓ Trending Down' : '→ Stable'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div><span style={{ fontSize: '0.72rem', color: '#8b8fa3' }}>Daily Demand</span><div style={{ fontWeight: 600, color: '#fff' }}>{f.predictedDailyDemand?.toFixed(1) || '—'}</div></div>
                                            <div><span style={{ fontSize: '0.72rem', color: '#8b8fa3' }}>Reorder Point</span><div style={{ fontWeight: 600, color: '#818cf8' }}>{f.optimalReorderPoint || '—'}</div></div>
                                            <div><span style={{ fontSize: '0.72rem', color: '#8b8fa3' }}>EOQ</span><div style={{ fontWeight: 600, color: '#22c55e' }}>{f.economicOrderQuantity || '—'}</div></div>
                                            <div><span style={{ fontSize: '0.72rem', color: '#8b8fa3' }}>Confidence</span><div style={{ fontWeight: 600, color: '#eab308' }}>{f.confidence != null ? `${(f.confidence * 100).toFixed(0)}%` : '—'}</div></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SmartInsights;
