import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllTickets, getTicketsByBranch, getMyTickets, createTicket, updateTicket, getBranches } from '../services/api';
import { FiPlus, FiEdit2 } from 'react-icons/fi';

const Tickets = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [branches, setBranches] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [form, setForm] = useState({ subject: '', description: '', priority: 'MEDIUM', branchId: '' });

    useEffect(() => { fetchData(); }, []);
    const fetchData = async () => {
        try {
            const branchRes = await getBranches(); setBranches(branchRes.data);
            let ticketRes;
            if (user.role === 'RETAILER') ticketRes = await getMyTickets();
            else if (user.branchId) ticketRes = await getTicketsByBranch(user.branchId);
            else ticketRes = await getAllTickets();
            setTickets(ticketRes.data);
        } catch (e) { } setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try { await createTicket({ ...form, branchId: form.branchId ? parseInt(form.branchId) : null }); setShowModal(false); fetchData(); } catch (e) { alert('Error'); }
    };

    const handleStatusUpdate = async (id, status) => {
        try { await updateTicket(id, { status }); fetchData(); } catch (e) { alert('Error'); }
    };

    const filtered = statusFilter === 'ALL' ? tickets : tickets.filter(t => t.status === statusFilter);
    const statuses = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

    if (loading) return <div className="loading">Loading tickets...</div>;
    return (
        <div>
            <div className="page-header">
                <h1>{user.role === 'RETAILER' ? 'My Support Tickets' : 'Support Tickets'}</h1>
                {user.role === 'RETAILER' && <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> New Ticket</button>}
            </div>
            <div className="tab-nav">
                {statuses.map(s => <button key={s} className={`tab-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s.replace('_', ' ')} ({s === 'ALL' ? tickets.length : tickets.filter(t => t.status === s).length})</button>)}
            </div>
            <div className="card">
                <table className="data-table">
                    <thead><tr><th>Ticket #</th><th>{user.role === 'RETAILER' ? 'Branch' : 'Retailer'}</th><th>Subject</th><th>Priority</th><th>Status</th><th>Date</th>{user.role !== 'RETAILER' && <th>Actions</th>}</tr></thead>
                    <tbody>
                        {filtered.map(t => (
                            <tr key={t.id}>
                                <td style={{ fontWeight: 700, color: '#4f8cff' }}>{t.ticketNumber}</td>
                                <td>{user.role === 'RETAILER' ? t.branchName : t.retailerName}</td>
                                <td><strong>{t.subject}</strong>{t.description && <div className="text-muted" style={{ fontSize: '12px' }}>{t.description.substring(0, 60)}...</div>}</td>
                                <td><span className={`priority-${t.priority?.toLowerCase()}`} style={{ fontWeight: 600 }}>{t.priority}</span></td>
                                <td><span className={`status-badge status-${t.status?.toLowerCase().replace(' ', '_')}`}>{t.status?.replace('_', ' ')}</span></td>
                                <td className="text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                                {user.role !== 'RETAILER' && (
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {t.status === 'OPEN' && <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(t.id, 'IN_PROGRESS')}>Assign</button>}
                                            {t.status === 'IN_PROGRESS' && <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(t.id, 'RESOLVED')}>Resolve</button>}
                                            {t.status === 'RESOLVED' && <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate(t.id, 'CLOSED')}>Close</button>}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <div className="empty-state"><p>No tickets found.</p></div>}
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>New Support Ticket</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group"><label>Branch</label><select className="form-input" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}><option value="">Select</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                            <div className="form-group"><label>Subject *</label><input className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required /></div>
                            <div className="form-group"><label>Priority</label><select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></div>
                            <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Ticket</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Tickets;
