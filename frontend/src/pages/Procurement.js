import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllProcurement, getProcurementByBranch, createProcurement, updateProcurementStatus, getProducts, getBranches } from '../services/api';
import { FiPlus, FiTruck, FiCheck } from 'react-icons/fi';

const Procurement = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [form, setForm] = useState({ branchId: '', supplierId: '1', productId: '', quantity: '', expectedDate: '', notes: '' });

    useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const fetchData = async () => {
        try {
            const [prodRes, branchRes] = await Promise.all([getProducts(), getBranches()]);
            setProducts(prodRes.data); setBranches(branchRes.data);
            const poRes = user.branchId ? await getProcurementByBranch(user.branchId) : await getAllProcurement();
            setOrders(poRes.data);
        } catch (e) { } setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createProcurement({ ...form, branchId: parseInt(form.branchId), supplierId: parseInt(form.supplierId), productId: parseInt(form.productId), quantity: parseInt(form.quantity) });
            setShowModal(false); fetchData();
        } catch (e) { alert(e.response?.data?.message || 'Error'); }
    };

    const handleStatus = async (id, status) => {
        try { await updateProcurementStatus(id, status); fetchData(); } catch (e) { alert('Error'); }
    };

    const filtered = statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter);
    const statuses = ['ALL', 'REQUESTED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

    if (loading) return <div className="loading">Loading procurement...</div>;
    return (
        <div>
            <div className="page-header">
                <h1>Procurement Orders</h1>
                {(user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN' || user.role === 'EMPLOYEE') && (
                    <button className="btn btn-primary" onClick={() => { setForm({ branchId: user.branchId || '', supplierId: '1', productId: '', quantity: '', expectedDate: '', notes: '' }); setShowModal(true); }}><FiPlus /> New Order</button>
                )}
            </div>
            <div className="tab-nav">
                {statuses.map(s => <button key={s} className={`tab-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s === 'ALL' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}</button>)}
            </div>
            <div className="card">
                <table className="data-table">
                    <thead><tr><th>ID</th><th>Branch</th><th>Supplier</th><th>Product</th><th>Qty</th><th>Status</th><th>Expected</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(po => (
                            <tr key={po.id}>
                                <td style={{ fontWeight: 700 }}>PO-{po.id}</td><td>{po.branchName}</td><td>{po.supplierName}</td>
                                <td><strong>{po.productName}</strong><div className="text-muted" style={{ fontSize: '12px' }}>{po.sku}</div></td>
                                <td>{po.quantity}</td>
                                <td><span className={`status-badge status-${po.status?.toLowerCase()}`}>{po.status}</span></td>
                                <td className="text-muted">{po.expectedDate}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {po.status === 'REQUESTED' && <button className="btn btn-primary btn-sm" onClick={() => handleStatus(po.id, 'CONFIRMED')}><FiCheck /> Confirm</button>}
                                        {po.status === 'CONFIRMED' && <button className="btn btn-primary btn-sm" onClick={() => handleStatus(po.id, 'SHIPPED')}><FiTruck /> Ship</button>}
                                        {po.status === 'SHIPPED' && <button className="btn btn-success btn-sm" onClick={() => handleStatus(po.id, 'DELIVERED')}><FiCheck /> Delivered</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <div className="empty-state"><p>No procurement orders.</p></div>}
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>New Procurement Order</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group"><label>Branch *</label><select className="form-input" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} required><option value="">Select</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                                <div className="form-group"><label>Product *</label><select className="form-input" value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} required><option value="">Select</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                <div className="form-group"><label>Quantity *</label><input className="form-input" type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required /></div>
                                <div className="form-group"><label>Expected Date</label><input className="form-input" type="date" value={form.expectedDate} onChange={e => setForm({ ...form, expectedDate: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Order</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Procurement;
