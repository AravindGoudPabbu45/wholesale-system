import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDemandForecast, getAnomalies, detectAnomalies, getBranches } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FiAlertTriangle, FiTrendingUp, FiRefreshCw } from 'react-icons/fi';

const Analytics = () => {
    const { user } = useAuth();
    const [forecasts, setForecasts] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(user.branchId || '');
    const [tab, setTab] = useState('forecast');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchBranches(); }, []);
    useEffect(() => { if (selectedBranch) fetchData(); }, [selectedBranch]);

    const fetchBranches = async () => {
        try { const res = await getBranches(); setBranches(res.data); if (!selectedBranch && res.data.length > 0) setSelectedBranch(res.data[0].id); } catch (e) { } setLoading(false);
    };

    const fetchData = async () => {
        try {
            const [forecastRes, anomalyRes] = await Promise.all([getDemandForecast(selectedBranch), getAnomalies(selectedBranch)]);
            setForecasts(forecastRes.data); setAnomalies(anomalyRes.data);
        } catch (e) { } setLoading(false);
    };

    const handleDetect = async () => {
        try { const res = await detectAnomalies(selectedBranch); setAnomalies(res.data); alert(`Found ${res.data.length} anomalies`); } catch (e) { alert('Error'); }
    };

    if (loading) return <div className="loading">Loading analytics...</div>;
    return (
        <div>
            <div className="page-header">
                <h1>AI Business Intelligence</h1>
                <button className="btn btn-primary" onClick={handleDetect}><FiRefreshCw /> Run Anomaly Detection</button>
            </div>

            <div className="filters-bar">
                <select className="filter-select" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>

            <div className="tab-nav">
                <button className={`tab-btn ${tab === 'forecast' ? 'active' : ''}`} onClick={() => setTab('forecast')}><FiTrendingUp style={{ marginRight: '6px' }} /> Demand Forecast</button>
                <button className={`tab-btn ${tab === 'anomalies' ? 'active' : ''}`} onClick={() => setTab('anomalies')}>
                    <FiAlertTriangle style={{ marginRight: '6px' }} /> Anomalies {anomalies.length > 0 && <span style={{ background: '#f87171', color: 'white', borderRadius: '10px', padding: '1px 7px', marginLeft: '6px', fontSize: '11px' }}>{anomalies.length}</span>}
                </button>
            </div>

            {tab === 'forecast' && (
                <>
                    {forecasts.length > 0 && (
                        <div className="chart-card mb-4">
                            <h3>30-Day Demand Forecast</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={forecasts}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                                    <XAxis dataKey="productName" stroke="#8b8fa3" fontSize={11} angle={-25} textAnchor="end" height={60} />
                                    <YAxis stroke="#8b8fa3" fontSize={12} />
                                    <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#e8eaed' }} />
                                    <Bar dataKey="forecastedDemand30Days" name="Forecast" radius={[6, 6, 0, 0]}>
                                        {forecasts.map((f, i) => <Cell key={i} fill={f.needsReorder ? '#f87171' : '#4f8cff'} />)}
                                    </Bar>
                                    <Bar dataKey="currentStock" name="Current Stock" fill="#34d399" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    <div className="card">
                        <table className="data-table">
                            <thead><tr><th>Product</th><th>Avg Daily Sales</th><th>30-Day Forecast</th><th>Current Stock</th><th>Reorder Qty</th><th>Status</th></tr></thead>
                            <tbody>
                                {forecasts.map(f => (
                                    <tr key={f.productId}>
                                        <td><strong>{f.productName}</strong></td>
                                        <td>{f.averageDailySales}</td>
                                        <td style={{ fontWeight: 600 }}>{f.forecastedDemand30Days}</td>
                                        <td style={{ color: f.needsReorder ? '#f87171' : '#34d399', fontWeight: 600 }}>{f.currentStock}</td>
                                        <td>{f.reorderSuggestion}</td>
                                        <td>{f.needsReorder ? <span className="status-badge status-cancelled">⚠️ Reorder Needed</span> : <span className="status-badge status-delivered">✅ Adequate</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {forecasts.length === 0 && <div className="empty-state"><p>No forecast data. Stock movements are needed for analysis.</p></div>}
                    </div>
                </>
            )}

            {tab === 'anomalies' && (
                <div className="card">
                    {anomalies.length === 0 ? (
                        <div className="empty-state"><div className="empty-icon">✅</div><p>No anomalies detected. All operations are normal.</p></div>
                    ) : (
                        <table className="data-table">
                            <thead><tr><th>Product</th><th>Daily Avg</th><th>Actual</th><th>Deviation</th><th>Severity</th><th>Detected</th></tr></thead>
                            <tbody>
                                {anomalies.map((a, i) => (
                                    <tr key={i}>
                                        <td><strong style={{ color: '#f87171' }}>{a.productName}</strong></td>
                                        <td>{a.dailyAverage?.toFixed(1)}</td>
                                        <td style={{ fontWeight: 700, color: '#f87171' }}>{a.actualDeduction?.toFixed(1)}</td>
                                        <td style={{ color: '#fb923c' }}>{a.dailyAverage > 0 ? ((a.actualDeduction / a.dailyAverage) * 100).toFixed(0) : '-'}%</td>
                                        <td><span className={`status-badge ${a.severity === 'CRITICAL' ? 'status-cancelled' : 'status-pending'}`}>{a.severity}</span></td>
                                        <td className="text-muted">{a.detectedAt ? new Date(a.detectedAt).toLocaleString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};
export default Analytics;
