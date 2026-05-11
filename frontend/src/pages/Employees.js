import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEmployees, getEmployeesByBranch, addEmployee, updateEmployee, deleteEmployee, activateEmployee, getBranches, permanentDeleteEmployee } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUsers, FiUserCheck, FiDollarSign, FiBriefcase, FiEyeOff, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { V } from '../utils/validators';
import FormField from '../components/FormField';

const Employees = () => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterBranch, setFilterBranch] = useState('ALL');
    const [filterDept, setFilterDept] = useState('ALL');
    const [sortBy, setSortBy] = useState('name-asc');
    const [errors, setErrors] = useState({});
    const [showInactive, setShowInactive] = useState(false);
    const [confirmPermanentId, setConfirmPermanentId] = useState(null);

    const emptyForm = { username: '', email: '', password: '', fullName: '', phone: '', branchId: '', department: '', designation: '', salary: '' };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchData(); }, []);
    const fetchData = async () => {
        try {
            const [empRes, branchRes] = await Promise.all([
                user.branchId ? getEmployeesByBranch(user.branchId) : getEmployees(),
                getBranches()
            ]);
            setEmployees(empRes.data); setBranches(branchRes.data);
        } catch (e) { }
        setLoading(false);
    };

    const validateForm = () => {
        const errs = {};
        if (!editId) {
            if (V.required(form.username, 'Username')) errs.username = V.required(form.username, 'Username');
            else if (V.minLength(form.username, 4, 'Username')) errs.username = V.minLength(form.username, 4, 'Username');
            else if (V.alphanumeric(form.username, 'Username')) errs.username = V.alphanumeric(form.username, 'Username');

            if (V.required(form.email, 'Email')) errs.email = V.required(form.email, 'Email');
            else if (V.email(form.email)) errs.email = V.email(form.email);

            if (V.required(form.password, 'Password')) errs.password = V.required(form.password, 'Password');
            else if (V.minLength(form.password, 6, 'Password')) errs.password = V.minLength(form.password, 6, 'Password');
        }

        if (V.required(form.fullName, 'Full name')) errs.fullName = V.required(form.fullName, 'Full name');
        else if (V.minLength(form.fullName, 2, 'Full name')) errs.fullName = V.minLength(form.fullName, 2, 'Full name');
        else if (V.lettersOnly(form.fullName, 'Full name')) errs.fullName = V.lettersOnly(form.fullName, 'Full name');

        if (form.phone && V.phone(form.phone)) errs.phone = V.phone(form.phone);

        if (!editId && V.required(form.branchId, 'Branch')) errs.branchId = V.required(form.branchId, 'Branch');
        if (V.required(form.department, 'Department')) errs.department = V.required(form.department, 'Department');

        if (V.required(form.salary, 'Salary')) errs.salary = V.required(form.salary, 'Salary');
        else if (V.positiveNumber(form.salary, 'Salary')) errs.salary = V.positiveNumber(form.salary, 'Salary');
        else if (V.minValue(form.salary, 1000, 'Salary')) errs.salary = V.minValue(form.salary, 1000, 'Salary');
        else if (V.maxValue(form.salary, 10000000, 'Salary')) errs.salary = V.maxValue(form.salary, 10000000, 'Salary');

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
                await updateEmployee(editId, { fullName: form.fullName, phone: form.phone, department: form.department, designation: form.designation, salary: parseFloat(form.salary), status: form.status });
            } else {
                await addEmployee({ ...form, salary: parseFloat(form.salary), branchId: parseInt(form.branchId) });
            }
            setShowModal(false); setEditId(null); setForm(emptyForm); setErrors({}); fetchData();
        } catch (e) { alert(e.response?.data?.message || 'Error'); }
    };

    const handleEdit = (emp) => {
        setForm({ fullName: emp.fullName, phone: emp.phone || '', department: emp.department, designation: emp.designation || '', salary: emp.salary, status: emp.status, branchId: emp.branchId });
        setEditId(emp.id); setErrors({}); setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deactivate this employee?')) { await deleteEmployee(id); fetchData(); }
    };

    const handleActivate = async (id) => {
        try { await activateEmployee(id); fetchData(); }
        catch (e) { alert(e.response?.data?.message || 'Failed to activate employee.'); }
    };

    const handlePermanentDelete = async (id) => {
        if (confirmPermanentId !== id) { setConfirmPermanentId(id); return; }
        try { await permanentDeleteEmployee(id); setConfirmPermanentId(null); fetchData(); }
        catch (e) { alert(e.response?.data?.message || 'Failed to permanently delete employee.'); setConfirmPermanentId(null); }
    };

    // Filter by branch first, then extract departments
    const branchFiltered = filterBranch === 'ALL' ? employees : employees.filter(e => String(e.branchId) === String(filterBranch));
    const departments = [...new Set(branchFiltered.map(e => e.department).filter(Boolean))].sort();

    useEffect(() => {
        if (filterDept !== 'ALL' && !departments.includes(filterDept)) setFilterDept('ALL');
    }, [filterBranch]);

    const filtered = branchFiltered.filter(e =>
        (filterDept === 'ALL' || e.department === filterDept) &&
        (e.fullName?.toLowerCase().includes(search.toLowerCase()) || e.department?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase()))
    );

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
            case 'name-asc': return (a.fullName || '').localeCompare(b.fullName || '');
            case 'name-desc': return (b.fullName || '').localeCompare(a.fullName || '');
            case 'salary-high': return (b.salary || 0) - (a.salary || 0);
            case 'salary-low': return (a.salary || 0) - (b.salary || 0);
            case 'dept-asc': return (a.department || '').localeCompare(b.department || '');
            case 'status': return (a.status || '').localeCompare(b.status || '');
            case 'branch': return (a.branchName || '').localeCompare(b.branchName || '');
            case 'joined-new': return new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0);
            case 'joined-old': return new Date(a.joinedAt || 0) - new Date(b.joinedAt || 0);
            default: return 0;
        }
    });

    // Stats
    const activeSorted = sorted.filter(e => e.status === 'ACTIVE');
    const inactiveSorted = sorted.filter(e => e.status !== 'ACTIVE');
    
    const totalCount = sorted.length;
    const activeCount = activeSorted.length;
    const totalSalary = sorted.reduce((s, e) => s + (e.salary || 0), 0);
    const deptCount = [...new Set(sorted.map(e => e.department).filter(Boolean))].length;

    const EmployeeRow = ({ emp }) => (
        <tr key={emp.id}>
            <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px',
                        background: `hsl(${(emp.fullName || '').charCodeAt(0) * 7 % 360}, 60%, 25%)`,
                        color: `hsl(${(emp.fullName || '').charCodeAt(0) * 7 % 360}, 80%, 70%)`,
                        flexShrink: 0
                    }}>
                        {(emp.fullName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{emp.fullName}</div>
                        <div style={{ fontSize: '12px', color: '#8b8fa3' }}>{emp.email}</div>
                    </div>
                </div>
            </td>
            <td>
                <span style={{ padding: '4px 10px', background: '#161822', border: '1px solid #2a2d3e', borderRadius: '6px', fontSize: '12px', fontWeight: 500 }}>
                    {emp.branchName}
                </span>
            </td>
            <td><span style={{ fontWeight: 500, color: '#a855f7' }}>{emp.department}</span></td>
            <td style={{ color: '#8b8fa3' }}>{emp.designation || '—'}</td>
            <td><span style={{ fontWeight: 600, color: '#34d399' }}>₹{emp.salary?.toLocaleString()}</span></td>
            <td>
                <span className={`status-badge ${emp.status === 'ACTIVE' ? 'status-delivered' : 'status-cancelled'}`}>
                    {emp.status}
                </span>
            </td>
            <td>
                {(user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN') && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {emp.status === 'ACTIVE' ? (
                            <>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(emp)} title="Edit"><FiEdit2 /></button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)} title="Deactivate"><FiTrash2 /></button>
                            </>
                        ) : (
                            <>
                                <button className="btn btn-primary btn-sm" onClick={() => handleActivate(emp.id)} title="Activate"><FiUserCheck /> Activate</button>
                                {user.role === 'SUPER_ADMIN' && (
                                    <>
                                        <button className={`btn ${confirmPermanentId === emp.id ? 'btn-primary' : 'btn-danger'} btn-sm`} onClick={() => handlePermanentDelete(emp.id)}>
                                            {confirmPermanentId === emp.id ? '⚠ Delete?' : <FiTrash2 />}
                                        </button>
                                        {confirmPermanentId === emp.id && <button className="btn btn-secondary btn-sm" onClick={() => setConfirmPermanentId(null)}>Cancel</button>}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );

    if (loading) return <div className="loading">Loading employees...</div>;

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <h1>Employee Management</h1>
                {(user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN') && (
                    <button className="btn btn-primary" onClick={() => { setForm({ ...emptyForm, branchId: user.branchId || '' }); setEditId(null); setErrors({}); setShowModal(true); }}><FiPlus /> Add Employee</button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card kpi-blue">
                    <div className="kpi-icon"><FiUsers /></div>
                    <div className="kpi-value">{totalCount}</div>
                    <div className="kpi-label">Total Employees</div>
                </div>
                <div className="kpi-card kpi-green">
                    <div className="kpi-icon"><FiUserCheck /></div>
                    <div className="kpi-value">{activeCount}</div>
                    <div className="kpi-label">Active Employees</div>
                </div>
                <div className="kpi-card kpi-purple">
                    <div className="kpi-icon"><FiBriefcase /></div>
                    <div className="kpi-value">{deptCount}</div>
                    <div className="kpi-label">Departments</div>
                </div>
                <div className="kpi-card kpi-orange">
                    <div className="kpi-icon"><FiDollarSign /></div>
                    <div className="kpi-value">₹{totalSalary.toLocaleString()}</div>
                    <div className="kpi-label">Total Salary Cost</div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar">
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <FiSearch style={{ position: 'absolute', left: '12px', top: '10px', color: '#8b8fa3' }} />
                    <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search by name, email, department..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {user.role === 'SUPER_ADMIN' && (
                    <select className="filter-select" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                        <option value="ALL">All Branches</option>
                        {branches.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                )}
                <select className="filter-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                    <option value="ALL">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <optgroup label="Name">
                        <option value="name-asc">Name A → Z</option>
                        <option value="name-desc">Name Z → A</option>
                    </optgroup>
                    <optgroup label="Salary">
                        <option value="salary-high">Salary: High → Low</option>
                        <option value="salary-low">Salary: Low → High</option>
                    </optgroup>
                    <optgroup label="Other">
                        <option value="dept-asc">Department A → Z</option>
                        <option value="branch">Branch A → Z</option>
                        <option value="status">Status</option>
                        <option value="joined-new">Joined: Newest</option>
                        <option value="joined-old">Joined: Oldest</option>
                    </optgroup>
                </select>
            </div>

            {/* Results count */}
            <div style={{ fontSize: '13px', color: '#8b8fa3', marginBottom: '12px', fontWeight: 500 }}>
                Showing {sorted.length} of {employees.length} employees
                {filterBranch !== 'ALL' && <span> · Branch: <span style={{ color: '#4f8cff' }}>{branches.find(b => String(b.id) === String(filterBranch))?.name}</span></span>}
                {filterDept !== 'ALL' && <span> · Dept: <span style={{ color: '#a855f7' }}>{filterDept}</span></span>}
            </div>

            {/* Employee Table */}
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Branch</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Salary</th>
                            <th>Status</th>
                                <th style={{ width: '130px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeSorted.map(emp => <EmployeeRow key={emp.id} emp={emp} />)}
                        </tbody>
                    </table>
                    {activeSorted.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">👤</div>
                        <p>No employees found matching your filters.</p>
                    </div>
                )}
            </div>

            {/* View Inactive Employees Toggle */}
            {inactiveSorted.length > 0 && (
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
                        <span><FiEyeOff style={{ marginRight: '8px', verticalAlign: 'middle' }} />View Inactive Employees ({inactiveSorted.length})</span>
                        {showInactive ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    {showInactive && (
                        <div className="card" style={{ padding: 0, overflowX: 'auto', marginTop: '16px' }}>
                            <table className="data-table" style={{ margin: 0, opacity: 0.8 }}>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Branch</th>
                                        <th>Department</th>
                                        <th>Designation</th>
                                        <th>Salary</th>
                                        <th>Status</th>
                                        <th style={{ width: '240px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inactiveSorted.map(emp => <EmployeeRow key={emp.id} emp={emp} />)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); setErrors({}); }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>{editId ? 'Edit Employee' : 'Add Employee'}</h2><button className="modal-close" onClick={() => { setShowModal(false); setErrors({}); }}>×</button></div>
                        <form onSubmit={handleSubmit} noValidate>
                            {!editId && (
                                <>
                                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#4f8cff', marginBottom: '12px' }}>Account Credentials</h4>
                                    <div className="form-grid">
                                        <FormField label="Username" name="username" value={form.username} error={errors.username} onChange={handleFieldChange} required placeholder="e.g. john_doe" hint="Min 4 chars, letters/numbers/underscores" maxLength={30} />
                                        <FormField label="Email" name="email" value={form.email} error={errors.email} onChange={handleFieldChange} type="email" required placeholder="e.g. john@company.com" />
                                        <FormField label="Password" name="password" value={form.password} error={errors.password} onChange={handleFieldChange} type="password" required placeholder="Min 6 characters" hint="Must be at least 6 characters" />
                                    </div>
                                    <hr style={{ border: 'none', borderTop: '1px solid #2a2d3e', margin: '16px 0' }} />
                                </>
                            )}
                            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#8b8fa3', marginBottom: '12px' }}>Employee Details</h4>
                            <div className="form-grid">
                                <FormField label="Full Name" name="fullName" value={form.fullName} error={errors.fullName} onChange={handleFieldChange} required placeholder="e.g. John Doe" />
                                <FormField label="Phone" name="phone" value={form.phone} error={errors.phone} onChange={handleFieldChange} placeholder="e.g. 9876543210" maxLength={10} hint="10-digit mobile number" />
                                {!editId && (
                                    <FormField label="Branch" name="branchId" error={errors.branchId} required>
                                        <select className={`form-input ${errors.branchId ? 'input-error' : ''}`} value={form.branchId} onChange={e => handleFieldChange('branchId', e.target.value)}>
                                            <option value="">Select Branch</option>
                                            {branches.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </FormField>
                                )}
                                <FormField label="Department" name="department" error={errors.department} required>
                                    <select className={`form-input ${errors.department ? 'input-error' : ''}`} value={form.department} onChange={e => handleFieldChange('department', e.target.value)}>
                                        <option value="">Select Department</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Warehouse">Warehouse</option>
                                        <option value="Finance">Finance</option>
                                        <option value="IT">IT</option>
                                        <option value="Operations">Operations</option>
                                        <option value="HR">HR</option>
                                        <option value="Logistics">Logistics</option>
                                    </select>
                                </FormField>
                                <FormField label="Designation" name="designation" value={form.designation} error={errors.designation} onChange={handleFieldChange} placeholder="e.g. Manager, Executive" />
                                <FormField label="Salary (₹)" name="salary" value={form.salary} error={errors.salary} onChange={handleFieldChange} type="number" required placeholder="e.g. 25000" hint="Min ₹1,000 – Max ₹1,00,00,000" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>{editId ? 'Update Employee' : 'Add Employee'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
