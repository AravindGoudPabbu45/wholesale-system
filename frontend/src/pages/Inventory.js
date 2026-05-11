import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInventoryByBranch, getLowStockByBranch, getAllLowStock, getBranches, getStockMovements } from '../services/api';
import { FiAlertTriangle, FiActivity, FiPackage, FiCheckCircle, FiSearch, FiBox, FiEdit, FiPlusCircle } from 'react-icons/fi';
import { adjustStock, updateThreshold } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/**
 * Inventory page – Branch-level stock tracking with Stock View, Low Stock alerts,
 * and Stock Movements tabs.
 */
const Inventory = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('stock');
    const [stock, setStock] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [movements, setMovements] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(user.branchId || '');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');
    const [adjustModal, setAdjustModal] = useState(null);
    const [thresholdModal, setThresholdModal] = useState(null);
    const [adjustQty, setAdjustQty] = useState(0);
    const [adjustReason, setAdjustReason] = useState('');
    const [newThreshold, setNewThreshold] = useState(0);

    useEffect(() => { fetchBranches(); }, []);
    useEffect(() => { if (selectedBranch) fetchBranchData(selectedBranch); }, [selectedBranch]);

    const fetchBranches = async () => {
        try {
            const res = await getBranches();
            setBranches(res.data);
            if (!selectedBranch && res.data.length > 0) setSelectedBranch(res.data[0].id);
            if (user.role === 'SUPER_ADMIN') {
                const lowRes = await getAllLowStock();
                setLowStock(lowRes.data);
            }
        } catch (e) { }
        setLoading(false);
    };

    const fetchBranchData = async (branchId) => {
        try {
            const [stockRes, lowRes, movRes] = await Promise.all([
                getInventoryByBranch(branchId),
                getLowStockByBranch(branchId),
                getStockMovements(branchId).catch(() => ({ data: [] }))
            ]);
            setStock(stockRes.data);
            setLowStock(lowRes.data);
            setMovements(movRes.data || []);
        } catch (e) { }
    };

    const handleAdjustStock = async () => {
        if (!adjustModal) return;
        try {
            await adjustStock({ productId: adjustModal.productId, branchId: selectedBranch, quantity: parseInt(adjustQty), reason: adjustReason });
            setAdjustModal(null); setAdjustQty(0); setAdjustReason('');
            fetchBranchData(selectedBranch);
        } catch (e) { alert(e.response?.data?.message || 'Error adjusting stock'); }
    };

    const handleUpdateThreshold = async () => {
        if (!thresholdModal) return;
        try {
            await updateThreshold(thresholdModal.productId, { productId: thresholdModal.productId, thresholdLevel: parseInt(newThreshold) });
            setThresholdModal(null); setNewThreshold(0);
            fetchBranchData(selectedBranch);
        } catch (e) { alert(e.response?.data?.message || 'Error updating threshold'); }
    };

    // Stats
    const totalItems = stock.reduce((s, i) => s + (i.quantity || 0), 0);
    const lowCount = lowStock.length;
    const healthyCount = stock.filter(s => !s.isLowStock).length;

    // Filter & sort stock
    const filteredStock = stock.filter(s =>
        !search || s.productName?.toLowerCase().includes(search.toLowerCase()) || s.sku?.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase())
    );

    const sortedStock = [...filteredStock].sort((a, b) => {
        switch (sortBy) {
            case 'name-asc': return (a.productName || '').localeCompare(b.productName || '');
            case 'name-desc': return (b.productName || '').localeCompare(a.productName || '');
            case 'qty-high': return (b.quantity || 0) - (a.quantity || 0);
            case 'qty-low': return (a.quantity || 0) - (b.quantity || 0);
            case 'category': return (a.category || '').localeCompare(b.category || '');
            case 'status-low': return (a.isLowStock === b.isLowStock ? 0 : a.isLowStock ? -1 : 1);
            default: return 0;
        }
    });

    if (loading) return <div className="loading">Loading inventory...</div>;

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <h1>Inventory & Stock</h1>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card kpi-blue">
                    <div className="kpi-icon"><FiBox /></div>
                    <div className="kpi-value">{totalItems.toLocaleString()}</div>
                    <div className="kpi-label">Total Stock Units</div>
                </div>
                <div className="kpi-card kpi-purple">
                    <div className="kpi-icon"><FiPackage /></div>
                    <div className="kpi-value">{stock.length}</div>
                    <div className="kpi-label">Products Tracked</div>
                </div>
                <div className="kpi-card kpi-green">
                    <div className="kpi-icon"><FiCheckCircle /></div>
                    <div className="kpi-value">{healthyCount}</div>
                    <div className="kpi-label">Healthy Stock</div>
                </div>
                <div className="kpi-card kpi-red">
                    <div className="kpi-icon"><FiAlertTriangle /></div>
                    <div className="kpi-value">{lowCount}</div>
                    <div className="kpi-label">Low Stock Alerts</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-nav">
                <button className={`tab-btn ${tab === 'stock' ? 'active' : ''}`} onClick={() => setTab('stock')}>📦 Stock Levels</button>
                <button className={`tab-btn ${tab === 'low-stock' ? 'active' : ''}`} onClick={() => setTab('low-stock')}>
                    ⚠ Low Stock {lowCount > 0 && <span style={{ background: '#f87171', color: 'white', borderRadius: '10px', padding: '1px 7px', marginLeft: '6px', fontSize: '11px' }}>{lowCount}</span>}
                </button>
                <button className={`tab-btn ${tab === 'movements' ? 'active' : ''}`} onClick={() => setTab('movements')}>📋 Stock Movements</button>
            </div>

            {/* Branch Selector + Filters */}
            <div className="filters-bar">
                <select className="filter-select" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={{ minWidth: '200px' }}>
                    {branches.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {tab === 'stock' && (
                    <>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <FiSearch style={{ position: 'absolute', left: 12, top: 10, color: '#8b8fa3' }} />
                            <input className="form-input" placeholder="Search products..." value={search}
                                onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                        </div>
                        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <optgroup label="Name">
                                <option value="name-asc">Name A → Z</option>
                                <option value="name-desc">Name Z → A</option>
                            </optgroup>
                            <optgroup label="Quantity">
                                <option value="qty-high">Qty: High → Low</option>
                                <option value="qty-low">Qty: Low → High</option>
                            </optgroup>
                            <optgroup label="Other">
                                <option value="category">Category A → Z</option>
                                <option value="status-low">Low Stock First</option>
                            </optgroup>
                        </select>
                    </>
                )}
            </div>

            {/* Stock Levels Tab */}
            {tab === 'stock' && (
                <>
                    {/* Results count */}
                    <div style={{ fontSize: '13px', color: '#8b8fa3', marginBottom: '12px', fontWeight: 500 }}>
                        Showing {sortedStock.length} of {stock.length} items
                        · Branch: <span style={{ color: '#4f8cff' }}>{branches.find(b => String(b.id) === String(selectedBranch))?.name}</span>
                    </div>

                    {/* Bar Chart */}
                    {stock.length > 0 && (
                        <div className="chart-card" style={{ marginBottom: 20 }}>
                            <h3>Stock Levels by Product</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stock.slice(0, 15)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                                    <XAxis dataKey="productName" stroke="#8b8fa3" fontSize={11} angle={-25} textAnchor="end" height={60} />
                                    <YAxis stroke="#8b8fa3" fontSize={12} />
                                    <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#e8eaed' }} />
                                    <Bar dataKey="quantity" radius={[6, 6, 0, 0]}>
                                        {stock.map((item, i) => <Cell key={i} fill={item.isLowStock ? '#f87171' : '#4f8cff'} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Stock Table */}
                    <div className="card">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Category</th>
                                    <th>Quantity</th>
                                    <th>Threshold</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStock.map(s => (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                                                    background: s.isLowStock ? 'rgba(248, 113, 113, 0.12)' : 'rgba(79, 140, 255, 0.12)',
                                                    color: s.isLowStock ? '#f87171' : '#4f8cff'
                                                }}>
                                                    {s.isLowStock ? <FiAlertTriangle /> : <FiPackage />}
                                                </div>
                                                <strong style={{ fontSize: '14px' }}>{s.productName}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#8b8fa3', background: '#161822', padding: '3px 8px', borderRadius: '4px' }}>{s.sku}</span>
                                        </td>
                                        <td>
                                            <span style={{ padding: '4px 10px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>{s.category || '—'}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, fontSize: '15px', color: s.isLowStock ? '#f87171' : '#34d399' }}>{s.quantity}</span>
                                        </td>
                                        <td style={{ color: '#8b8fa3' }}>{s.thresholdLevel}</td>
                                        <td>
                                            {s.isLowStock
                                                ? <span className="status-badge status-cancelled" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FiAlertTriangle /> Low Stock</span>
                                                : <span className="status-badge status-delivered">Healthy</span>
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button className="btn btn-primary btn-sm" title="Adjust Stock" onClick={() => { setAdjustModal(s); setAdjustQty(0); setAdjustReason(''); }}><FiPlusCircle size={13}/></button>
                                                <button className="btn btn-secondary btn-sm" title="Update Threshold" onClick={() => { setThresholdModal(s); setNewThreshold(s.thresholdLevel); }}><FiEdit size={13}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {sortedStock.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#8b8fa3' }}>No stock data for this branch</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Low Stock Tab */}
            {tab === 'low-stock' && (
                <div className="card">
                    {lowStock.length === 0 ? (
                        <div className="empty-state"><div className="empty-icon">✅</div><p>All stock levels are healthy!</p></div>
                    ) : (
                        <table className="data-table">
                            <thead><tr><th>Product</th><th>Branch</th><th>Current Qty</th><th>Threshold</th><th>Deficit</th><th>Urgency</th></tr></thead>
                            <tbody>
                                {lowStock.map(s => {
                                    const deficit = s.thresholdLevel - s.quantity;
                                    const urgency = deficit > s.thresholdLevel * 0.5 ? 'CRITICAL' : 'WARNING';
                                    return (
                                        <tr key={s.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, background: 'rgba(248, 113, 113, 0.12)', color: '#f87171' }}>
                                                        <FiAlertTriangle />
                                                    </div>
                                                    <strong>{s.productName}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ padding: '4px 10px', background: '#161822', border: '1px solid #2a2d3e', borderRadius: '6px', fontSize: '12px', fontWeight: 500 }}>{s.branchName}</span>
                                            </td>
                                            <td style={{ fontWeight: 700, color: '#f87171', fontSize: '15px' }}>{s.quantity}</td>
                                            <td style={{ color: '#8b8fa3' }}>{s.thresholdLevel}</td>
                                            <td style={{ fontWeight: 600, color: '#fb923c' }}>{deficit} units needed</td>
                                            <td>
                                                <span className={`status-badge ${urgency === 'CRITICAL' ? 'status-cancelled' : 'status-pending'}`}>
                                                    {urgency}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Stock Movements Tab */}
            {tab === 'movements' && (
                <div className="card">
                    {movements.length === 0 ? (
                        <div className="empty-state"><div className="empty-icon">📋</div><p>No stock movements recorded yet</p></div>
                    ) : (
                        <table className="data-table">
                            <thead><tr><th>Product</th><th>Type</th><th>Qty Changed</th><th>Before</th><th>After</th><th>Reference</th><th>By</th><th>Date</th></tr></thead>
                            <tbody>
                                {movements.map(m => (
                                    <tr key={m.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0,
                                                    background: m.changeType === 'ADDITION' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(248, 113, 113, 0.12)',
                                                    color: m.changeType === 'ADDITION' ? '#34d399' : '#f87171'
                                                }}>
                                                    {m.changeType === 'ADDITION' ? '↑' : '↓'}
                                                </div>
                                                <strong>{m.productName}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${m.changeType === 'ADDITION' ? 'status-delivered' : 'status-cancelled'}`}>
                                                {m.changeType === 'ADDITION' ? '+ In' : '− Out'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: m.changeType === 'ADDITION' ? '#34d399' : '#f87171' }}>
                                            {m.changeType === 'ADDITION' ? '+' : '−'}{m.quantityChanged}
                                        </td>
                                        <td style={{ color: '#8b8fa3' }}>{m.quantityBefore}</td>
                                        <td style={{ fontWeight: 600 }}>{m.quantityAfter}</td>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#8b8fa3', background: '#161822', padding: '3px 8px', borderRadius: '4px' }}>{m.referenceType} #{m.referenceId}</span>
                                        </td>
                                        <td>{m.changedByName || '—'}</td>
                                        <td style={{ color: '#8b8fa3', fontSize: '13px' }}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Adjust Stock Modal */}
            {adjustModal && (
                <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h2>Adjust Stock: {adjustModal.productName}</h2>
                            <button className="modal-close" onClick={() => setAdjustModal(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: '#8b8fa3', marginBottom: '16px', fontSize: '0.85rem' }}>
                                Current: <strong style={{ color: '#e8eaed' }}>{adjustModal.quantity}</strong> units
                            </p>
                            <label className="form-label">Quantity (+ to add, − to subtract)</label>
                            <input type="number" className="form-input" value={adjustQty}
                                onChange={e => setAdjustQty(e.target.value)} placeholder="e.g. +50 or -20" />
                            <label className="form-label" style={{ marginTop: '12px' }}>Reason</label>
                            <input className="form-input" value={adjustReason}
                                onChange={e => setAdjustReason(e.target.value)} placeholder="e.g. Damaged goods, Manual restock" />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setAdjustModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAdjustStock} disabled={!adjustQty || adjustQty === '0'}>
                                <FiPlusCircle /> Apply Adjustment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Threshold Modal */}
            {thresholdModal && (
                <div className="modal-overlay" onClick={() => setThresholdModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
                        <div className="modal-header">
                            <h2>Update Threshold: {thresholdModal.productName}</h2>
                            <button className="modal-close" onClick={() => setThresholdModal(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: '#8b8fa3', marginBottom: '16px', fontSize: '0.85rem' }}>
                                Current threshold: <strong style={{ color: '#e8eaed' }}>{thresholdModal.thresholdLevel}</strong>
                            </p>
                            <label className="form-label">New Threshold Level</label>
                            <input type="number" min="0" className="form-input" value={newThreshold}
                                onChange={e => setNewThreshold(e.target.value)} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setThresholdModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleUpdateThreshold}>
                                <FiEdit /> Update Threshold
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
