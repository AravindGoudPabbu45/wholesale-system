import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Register.css';

/**
 * 5-Phase Partner Registration (Retailer + Supplier)
 * Phase 1: Business Details + Role Selection
 * Phase 2: Contact Personnel
 * Phase 3: Business Headquarters
 * Phase 4: Verification Documents (UI-only)
 * Phase 5: Account Security (Username + Password)
 */
const Register = () => {
  const [phase, setPhase] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [formData, setFormData] = useState({
    role: 'RETAILER',
    businessName: '', gstNumber: '', businessLicenseNo: '', businessType: 'Retail Store', yearsInBusiness: '',
    companyName: '',
    fullName: '', email: '', phone: '', alternatePhone: '',
    address: '', city: '', state: '', pincode: '',
    // Phase 4 - file names (UI-only)
    gstCertFile: null, bizLicenseFile: null, idProofFile: null,
    // Phase 5
    username: '', password: '', confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setError('');
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file.name });
    }
  };

  // --- Regular Expressions for Validation ---
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
  const phoneRegex = /^[6-9]\d{9}$/;
  const pincodeRegex = /^[1-9][0-9]{5}$/;

  // --- Validation per phase ---
  const validatePhase = (p) => {
    const errs = {};
    if (p === 1) {
      if (formData.role === 'RETAILER') {
        if (!formData.businessName.trim()) errs.businessName = 'Business Name is required';
      } else {
        if (!formData.companyName.trim()) errs.companyName = 'Company Name is required';
      }
      if (!formData.gstNumber.trim()) {
        errs.gstNumber = 'GST Number is required';
      } else if (!gstRegex.test(formData.gstNumber.trim())) {
        errs.gstNumber = 'Invalid GST Format (e.g. 22AAAAA0000A1Z5)';
      }
    }
    if (p === 2) {
      if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
      
      if (!formData.email.trim()) {
        errs.email = 'Email is required';
      } else if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Enter a valid email address';
      }
      
      if (!formData.phone.trim()) {
        errs.phone = 'Phone number is required';
      } else if (!phoneRegex.test(formData.phone.trim())) {
        errs.phone = 'Enter a valid 10-digit mobile number';
      }
      
      if (formData.alternatePhone && formData.alternatePhone.trim() !== '') {
        if (!phoneRegex.test(formData.alternatePhone.trim())) {
          errs.alternatePhone = 'Enter a valid 10-digit mobile number';
        }
      }
    }
    if (p === 3) {
      if (!formData.address.trim()) errs.address = 'Address is required';
      if (!formData.city.trim()) errs.city = 'City is required';
      if (!formData.state.trim()) errs.state = 'State is required';
      
      if (!formData.pincode.trim()) {
        errs.pincode = 'Pincode is required';
      } else if (!pincodeRegex.test(formData.pincode.trim())) {
        errs.pincode = 'Must be a valid 6-digit Pincode';
      }
    }
    // Phase 4: documents are optional
    if (p === 5) {
      if (!formData.username.trim()) errs.username = 'Username is required';
      else if (formData.username.trim().length < 4) errs.username = 'Username must be at least 4 characters';
      
      if (!formData.password) errs.password = 'Password is required';
      else if (!passwordMeetsAll) errs.password = 'Password does not meet complexity requirements';
      
      if (!formData.confirmPassword) errs.confirmPassword = 'Confirm Password is required';
      else if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Password strength checks
  const pwChecks = {
    minLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };
  const passwordMeetsAll = Object.values(pwChecks).every(Boolean);

  const nextPhase = () => {
    if (validatePhase(phase)) setPhase(phase + 1);
  };
  const prevPhase = () => setPhase(phase - 1);

  const handleSubmit = async () => {
    if (!validatePhase(5)) return;
    setLoading(true);
    setError('');
    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role,
        businessName: formData.role === 'RETAILER' ? formData.businessName : formData.companyName,
        companyName: formData.role === 'SUPPLIER' ? formData.companyName : undefined,
        contactPerson: formData.role === 'SUPPLIER' ? formData.fullName : undefined,
        gstNumber: formData.gstNumber,
        businessLicenseNo: formData.businessLicenseNo,
        businessType: formData.businessType,
        yearsInBusiness: formData.yearsInBusiness ? parseInt(formData.yearsInBusiness) : null,
        alternatePhone: formData.alternatePhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      };
      const res = await register(payload);
      loginUser(res.data);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isRetailer = formData.role === 'RETAILER';

  // --- Render Phases ---
  const renderPhase1 = () => (
    <>
      <div className="phase-title">
        <div className="phase-icon">🏢</div>
        <h2>Business Details</h2>
      </div>
      <div className="role-selector">
        <div className={`role-option ${formData.role === 'RETAILER' ? 'selected' : ''}`}
          onClick={() => setFormData({ ...formData, role: 'RETAILER' })}>
          <div className="role-icon">🏪</div>
          <div className="role-name">Retailer</div>
          <div className="role-desc">Buy wholesale products</div>
        </div>
        <div className={`role-option ${formData.role === 'SUPPLIER' ? 'selected' : ''}`}
          onClick={() => setFormData({ ...formData, role: 'SUPPLIER' })}>
          <div className="role-icon">🚚</div>
          <div className="role-name">Supplier</div>
          <div className="role-desc">Supply products to branches</div>
        </div>
      </div>
      <div className="reg-form-grid">
        <div className="reg-form-group">
          <label>{isRetailer ? 'Legal Business Name' : 'Company Name'}</label>
          <input type="text" name={isRetailer ? 'businessName' : 'companyName'}
            placeholder={isRetailer ? 'Apex Wholesalers Ltd' : 'Global Supplies Pvt Ltd'}
            value={isRetailer ? formData.businessName : formData.companyName}
            onChange={handleChange}
            className={errors.businessName || errors.companyName ? 'input-error' : ''} />
          {(errors.businessName || errors.companyName) && <span className="error-text">{errors.businessName || errors.companyName}</span>}
        </div>
        <div className="reg-form-group">
          <label>GST Number (15 Digits)</label>
          <input type="text" name="gstNumber" placeholder="22AAAAA0000A1Z5" maxLength={15}
            value={formData.gstNumber} onChange={handleChange}
            className={errors.gstNumber ? 'input-error' : ''} />
          {errors.gstNumber && <span className="error-text">{errors.gstNumber}</span>}
        </div>
        <div className="reg-form-group">
          <label>Business License No.</label>
          <input type="text" name="businessLicenseNo" placeholder="LIC-9201-B"
            value={formData.businessLicenseNo} onChange={handleChange} />
        </div>
        <div className="reg-form-group">
          <label>Business Type</label>
          <select name="businessType" value={formData.businessType} onChange={handleChange}>
            <option>Retail Store</option>
            <option>Wholesale Dealer</option>
            <option>Distributor</option>
            <option>Manufacturer</option>
            <option>Import/Export</option>
            <option>Other</option>
          </select>
        </div>
        <div className="reg-form-group">
          <label>Years in Business</label>
          <input type="number" name="yearsInBusiness" placeholder="5" min="0"
            value={formData.yearsInBusiness} onChange={handleChange} />
        </div>
      </div>
    </>
  );

  const renderPhase2 = () => (
    <>
      <div className="phase-title">
        <div className="phase-icon">👤</div>
        <h2>Contact Personnel</h2>
      </div>
      <div className="reg-form-grid">
        <div className="reg-form-group">
          <label>{isRetailer ? 'Owner Full Name' : 'Contact Person Name'}</label>
          <input type="text" name="fullName" placeholder="John Wick"
            value={formData.fullName} onChange={handleChange}
            className={errors.fullName ? 'input-error' : ''} />
          {errors.fullName && <span className="error-text">{errors.fullName}</span>}
        </div>
        <div className="reg-form-group">
          <label>Business Email</label>
          <input type="email" name="email" placeholder="john@apex.com"
            value={formData.email} onChange={handleChange}
            className={errors.email ? 'input-error' : ''} />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>
        <div className="reg-form-group">
          <label>Primary Phone</label>
          <input type="tel" name="phone" placeholder="9876543210"
            value={formData.phone} onChange={handleChange}
            className={errors.phone ? 'input-error' : ''} />
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>
        <div className="reg-form-group">
          <label>Alternate Phone</label>
          <input type="tel" name="alternatePhone" placeholder="9876543211"
            value={formData.alternatePhone} onChange={handleChange} />
        </div>
      </div>
    </>
  );

  const renderPhase3 = () => (
    <>
      <div className="phase-title">
        <div className="phase-icon">📍</div>
        <h2>Business Headquarters</h2>
      </div>
      <div className="reg-form-grid">
        <div className="reg-form-group full-width">
          <label>Street Address</label>
          <input type="text" name="address" placeholder="123 Industrial Park"
            value={formData.address} onChange={handleChange}
            className={errors.address ? 'input-error' : ''} />
          {errors.address && <span className="error-text">{errors.address}</span>}
        </div>
      </div>
      <div className="reg-form-grid three-col" style={{ marginTop: 24 }}>
        <div className="reg-form-group">
          <label>City</label>
          <input type="text" name="city" placeholder="Hyderabad"
            value={formData.city} onChange={handleChange}
            className={errors.city ? 'input-error' : ''} />
          {errors.city && <span className="error-text">{errors.city}</span>}
        </div>
        <div className="reg-form-group">
          <label>State</label>
          <input type="text" name="state" placeholder="Telangana"
            value={formData.state} onChange={handleChange}
            className={errors.state ? 'input-error' : ''} />
          {errors.state && <span className="error-text">{errors.state}</span>}
        </div>
        <div className="reg-form-group">
          <label>Pincode (6 Digits)</label>
          <input type="text" name="pincode" placeholder="500001" maxLength={6}
            value={formData.pincode} onChange={handleChange}
            className={errors.pincode ? 'input-error' : ''} />
          {errors.pincode && <span className="error-text">{errors.pincode}</span>}
        </div>
      </div>
    </>
  );

  const renderPhase4 = () => (
    <>
      <div className="phase-title">
        <div className="phase-icon">📄</div>
        <h2>Verification Documents</h2>
      </div>
      <div className="reg-form-grid">
        <div className="reg-form-group">
          <label>GST Certificate (PDF)</label>
          <label className={`upload-zone ${formData.gstCertFile ? 'has-file' : ''}`}>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
              onChange={(e) => handleFileChange('gstCertFile', e)} />
            <div className="upload-icon">{formData.gstCertFile ? '✅' : '⬆️'}</div>
            <div className="upload-text">{formData.gstCertFile ? 'File Selected' : 'Select or drop file'}</div>
            {formData.gstCertFile ? <div className="upload-filename">{formData.gstCertFile}</div>
              : <div className="upload-hint">MAX 5MB | PDF/JPG</div>}
          </label>
        </div>
        <div className="reg-form-group">
          <label>Business License (PDF)</label>
          <label className={`upload-zone ${formData.bizLicenseFile ? 'has-file' : ''}`}>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
              onChange={(e) => handleFileChange('bizLicenseFile', e)} />
            <div className="upload-icon">{formData.bizLicenseFile ? '✅' : '⬆️'}</div>
            <div className="upload-text">{formData.bizLicenseFile ? 'File Selected' : 'Select or drop file'}</div>
            {formData.bizLicenseFile ? <div className="upload-filename">{formData.bizLicenseFile}</div>
              : <div className="upload-hint">MAX 5MB | PDF/JPG</div>}
          </label>
        </div>
        <div className="reg-form-group">
          <label>Owner ID Proof (JPG/PDF)</label>
          <label className={`upload-zone ${formData.idProofFile ? 'has-file' : ''}`}>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
              onChange={(e) => handleFileChange('idProofFile', e)} />
            <div className="upload-icon">{formData.idProofFile ? '✅' : '⬆️'}</div>
            <div className="upload-text">{formData.idProofFile ? 'File Selected' : 'Select or drop file'}</div>
            {formData.idProofFile ? <div className="upload-filename">{formData.idProofFile}</div>
              : <div className="upload-hint">MAX 5MB | PDF/JPG</div>}
          </label>
        </div>
        <div className="doc-notice">
          <span>ℹ️</span>
          <span>Please ensure all documents are clearly legible and valid. Verification takes 24-48 business hours upon submission.</span>
        </div>
      </div>
    </>
  );

  const renderPhase5 = () => (
    <>
      <div className="phase-title">
        <div className="phase-icon">🔒</div>
        <h2>Account Security</h2>
      </div>
      <div className="reg-form-grid">
        <div className="reg-form-group full-width">
          <label>Username</label>
          <input type="text" name="username" placeholder="johndoe_retail"
            value={formData.username} onChange={handleChange}
            className={errors.username ? 'input-error' : ''} />
          {errors.username && <span className="error-text">{errors.username}</span>}
        </div>
        <div className="reg-form-group">
          <label>Create Password</label>
          <input type="password" name="password" placeholder="••••••••"
            value={formData.password} onChange={handleChange}
            className={errors.password ? 'input-error' : ''} />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>
        <div className="reg-form-group">
          <label>Confirm Password</label>
          <input type="password" name="confirmPassword" placeholder="••••••••"
            value={formData.confirmPassword} onChange={handleChange}
            className={errors.confirmPassword ? 'input-error' : ''} />
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
        </div>
        <div className="password-requirements">
          <ul>
            <li className={pwChecks.minLength ? 'met' : ''}><span className="check-icon">{pwChecks.minLength ? '✓' : '•'}</span> Minimum 8 characters</li>
            <li className={pwChecks.hasUpper ? 'met' : ''}><span className="check-icon">{pwChecks.hasUpper ? '✓' : '•'}</span> At least 1 uppercase letter</li>
            <li className={pwChecks.hasLower ? 'met' : ''}><span className="check-icon">{pwChecks.hasLower ? '✓' : '•'}</span> At least 1 lowercase letter</li>
            <li className={pwChecks.hasNumber ? 'met' : ''}><span className="check-icon">{pwChecks.hasNumber ? '✓' : '•'}</span> At least 1 number</li>
            <li className={pwChecks.hasSpecial ? 'met' : ''}><span className="check-icon">{pwChecks.hasSpecial ? '✓' : '•'}</span> At least 1 special character</li>
          </ul>
        </div>
      </div>
    </>
  );

  if (success) {
    return (
      <div className="register-page">
        <div className="register-container">
          <div className="register-header">
            <div className="register-brand"><span>🏢</span> SmartInvB2B</div>
            <h1>Registration Successful!</h1>
          </div>
          <div className="register-card">
            <div className="register-success">
              <h3>🎉 Welcome aboard!</h3>
              <p>Your {isRetailer ? 'retailer' : 'supplier'} account has been created. {isRetailer ? 'Approval is pending (24-48 hrs).' : ''} Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Header */}
        <div className="register-header">
          <div className="register-brand"><span>🏢</span> SmartInvB2B</div>
          <h1>{isRetailer ? 'Retailer' : 'Supplier'} Partner Onboarding</h1>
          <p>Verified Enterprise Partner Registration Portal</p>
        </div>

        {/* Stepper */}
        <div className="register-stepper">
          {[1, 2, 3, 4, 5].map((step, i) => (
            <div className="stepper-step" key={step}>
              <div className={`stepper-circle ${phase >= step ? 'active' : ''} ${phase > step ? 'completed' : ''}`}>
                {step}
              </div>
              {i < 4 && <div className={`stepper-line ${phase > step ? 'active' : ''}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="register-card">
          {error && <div className="register-error">{error}</div>}
          {phase === 1 && renderPhase1()}
          {phase === 2 && renderPhase2()}
          {phase === 3 && renderPhase3()}
          {phase === 4 && renderPhase4()}
          {phase === 5 && renderPhase5()}
        </div>

        {/* Navigation */}
        <div className="register-nav">
          {phase === 1 ? (
            <Link to="/" className="nav-back">‹ To Login</Link>
          ) : (
            <button className="nav-back" onClick={prevPhase}>‹ Back</button>
          )}
          {phase < 5 ? (
            <button className="nav-next" onClick={nextPhase}>Next Phase ›</button>
          ) : (
            <button className={`nav-next confirm-btn`} onClick={handleSubmit} disabled={loading}>
              {loading ? '⏳ Registering...' : 'Confirm Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
