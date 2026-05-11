import React, { useState, useEffect } from 'react';
import { getAllRetailers, approveRetailer, rejectRetailer } from '../services/api';
import { FiCheck, FiX } from 'react-icons/fi';

const Retailers = () => {
    const [retailers, setRetailers] = useState([]);
    const [tab, setTab] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);
    const fetchData = async () => { try { const res = await getAllRetailers(); setRetailers(res.data); } catch (e) { } setLoading(false); };

    const handleApprove = async (id) => { try { await approveRetailer(id); fetchData(); } catch (e) { alert('Error'); } };
    const handleReject = async (id) => { if (window.confirm('Reject?')) { try { await rejectRetailer(id); fetchData(); } catch (e) { alert('Error'); } } };

    const filtered = tab === 'pending' ? retailers.filter(r => r.approvalStatus === 'PENDING') : retailers;
    const pendingCount = retailers.filter(r => r.approvalStatus === 'PENDING').length;

    if (loading) return <div className="loading">Loading retailers...</div>;
    return (
        <div>
            <div className="page-header"><h1>Retailer Management</h1></div>
            <div className="tab-nav">
                <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All ({retailers.length})</button>
                <button className={`tab-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
                    Pending {pendingCount > 0 && <span style={{ background: '#fb923c', color: 'white', borderRadius: '10px', padding: '1px 7px', marginLeft: '6px', fontSize: '11px' }}>{pendingCount}</span>}
                </button>
            </div>
            <div className="card">
                <table className="data-table">
                    <thead><tr><th>Name</th><th>Business</th><th>GST</th><th>City</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r.id}>
                                <td><strong>{r.fullName}</strong><div className="text-muted" style={{ fontSize: '12px' }}>{r.email}</div></td>
                                <td>{r.businessName}</td><td className="text-muted">{r.gstNumber || '-'}</td>
                                <td>{r.city}{r.state ? `, ${r.state}` : ''}</td>
                                <td><span className={`status-badge status-${r.approvalStatus?.toLowerCase()}`}>{r.approvalStatus}</span></td>
                                <td className="text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                                <td>
                                    {r.approvalStatus === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.id)}><FiCheck /> Approve</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.id)}><FiX /> Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <div className="empty-state"><p>No retailers found.</p></div>}
            </div>
        </div>
    );
};
export default Retailers;
