import React, { useState, useEffect } from 'react';import { useAuth } from '../context/AuthContext';import { getProducts, createProduct, updateProduct } from '../services/api';import { FiPlus, FiEdit2, FiSearch, FiPackage, FiTag, FiDollarSign, FiTrendingUp } from 'react-icons/fi';import { V } from '../utils/validators';import FormField from '../components/FormField';

/**
 * Product Catalog – Master product list with CRUD.
 * Focused on product details (name, SKU, pricing, margins).
 */
const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name-asc');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const emptyForm = { name: '', sku: '', category: '', description: '', price: '', costPrice: '', unit: 'PCS', thresholdLevel: 10, leadTime: 7, safetyStock: 5 };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try { const res = await getProducts(); setProducts(res.data); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  // Filter
  const filtered = products.filter(p =>
    (categoryFilter === 'ALL' || p.category === categoryFilter) &&
    (!search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()))
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return (a.name || '').localeCompare(b.name || '');
      case 'name-desc': return (b.name || '').localeCompare(a.name || '');
      case 'price-high': return (b.price || 0) - (a.price || 0);
      case 'price-low': return (a.price || 0) - (b.price || 0);
      case 'cost-high': return (b.costPrice || 0) - (a.costPrice || 0);
      case 'cost-low': return (a.costPrice || 0) - (b.costPrice || 0);
      case 'margin-high': {
        const mA = a.price && a.costPrice ? (a.price - a.costPrice) / a.price : 0;
        const mB = b.price && b.costPrice ? (b.price - b.costPrice) / b.price : 0;
        return mB - mA;
      }
      case 'margin-low': {
        const mA = a.price && a.costPrice ? (a.price - a.costPrice) / a.price : 0;
        const mB = b.price && b.costPrice ? (b.price - b.costPrice) / b.price : 0;
        return mA - mB;
      }
      case 'category': return (a.category || '').localeCompare(b.category || '');
      case 'sku': return (a.sku || '').localeCompare(b.sku || '');
      default: return 0;
    }
  });

  // Stats
  const totalProducts = sorted.length;
  const categoryCount = [...new Set(sorted.map(p => p.category).filter(Boolean))].length;
  const avgPrice = sorted.length > 0 ? (sorted.reduce((s, p) => s + (p.price || 0), 0) / sorted.length).toFixed(0) : 0;
  const avgMargin = sorted.length > 0 ? (sorted.reduce((s, p) => s + ((p.price && p.costPrice ? (p.price - p.costPrice) / p.price : 0) * 100), 0) / sorted.length).toFixed(1) : 0;

  const validateForm = () => {
    const errs = {};
    if (V.required(form.name, 'Product name')) errs.name = V.required(form.name, 'Product name');
    else if (V.minLength(form.name, 2, 'Product name')) errs.name = V.minLength(form.name, 2, 'Product name');
    else if (V.maxLength(form.name, 150, 'Product name')) errs.name = V.maxLength(form.name, 150, 'Product name');

    if (V.required(form.sku, 'SKU')) errs.sku = V.required(form.sku, 'SKU');
    else if (V.minLength(form.sku, 2, 'SKU')) errs.sku = V.minLength(form.sku, 2, 'SKU');

    if (form.category && V.maxLength(form.category, 50, 'Category')) errs.category = V.maxLength(form.category, 50, 'Category');

    if (V.required(form.price, 'Sell price')) errs.price = V.required(form.price, 'Sell price');
    else if (V.positiveNumber(form.price, 'Sell price')) errs.price = V.positiveNumber(form.price, 'Sell price');

    if (V.required(form.costPrice, 'Cost price')) errs.costPrice = V.required(form.costPrice, 'Cost price');
    else if (V.positiveNumber(form.costPrice, 'Cost price')) errs.costPrice = V.positiveNumber(form.costPrice, 'Cost price');
    else if (Number(form.costPrice) > Number(form.price) && Number(form.price) > 0) errs.costPrice = 'Cost price should not exceed sell price';

    if (form.thresholdLevel !== '' && V.numeric(form.thresholdLevel, 'Threshold')) errs.thresholdLevel = V.numeric(form.thresholdLevel, 'Threshold');
    if (form.leadTime !== '' && V.numeric(form.leadTime, 'Lead time')) errs.leadTime = V.numeric(form.leadTime, 'Lead time');
    if (form.description && form.description.length > 500) errs.description = 'Description must be at most 500 characters';

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
      const data = { ...form, price: parseFloat(form.price), costPrice: parseFloat(form.costPrice), thresholdLevel: parseInt(form.thresholdLevel) };
      if (editId) await updateProduct(editId, data);
      else await createProduct(data);
      setShowModal(false); setEditId(null); setForm(emptyForm); setErrors({}); fetchProducts();
    } catch (e) { alert(e.response?.data?.message || 'Error saving product'); }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1>Product Catalog</h1>
        {(user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN') && (
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditId(null); setErrors({}); setShowModal(true); }}><FiPlus /> Add Product</button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon"><FiPackage /></div>
          <div className="kpi-value">{totalProducts}</div>
          <div className="kpi-label">Total Products</div>
        </div>
        <div className="kpi-card kpi-purple">
          <div className="kpi-icon"><FiTag /></div>
          <div className="kpi-value">{categoryCount}</div>
          <div className="kpi-label">Categories</div>
        </div>
        <div className="kpi-card kpi-orange">
          <div className="kpi-icon"><FiDollarSign /></div>
          <div className="kpi-value">₹{Number(avgPrice).toLocaleString()}</div>
          <div className="kpi-label">Avg. Sell Price</div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-icon"><FiTrendingUp /></div>
          <div className="kpi-value">{avgMargin}%</div>
          <div className="kpi-label">Avg. Margin</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: 10, color: '#8b8fa3' }} />
          <input className="form-input" placeholder="Search by name, SKU, category..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="ALL">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <optgroup label="Name">
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
          </optgroup>
          <optgroup label="Price">
            <option value="price-high">Price: High → Low</option>
            <option value="price-low">Price: Low → High</option>
            <option value="cost-high">Cost: High → Low</option>
            <option value="cost-low">Cost: Low → High</option>
          </optgroup>
          <optgroup label="Margin">
            <option value="margin-high">Margin: High → Low</option>
            <option value="margin-low">Margin: Low → High</option>
          </optgroup>
          <optgroup label="Other">
            <option value="category">Category A → Z</option>
            <option value="sku">SKU A → Z</option>
          </optgroup>
        </select>
      </div>

      {/* Results count */}
      <div style={{ fontSize: '13px', color: '#8b8fa3', marginBottom: '12px', fontWeight: 500 }}>
        Showing {sorted.length} of {products.length} products
        {categoryFilter !== 'ALL' && <span> · Category: <span style={{ color: '#a855f7' }}>{categoryFilter}</span></span>}
      </div>

      {/* Product Table */}
      <div className="card">
        {sorted.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📦</div><p>No products found matching your filters.</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Sell Price</th>
                <th>Cost Price</th>
                <th>Margin</th>
                <th>Threshold</th>
                {(user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN') && <th style={{ width: '80px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                const margin = p.price && p.costPrice ? ((p.price - p.costPrice) / p.price * 100).toFixed(1) : '—';
                const marginNum = parseFloat(margin);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                          background: 'rgba(79, 140, 255, 0.12)', color: '#4f8cff'
                        }}>
                          <FiPackage />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</div>
                          {p.description && <div style={{ fontSize: '11px', color: '#8b8fa3', marginTop: 2 }}>{p.description.substring(0, 50)}{p.description.length > 50 ? '...' : ''}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#8b8fa3', background: '#161822', padding: '3px 8px', borderRadius: '4px' }}>{p.sku}</span>
                    </td>
                    <td>
                      <span style={{ padding: '4px 10px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>{p.category || '—'}</span>
                    </td>
                    <td style={{ color: '#8b8fa3', fontSize: '13px' }}>{p.unit || 'PCS'}</td>
                    <td><span style={{ fontWeight: 600, color: '#e8eaed' }}>₹{p.price?.toLocaleString()}</span></td>
                    <td style={{ color: '#8b8fa3' }}>₹{p.costPrice?.toLocaleString()}</td>
                    <td>
                      <span style={{
                        fontWeight: 700, fontSize: '13px',
                        color: marginNum > 20 ? '#34d399' : marginNum > 10 ? '#fbbf24' : marginNum > 0 ? '#fb923c' : '#f87171'
                      }}>
                        {margin !== '—' ? `${margin}%` : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#8b8fa3', fontSize: '13px' }}>{p.thresholdLevel}</span>
                    </td>
                    {(user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN') && (
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setForm(p); setEditId(p.id); setErrors({}); setShowModal(true); }} title="Edit"><FiEdit2 /></button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setErrors({}); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit Product' : 'Add New Product'}</h2><button className="modal-close" onClick={() => { setShowModal(false); setErrors({}); }}>×</button></div>
            <form onSubmit={handleSubmit} noValidate>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#4f8cff', marginBottom: '12px' }}>Product Info</h4>
              <div className="form-grid">
                <FormField label="Product Name" name="name" value={form.name} error={errors.name} onChange={handleFieldChange} required placeholder="e.g. Basmati Rice" maxLength={150} />
                <FormField label="SKU" name="sku" value={form.sku} error={errors.sku} onChange={handleFieldChange} required placeholder="e.g. RICE-001" hint="Unique product code" />
                <FormField label="Category" name="category" value={form.category} error={errors.category} onChange={handleFieldChange} placeholder="e.g. Rice, Electronics" maxLength={50} />
                <FormField label="Unit" name="unit" value={form.unit} error={errors.unit} onChange={handleFieldChange} placeholder="e.g. PCS, KG, LTR" />
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #2a2d3e', margin: '16px 0' }} />
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#34d399', marginBottom: '12px' }}>Pricing</h4>
              <div className="form-grid">
                <FormField label="Sell Price (₹)" name="price" value={form.price} error={errors.price} onChange={handleFieldChange} type="number" step="0.01" required placeholder="e.g. 150.00" />
                <FormField label="Cost Price (₹)" name="costPrice" value={form.costPrice} error={errors.costPrice} onChange={handleFieldChange} type="number" step="0.01" required placeholder="e.g. 120.00" hint="Should be less than sell price" />
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #2a2d3e', margin: '16px 0' }} />
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#8b8fa3', marginBottom: '12px' }}>Inventory Settings</h4>
              <div className="form-grid">
                <FormField label="Reorder Threshold" name="thresholdLevel" value={form.thresholdLevel} error={errors.thresholdLevel} onChange={handleFieldChange} type="number" placeholder="e.g. 10" hint="Minimum stock before reorder alert" />
                <FormField label="Lead Time (days)" name="leadTime" value={form.leadTime} error={errors.leadTime} onChange={handleFieldChange} type="number" placeholder="e.g. 7" hint="Days to receive after ordering" />
              </div>
              <FormField label="Description" name="description" error={errors.description}>
                <textarea className={`form-textarea ${errors.description ? 'input-error' : ''}`} value={form.description || ''} onChange={e => handleFieldChange('description', e.target.value)} placeholder="Brief product description... (max 500 chars)" maxLength={500} />
              </FormField>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>{editId ? 'Update Product' : 'Add Product'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;