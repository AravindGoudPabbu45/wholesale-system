import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrdersByBranch, getMyOrders, placeOrder, updateOrderStatus, getProducts, getBranches } from '../services/api';
import { FiPlus, FiEye, FiCheck, FiX, FiTruck, FiPackage, FiMapPin, FiNavigation } from 'react-icons/fi';

const Orders = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(user.branchId || '');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orderForm, setOrderForm] = useState({ branchId: '', notes: '', items: [{ productId: '', quantity: 1 }] });

    useEffect(() => { fetchInit(); }, []);
    useEffect(() => { if (selectedBranch && user.role !== 'RETAILER') fetchOrders(); }, [selectedBranch]);

    const fetchInit = async () => {
        try {
            const [prodRes, branchRes] = await Promise.all([getProducts(), getBranches()]);
            setProducts(prodRes.data); setBranches(branchRes.data);
            if (!selectedBranch && branchRes.data.length > 0 && user.role !== 'RETAILER') setSelectedBranch(branchRes.data[0].id);
            if (user.role === 'RETAILER') { const res = await getMyOrders(); setOrders(res.data); }
        } catch (e) { } setLoading(false);
    };

    const fetchOrders = async () => {
        try { const res = await getOrdersByBranch(selectedBranch); setOrders(res.data); } catch (e) { }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        try {
            await placeOrder({ branchId: parseInt(orderForm.branchId), notes: orderForm.notes, items: orderForm.items.map(i => ({ productId: parseInt(i.productId), quantity: parseInt(i.quantity) })) });
            setShowModal(false); setOrderForm({ branchId: '', notes: '', items: [{ productId: '', quantity: 1 }] });
            if (user.role === 'RETAILER') { const res = await getMyOrders(); setOrders(res.data); } else fetchOrders();
        } catch (e) { alert(e.response?.data?.message || 'Error placing order'); }
    };

    const handleStatusUpdate = async (orderId, status) => {
        try {
            await updateOrderStatus(orderId, { status, remarks: `Status updated to ${status}` });
            fetchOrders();
        } catch (e) { alert(e.response?.data?.message || 'Error'); }
    };

    const addItem = () => setOrderForm({ ...orderForm, items: [...orderForm.items, { productId: '', quantity: 1 }] });
    const removeItem = (i) => setOrderForm({ ...orderForm, items: orderForm.items.filter((_, idx) => idx !== i) });
    const updateItem = (i, field, val) => { const items = [...orderForm.items]; items[i][field] = val; setOrderForm({ ...orderForm, items }); };

    const filtered = statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter);
    const statuses = ['ALL', 'PENDING', 'APPROVED', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'NEARBY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

    const getStatusActions = (order) => {
        if (user.role === 'RETAILER') return null;
        const actions = [];
        if (order.status === 'PENDING') {
            actions.push(<button key="a" className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(order.id, 'APPROVED')}><FiCheck /> Approve</button>);
            actions.push(<button key="c" className="btn btn-danger btn-sm" onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}><FiX /> Cancel</button>);
        }
        if (order.status === 'APPROVED') actions.push(<button key="p" className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order.id, 'PACKED')}><FiPackage /> Pack</button>);
        if (order.status === 'PACKED') actions.push(<button key="s" className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}><FiTruck /> Ship</button>);
        if (order.status === 'SHIPPED') actions.push(<button key="t" className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order.id, 'IN_TRANSIT')}><FiTruck /> In Transit</button>);
        if (order.status === 'IN_TRANSIT') actions.push(<button key="n" className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order.id, 'NEARBY')}><FiMapPin /> Nearby</button>);
        if (order.status === 'NEARBY') actions.push(<button key="o" className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order.id, 'OUT_FOR_DELIVERY')}><FiNavigation /> Out for Delivery</button>);
        if (order.status === 'OUT_FOR_DELIVERY') actions.push(<button key="d" className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}><FiCheck /> Delivered</button>);
        // Track button for any shipped+ order
        if (['SHIPPED', 'IN_TRANSIT', 'NEARBY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) {
            actions.push(<button key="track" className="btn btn-secondary btn-sm" onClick={() => navigate(`/tracking/${order.id}`)} style={{ gap: '4px', display: 'flex', alignItems: 'center' }}><FiMapPin /> Track</button>);
        }
        return <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{actions}</div>;
    };

    if (loading) return <div className="loading">Loading orders...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>{user.role === 'RETAILER' ? 'My Orders' : 'Order Management'}</h1>
                {user.role === 'RETAILER' && <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> Place Order</button>}
            </div>

            <div className="filters-bar">
                {user.role !== 'RETAILER' && (
                    <select className="filter-select" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                )}
                <div className="tab-nav" style={{ marginBottom: 0 }}>
                    {statuses.map(s => <button key={s} className={`tab-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s === 'ALL' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}</button>)}
                </div>
            </div>

            <div className="card">
                <table className="data-table">
                    <thead><tr><th>Order #</th><th>{user.role === 'RETAILER' ? 'Branch' : 'Retailer'}</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(o => (
                            <tr key={o.id}>
                                <td style={{ fontWeight: 700, color: '#4f8cff' }}>{o.orderNumber}</td>
                                <td>{user.role === 'RETAILER' ? o.branchName : <><strong>{o.retailerName}</strong><div className="text-muted" style={{ fontSize: '12px' }}>{o.businessName}</div></>}</td>
                                <td>{o.items?.length || 0} items</td>
                                <td style={{ fontWeight: 600 }}>₹{o.totalAmount?.toLocaleString()}</td>
                                <td><span className={`status-badge status-${o.status?.toLowerCase()}`}>{o.status}</span></td>
                                <td className="text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setShowDetail(o)}><FiEye /></button>
                                        {getStatusActions(o)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <div className="empty-state"><p>No orders found.</p></div>}
            </div>

            {/* Order Detail Modal */}
            {showDetail && (
                <div className="modal-overlay" onClick={() => setShowDetail(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Order {showDetail.orderNumber}</h2><button className="modal-close" onClick={() => setShowDetail(null)}>×</button></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            <div><span className="text-muted">Status:</span> <span className={`status-badge status-${showDetail.status?.toLowerCase()}`}>{showDetail.status}</span></div>
                            <div><span className="text-muted">Total:</span> <strong>₹{showDetail.totalAmount?.toLocaleString()}</strong></div>
                            <div><span className="text-muted">{user.role === 'RETAILER' ? 'Branch' : 'Retailer'}:</span> {user.role === 'RETAILER' ? showDetail.branchName : showDetail.retailerName}</div>
                            <div><span className="text-muted">Date:</span> {new Date(showDetail.createdAt).toLocaleString()}</div>
                        </div>
                        <h4 style={{ marginBottom: '12px' }}>Order Items</h4>
                        <table className="data-table">
                            <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                            <tbody>
                                {showDetail.items?.map(item => (
                                    <tr key={item.id}><td>{item.productName}</td><td className="text-muted">{item.sku}</td><td>{item.quantity}</td><td>₹{item.unitPrice}</td><td>₹{item.totalPrice}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Place Order Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header"><h2>Place New Order</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
                        <form onSubmit={handlePlaceOrder}>
                            <div className="form-group"><label>Branch *</label>
                                <select className="form-input" value={orderForm.branchId} onChange={e => setOrderForm({ ...orderForm, branchId: e.target.value })} required>
                                    <option value="">Select Branch</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <h4 style={{ marginBottom: '12px' }}>Order Items</h4>
                            {orderForm.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 2 }}><label className="text-muted" style={{ fontSize: '12px' }}>Product</label>
                                        <select className="form-input" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required>
                                            <option value="">Select</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}><label className="text-muted" style={{ fontSize: '12px' }}>Qty</label>
                                        <input className="form-input" type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required />
                                    </div>
                                    {orderForm.items.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>×</button>}
                                </div>
                            ))}
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginBottom: '16px' }}><FiPlus /> Add Item</button>
                            <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={orderForm.notes} onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })} /></div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Place Order</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
