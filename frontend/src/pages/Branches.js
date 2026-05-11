import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBranches, createBranch, updateBranch, deleteBranch, activateBranch, permanentDeleteBranch } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiUser, FiRefreshCw, FiEyeOff, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { V } from '../utils/validators';
import FormField from '../components/FormField';

/**
 * Branch management page - Super Admin can CRUD branches.
 * Active branches shown in main grid, inactive branches in a collapsible section at bottom.
 */
const Branches = () => {
    const { user } = useAuth();
    const [branches, setBranches] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [createdAdmin, setCreatedAdmin] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [confirmPermanentId, setConfirmPermanentId] = useState(null);
    const [errors, setErrors] = useState({});

    const emptyForm = { name: '', location: '', city: '', state: '', pincode: '', contactPhone: '', contactEmail: '', adminUsername: '', adminPassword: '', adminEmail: '', adminFullName: '' };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchBranches(); }, []);
    const fetchBranches = async () => { try { const res = await getBranches(); setBranches(res.data); } catch (e) { } setLoading(false); };

    const activeBranches = branches.filter(b => b.isActive);
    const inactiveBranches = branches.filter(b => !b.isActive);

    const validateForm = () => {
        const errs = {};
        if (V.required(form.name, 'Branch name')) errs.name = V.required(form.name, 'Branch name');
        else if (V.minLength(form.name, 2, 'Branch name')) errs.name = V.minLength(form.name, 2, 'Branch name');
        else if (V.maxLength(form.name, 100, 'Branch name')) errs.name = V.maxLength(form.name, 100, 'Branch name');

        if (V.required(form.location, 'Location')) errs.location = V.required(form.location, 'Location');
        else if (V.minLength(form.location, 3, 'Location')) errs.location = V.minLength(form.location, 3, 'Location');

        if (form.city && V.lettersOnly(form.city, 'City')) errs.city = V.lettersOnly(form.city, 'City');
        if (form.state && V.lettersOnly(form.state, 'State')) errs.state = V.lettersOnly(form.state, 'State');
        if (form.pincode && V.pincode(form.pincode)) errs.pincode = V.pincode(form.pincode);
        if (form.contactPhone && V.phone(form.contactPhone)) errs.contactPhone = V.phone(form.contactPhone);
        if (form.contactEmail && V.email(form.contactEmail)) errs.contactEmail = V.email(form.contactEmail);

        if (!editId) {
            if (V.required(form.adminFullName, 'Admin name')) errs.adminFullName = V.required(form.adminFullName, 'Admin name');
            else if (V.lettersOnly(form.adminFullName, 'Admin name')) errs.adminFullName = V.lettersOnly(form.adminFullName, 'Admin name');

            if (V.required(form.adminEmail, 'Admin email')) errs.adminEmail = V.required(form.adminEmail, 'Admin email');
            else if (V.email(form.adminEmail)) errs.adminEmail = V.email(form.adminEmail);

            if (V.required(form.adminUsername, 'Username')) errs.adminUsername = V.required(form.adminUsername, 'Username');
            else if (V.minLength(form.adminUsername, 4, 'Username')) errs.adminUsername = V.minLength(form.adminUsername, 4, 'Username');
            else if (V.alphanumeric(form.adminUsername, 'Username')) errs.adminUsername = V.alphanumeric(form.adminUsername, 'Username');

            if (V.required(form.adminPassword, 'Password')) errs.adminPassword = V.required(form.adminPassword, 'Password');
            else if (V.minLength(form.adminPassword, 6, 'Password')) errs.adminPassword = V.minLength(form.adminPassword, 6, 'Password');
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleFieldChange = (field, value) => {
        setForm({ ...form, [field]: value });
        if (errors[field]) setErrors({ ...errors, [field]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            if (editId) {
                await updateBranch(editId, { name: form.name, location: form.location, city: form.city, state: form.state, pincode: form.pincode, contactPhone: form.contactPhone, contactEmail: form.contactEmail });
            } else {
                await createBranch(form);
                if (form.adminUsername && form.adminPassword) {
                    setCreatedAdmin({ email: form.adminEmail, username: form.adminUsername, password: form.adminPassword });
                }
            }
            setShowModal(false); setEditId(null); setForm(emptyForm); setErrors({});
            fetchBranches();
        } catch (e) { alert(e.response?.data?.message || 'Error'); }
    };

    const handleEdit = (b) => {
        setForm({ name: b.name, location: b.location, city: b.city || '', state: b.state || '', pincode: b.pincode || '', contactPhone: b.contactPhone || '', contactEmail: b.contactEmail || '', adminUsername: '', adminPassword: '', adminEmail: '', adminFullName: '' });
        setEditId(b.id); setErrors({}); setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
        try { await deleteBranch(id); setConfirmDeleteId(null); fetchBranches(); }
        catch (e) { alert(e.response?.data?.message || 'Failed to deactivate branch.'); setConfirmDeleteId(null); }
    };

    const handleGenerateCredentials = () => {
        if (!form.adminFullName || !form.name) {
            alert("Please enter the Branch Name and Admin Full Name first to generate meaningful credentials.");
            return;
        }
        
        const cleanName = form.adminFullName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanBranch = form.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const branchCount = branches.length + 1; // Use the number of branches as requested
        
        // Meaningful Email: e.g., johndoe@mainwarehouse.com
        const generatedEmail = `${cleanName}@${cleanBranch}.com`;
        
        // Meaningful Username: e.g., admin_mainwarehouse_5
        const generatedUsername = `admin_${cleanBranch}_${branchCount}`;
        
        // Meaningful Password: e.g., Mainwarehouse@5Admin
        const capitalizedBranch = cleanBranch.charAt(0).toUpperCase() + cleanBranch.slice(1);
        const generatedPassword = `${capitalizedBranch}@${branchCount}Admin`;

        setForm({
            ...form,
            adminEmail: generatedEmail,
            adminUsername: generatedUsername,
            adminPassword: generatedPassword
        });
        setErrors({ ...errors, adminEmail: '', adminUsername: '', adminPassword: '' });
    };

    const handleActivate = async (id) => {
        try { await activateBranch(id); fetchBranches(); }
        catch (e) { alert(e.response?.data?.message || 'Failed to activate branch.'); }
    };

    const handlePermanentDelete = async (id) => {
        if (confirmPermanentId !== id) { setConfirmPermanentId(id); return; }
        try { await permanentDeleteBranch(id); setConfirmPermanentId(null); fetchBranches(); }
        catch (e) { alert(e.response?.data?.message || 'Failed to permanently delete branch.'); setConfirmPermanentId(null); }
    };



    const BranchCard = ({ b, dimmed }) => (
        <div className="card" style={{ marginBottom: 0, opacity: dimmed ? 0.7 : 1 }}>
            <div className="flex-between mb-4">
                <h3 style={{ fontWeight: 700 }}>{b.name}</h3>
                {b.isActive ? <span className="status-badge status-delivered">Active</span> : <span className="status-badge status-cancelled">Inactive</span>}
            </div>
            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '8px' }}><FiMapPin style={{ marginRight: '6px' }} />{b.location}</p>
            <p className="text-muted" style={{ fontSize: '13px' }}>{b.city}{b.state ? `, ${b.state}` : ''}{b.pincode ? ` - ${b.pincode}` : ''}</p>
            {b.adminName && <p style={{ fontSize: '13px', marginTop: '8px' }}><FiUser style={{ marginRight: '4px' }} />Admin: <strong>{b.adminName}</strong></p>}
            {b.contactPhone && <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>📞 {b.contactPhone}</p>}
            {user.role === 'SUPER_ADMIN' && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(b)}><FiEdit2 /> Edit</button>
                    {b.isActive ? (
                        <>
                            <button className={`btn ${confirmDeleteId === b.id ? 'btn-primary' : 'btn-danger'} btn-sm`} onClick={() => handleDelete(b.id)}>
                                {confirmDeleteId === b.id ? '⚠ Confirm?' : <><FiTrash2 /></>}
                            </button>
                            {confirmDeleteId === b.id && <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDeleteId(null)}>Cancel</button>}
                        </>
                    ) : (
                        <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleActivate(b.id)}><FiRefreshCw /> Activate</button>
                            <button className={`btn ${confirmPermanentId === b.id ? 'btn-primary' : 'btn-danger'} btn-sm`} onClick={() => handlePermanentDelete(b.id)}>
                                {confirmPermanentId === b.id ? '⚠ Delete Forever?' : <><FiTrash2 /> Remove</>}
                            </button>
                            {confirmPermanentId === b.id && <button className="btn btn-secondary btn-sm" onClick={() => setConfirmPermanentId(null)}>Cancel</button>}
                        </>
                    )}
                </div>
            )}
        </div>
    );

    if (loading) return <div className="loading">Loading branches...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Branch Management</h1>
                {user.role === 'SUPER_ADMIN' && (
                    <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditId(null); setErrors({}); setShowModal(true); }}>
                        <FiPlus /> Add Branch
                    </button>
                )}
            </div>

            {/* Active Branches Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {activeBranches.map(b => <BranchCard key={b.id} b={b} dimmed={false} />)}
            </div>
            {activeBranches.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 40, color: '#8b8fa3' }}>No active branches</div>}

            {/* View Inactive Branches Toggle */}
            {inactiveBranches.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        style={{
                            width: '100%', padding: '14px 20px', background: '#1a1c2e', border: '1px solid #2a2d3e',
                            borderRadius: '10px', color: '#8b8fa3', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600,
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#22253a'}
                        onMouseLeave={e => e.currentTarget.style.background = '#1a1c2e'}
                    >
                        <span><FiEyeOff style={{ marginRight: '8px', verticalAlign: 'middle' }} />View Inactive Branches ({inactiveBranches.length})</span>
                        {showInactive ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    {showInactive && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '16px' }}>
                            {inactiveBranches.map(b => <BranchCard key={b.id} b={b} dimmed={true} />)}
                        </div>
                    )}
                </div>
            )}

            {/* Created Admin Credentials Dialog */}
            {createdAdmin && (
                <div className="modal-overlay" onClick={() => setCreatedAdmin(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
                        <div className="modal-header"><h2>✅ Branch Admin Created</h2><button className="modal-close" onClick={() => setCreatedAdmin(null)}>×</button></div>
                        <div style={{ padding: '8px 0 16px' }}>
                            <p style={{ color: '#8b8fa3', fontSize: '0.9rem', marginBottom: '16px' }}>Save these credentials — they cannot be retrieved later.</p>
                            <div style={{ background: '#1a1c2e', borderRadius: '10px', padding: '16px 20px', marginBottom: '12px' }}>
                                <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#8b8fa3', marginBottom: '4px' }}>Login Email</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#a855f7' }}>{createdAdmin.email}</p>
                            </div>
                            <div style={{ background: '#1a1c2e', borderRadius: '10px', padding: '16px 20px', marginBottom: '12px' }}>
                                <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#8b8fa3', marginBottom: '4px' }}>Username</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4f8cff' }}>{createdAdmin.username}</p>
                            </div>
                            <div style={{ background: '#1a1c2e', borderRadius: '10px', padding: '16px 20px' }}>
                                <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#8b8fa3', marginBottom: '4px' }}>Password</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>{createdAdmin.password}</p>
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setCreatedAdmin(null)}>Got it!</button>
                    </div>
                </div>
            )}

            {/* Add / Edit Branch Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); setErrors({}); }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>{editId ? 'Edit Branch' : 'Add New Branch'}</h2><button className="modal-close" onClick={() => { setShowModal(false); setErrors({}); }}>×</button></div>
                        <form onSubmit={handleSubmit} noValidate>
                            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#8b8fa3', marginBottom: '12px' }}>Branch Details</h4>
                            <div className="form-grid">
                                <FormField label="Branch Name" name="name" value={form.name} error={errors.name} onChange={handleFieldChange} required placeholder="e.g. Main Warehouse" maxLength={100} />
                                <FormField label="Location" name="location" value={form.location} error={errors.location} onChange={handleFieldChange} required placeholder="e.g. Industrial Area, Phase-2" />
                                <FormField label="City" name="city" value={form.city} error={errors.city} onChange={handleFieldChange} placeholder="e.g. Hyderabad" />
                                <FormField label="State" name="state" value={form.state} error={errors.state} onChange={handleFieldChange} placeholder="e.g. Telangana" />
                                <FormField label="Pincode" name="pincode" value={form.pincode} error={errors.pincode} onChange={handleFieldChange} placeholder="e.g. 500001" maxLength={6} hint="6-digit pincode" />
                                <FormField label="Phone" name="contactPhone" value={form.contactPhone} error={errors.contactPhone} onChange={handleFieldChange} placeholder="e.g. 9876543210" maxLength={10} hint="10-digit mobile number" />
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <FormField label="Branch Email" name="contactEmail" value={form.contactEmail} error={errors.contactEmail} onChange={handleFieldChange} type="email" placeholder="e.g. branch@company.com" />
                                </div>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    style={{ marginTop: '28px', padding: '12px 16px', whiteSpace: 'nowrap' }}
                                    onClick={() => {
                                        if (!form.name || !form.city) {
                                            alert("Please enter Branch Name and City to generate a meaningful branch email.");
                                            return;
                                        }
                                        const cleanBranch = form.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                                        const cleanCity = form.city.toLowerCase().replace(/[^a-z0-9]/g, '');
                                        setForm({...form, contactEmail: `info@${cleanBranch}-${cleanCity}.com`});
                                        setErrors({...errors, contactEmail: ''});
                                    }}
                                >
                                    ✨ Auto-Generate
                                </button>
                            </div>

                            {!editId && (
                                <>
                                    <hr style={{ border: 'none', borderTop: '1px solid #2a2d3e', margin: '20px 0' }} />
                                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#4f8cff', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        👤 Branch Admin Credentials
                                        <button type="button" onClick={handleGenerateCredentials} className="btn btn-secondary btn-sm" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                                            ✨ Auto-Generate
                                        </button>
                                    </h4>
                                    <p style={{ fontSize: '0.8rem', color: '#8b8fa3', marginBottom: '12px' }}>Create login credentials for the branch administrator</p>
                                    <div className="form-grid">
                                        <FormField label="Admin Full Name" name="adminFullName" value={form.adminFullName} error={errors.adminFullName} onChange={handleFieldChange} required placeholder="John Doe" />
                                        <FormField label="Admin Email" name="adminEmail" value={form.adminEmail} error={errors.adminEmail} onChange={handleFieldChange} type="email" required placeholder="john@branch.com" />
                                        <FormField label="Admin Username" name="adminUsername" value={form.adminUsername} error={errors.adminUsername} onChange={handleFieldChange} required placeholder="branch_admin_1" hint="Min 4 chars, letters/numbers/underscores only" />
                                        <FormField label="Admin Password" name="adminPassword" value={form.adminPassword} error={errors.adminPassword} onChange={handleFieldChange} type="text" required placeholder="Min 6 characters" hint="Automatically generated or create a custom one" />
                                    </div>
                                </>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>{editId ? 'Update Branch' : 'Create Branch & Admin'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Branches;
