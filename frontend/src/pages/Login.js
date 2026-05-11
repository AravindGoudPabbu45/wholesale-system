import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import './Login.css';

/**
 * Login page with premium glassmorphism design.
 * Includes field-level validation before submit.
 */
const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (data) => {
    const errs = {};
    if (!data.username.trim()) errs.username = 'Username is required';
    else if (data.username.trim().length < 3) errs.username = 'Username must be at least 3 characters';
    if (!data.password) errs.password = 'Password is required';
    else if (data.password.length < 4) errs.password = 'Password must be at least 4 characters';
    return errs;
  };

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(updated);
    setError('');
    if (touched[e.target.name]) {
      setErrors(validate(updated));
    }
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
    setErrors(validate(formData));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(formData);
    setErrors(errs);
    setTouched({ username: true, password: true });
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setError('');
    try {
      const res = await login({ username: formData.username.trim(), password: formData.password });
      loginUser(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <span className="login-logo">📦</span>
            <h1>WholesaleERP</h1>
            <p>Smart Inventory Management System</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text" name="username" className={`form-input ${touched.username && errors.username ? 'input-error' : ''}`}
                value={formData.username} onChange={handleChange} onBlur={handleBlur}
                placeholder="Enter your username" autoComplete="username" maxLength={50}
              />
              {touched.username && errors.username && <div className="field-error">{errors.username}</div>}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password" name="password" className={`form-input ${touched.password && errors.password ? 'input-error' : ''}`}
                value={formData.password} onChange={handleChange} onBlur={handleBlur}
                placeholder="Enter your password" autoComplete="current-password"
              />
              {touched.password && errors.password && <div className="field-error">{errors.password}</div>}
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? '⏳ Please wait...' : 'Sign In'}
            </button>
          </form>

          <div className="login-register-link" style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              New partner? <Link to="/register" style={{ color: '#5b4fc4', fontWeight: 600, textDecoration: 'none' }}>Register as Retailer / Supplier →</Link>
            </p>
          </div>

          <div className="login-demo-info">
            <p>Demo Credentials:</p>
            <span>superadmin / password123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
