import React, { useState, useEffect } from 'react';
import { getAllRetailers, getPendingRetailers, approveRetailer, rejectRetailer } from '../services/api';
import { FiCheck, FiX, FiUserCheck, FiUsers, FiTruck, FiSearch, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import API from '../services/api';

/**
 * Business Partners — unified view for Retailers & Suppliers.
 * Toggle between viewing retailers/suppliers with dropdown.
 */
const BusinessPartners = () => {
  const [partnerType, setPartnerType] = useState('retailers');
  const [retailers, setRetailers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [retRes, supRes] = await Promise.all([
        getAllRetailers(),
        API.get('/procurement').then(res => {
          // Extract unique suppliers from procurement data
          const supMap = {};
          res.data.forEach(po => {
            if (po.supplierId && !supMap[po.supplierId]) {
              supMap[po.supplierId] = {
                id: po.supplierId, name: po.supplierName, businessName: po.supplierBusinessName || po.supplierName,
                gstNumber: po.supplierGst || '—', city: po.supplierCity || '—', status: 'ACTIVE',
              };
            }
          });
          return Object.values(supMap);
        }).catch(() => [])
      ]);
      setRetailers(retRes.data);
      setSuppliers(supRes);
    } catch {} setLoading(false);
  };

  const handleApprove = async (id) => { try { await approveRetailer(id); fetchData(); } catch { alert('Error'); } };
  const handleReject = async (id) => { if (window.confirm('Reject this retailer?')) { try { await rejectRetailer(id); fetchData(); } catch { alert('Error'); } } };

  const data = partnerType === 'retailers' ? retailers : suppliers;
  const pendingCount = retailers.filter(r => r.approvalStatus === 'PENDING').length;
  const filtered = data.filter(d => {
    const matchesSearch = !search ||
      (d.fullName || d.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.businessName || '').toLowerCase().includes(search.toLowerCase());
    if (partnerType === 'retailers' && tab === 'pending') return matchesSearch && d.approvalStatus === 'PENDING';
    return matchesSearch;
  });

  if (loading) return <div className="loading">Loading partners...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiUsers style={{ color: '#a855f7' }} /> Business Partners
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue" onClick={() => setPartnerType('retailers')} style={{ cursor: 'pointer', border: partnerType === 'retailers' ? '2px solid #4f8cff' : undefined }}>
          <div className="kpi-icon"><FiUserCheck /></div>
          <div className="kpi-value">{retailers.length}</div>
          <div className="kpi-label">Total Retailers</div>
        </div>
        <div className="kpi-card kpi-orange">
          <div className="kpi-icon"><FiCheck /></div>
          <div className="kpi-value">{retailers.filter(r => r.approvalStatus === 'APPROVED').length}</div>
          <div className="kpi-label">Approved Retailers</div>
        </div>
        <div className="kpi-card kpi-purple" style={{ cursor: 'pointer', border: partnerType === 'suppliers' ? '2px solid #a855f7' : undefined }} onClick={() => setPartnerType('suppliers')}>
          <div className="kpi-icon"><FiTruck /></div>
          <div className="kpi-value">{suppliers.length}</div>
          <div className="kpi-label">Active Suppliers</div>
        </div>
        <div className="kpi-card kpi-red">
          <div className="kpi-icon"><FiX /></div>
          <div className="kpi-value">{pendingCount}</div>
          <div className="kpi-label">Pending Approvals</div>
        </div>
      </div>

      {/* Partner Type Toggle */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <select className="form-input" style={{ width: '200px' }} value={partnerType} onChange={e => { setPartnerType(e.target.value); setTab('all'); }}>
          <option value="retailers">🏪 Retailers</option>
          <option value="suppliers">🚚 Suppliers</option>
        </select>
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: 10, color: '#8b8fa3' }} />
          <input className="form-input" placeholder="Search partners..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        {partnerType === 'retailers' && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')} style={{ padding: '6px 16px', borderRadius: '16px', border: '1px solid #2a2d3e', background: tab === 'all' ? '#4f8cff22' : 'transparent', color: tab === 'all' ? '#4f8cff' : '#8b8fa3', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>All ({retailers.length})</button>
            <button className={`tab-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')} style={{ padding: '6px 16px', borderRadius: '16px', border: '1px solid #2a2d3e', background: tab === 'pending' ? '#fb923c22' : 'transparent', color: tab === 'pending' ? '#fb923c' : '#8b8fa3', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
              Pending {pendingCount > 0 && <span style={{ background: '#fb923c', color: '#fff', borderRadius: '10px', padding: '1px 7px', marginLeft: '4px', fontSize: '10px' }}>{pendingCount}</span>}
            </button>
          </div>
        )}
      </div>

      {/* Partners Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {filtered.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px' }}>
            <FiUsers size={40} style={{ color: '#2a2d3e', marginBottom: '12px' }} />
            <p style={{ color: '#8b8fa3' }}>No {partnerType} found</p>
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} style={{
            background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: '16px', padding: '20px',
            transition: 'all 0.3s', display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: partnerType === 'retailers' ? '#4f8cff22' : '#a855f722',
                  color: partnerType === 'retailers' ? '#4f8cff' : '#a855f7', fontSize: '18px',
                }}>
                  {partnerType === 'retailers' ? <FiUserCheck /> : <FiTruck />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#e8eaed', fontSize: '0.95rem' }}>{p.fullName || p.name}</div>
                  <div style={{ color: '#8b8fa3', fontSize: '0.8rem' }}>{p.businessName}</div>
                </div>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                background: (p.approvalStatus === 'APPROVED' || p.status === 'ACTIVE') ? '#34d39922' : p.approvalStatus === 'PENDING' ? '#fb923c22' : '#f8717122',
                color: (p.approvalStatus === 'APPROVED' || p.status === 'ACTIVE') ? '#34d399' : p.approvalStatus === 'PENDING' ? '#fb923c' : '#f87171',
              }}>{p.approvalStatus || p.status}</span>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 0', borderTop: '1px dashed #2a2d3e' }}>
              {p.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b8fa3', fontSize: '0.82rem' }}><FiMail size={14} /> {p.email}</div>}
              {p.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b8fa3', fontSize: '0.82rem' }}><FiPhone size={14} /> {p.phone}</div>}
              {(p.city || p.address) && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b8fa3', fontSize: '0.82rem' }}><FiMapPin size={14} /> {p.city}{p.state ? `, ${p.state}` : ''}</div>}
              {p.gstNumber && <div style={{ fontSize: '0.78rem', color: '#6b6f83', fontFamily: 'monospace' }}>GST: {p.gstNumber}</div>}
            </div>

            {/* Actions */}
            {partnerType === 'retailers' && p.approvalStatus === 'PENDING' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => handleApprove(p.id)}><FiCheck /> Approve</button>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleReject(p.id)}><FiX /> Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessPartners;
