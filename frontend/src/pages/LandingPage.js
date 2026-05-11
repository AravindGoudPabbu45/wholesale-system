import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="landing">
            {/* ===== Navbar ===== */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-inner">
                    <Link to="/" className="nav-logo">
                        <div className="nav-logo-icon">📦</div>
                        WholesaleERP
                    </Link>
                    <div className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How It Works</a>
                        <a href="#categories">Categories</a>
                        <a href="#testimonials">Reviews</a>
                        <Link to="/login" className="nav-btn-login">Log In</Link>
                        <Link to="/register" className="nav-btn-register">Register Free</Link>
                    </div>
                </div>
            </nav>

            {/* ===== Hero ===== */}
            <section className="hero">
                <div className="hero-inner">
                    <div className="hero-content">
                        <div className="hero-tag">🚀 India's #1 Wholesale Management Platform</div>
                        <h1>
                            Simplify Your<br />
                            <span className="gradient-text">Wholesale Business</span>
                        </h1>
                        <p>
                            Streamline procurement, manage inventory across branches, track orders in real-time,
                            and grow your B2B business — all from one powerful platform.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/register" className="btn-hero-primary">
                                Get Started Free →
                            </Link>
                            <a href="#features" className="btn-hero-secondary">
                                Explore Features
                            </a>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="hero-card-stack">
                            <div className="hero-float-card">
                                <div className="float-card-icon" style={{ background: 'rgba(79, 140, 255, 0.2)', color: '#4f8cff' }}>📊</div>
                                <div className="float-card-value">₹24.5L</div>
                                <div className="float-card-label">Monthly Revenue</div>
                            </div>
                            <div className="hero-float-card">
                                <div className="float-card-icon" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>📦</div>
                                <div className="float-card-value">1,248</div>
                                <div className="float-card-label">Orders This Week</div>
                            </div>
                            <div className="hero-float-card">
                                <div className="float-card-icon" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>🏢</div>
                                <div className="float-card-value">12</div>
                                <div className="float-card-label">Active Branches</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Stats Bar ===== */}
            <section className="stats-bar">
                <div className="stats-bar-inner">
                    <div className="stat-item">
                        <div className="stat-num">500+</div>
                        <div className="stat-desc">Businesses Trust Us</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num">10K+</div>
                        <div className="stat-desc">Products Managed</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num">50+</div>
                        <div className="stat-desc">Cities Covered</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num">99.9%</div>
                        <div className="stat-desc">Uptime Guaranteed</div>
                    </div>
                </div>
            </section>

            {/* ===== Features ===== */}
            <section className="section" id="features">
                <div className="section-inner">
                    <div className="section-header">
                        <div className="section-tag">Features</div>
                        <h2>Everything You Need to Run<br />Your Wholesale Business</h2>
                        <p>A comprehensive suite of tools designed specifically for B2B wholesale operations</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(79, 140, 255, 0.1)', color: '#4f8cff' }}>🏢</div>
                            <h3>Multi-Branch Management</h3>
                            <p>Manage multiple warehouses and branches from a single dashboard. Track inventory, employees, and orders per branch in real-time.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>📦</div>
                            <h3>Smart Inventory Control</h3>
                            <p>Automated low-stock alerts, real-time stock tracking, and intelligent reorder suggestions to never miss a sale again.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>🛒</div>
                            <h3>Order Management</h3>
                            <p>End-to-end order lifecycle from placement to delivery. Track status, generate invoices, and manage returns effortlessly.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>💰</div>
                            <h3>Financial Dashboard</h3>
                            <p>Complete financial overview with revenue tracking, expense management, profit margins, and GST-compliant invoice generation.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }}>🤝</div>
                            <h3>Supplier & Retailer Portal</h3>
                            <p>Dedicated portals for suppliers and retailers with self-registration, order placement, and real-time communication tools.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee' }}>📊</div>
                            <h3>Advanced Analytics</h3>
                            <p>Powerful insights with sales trends, revenue charts, demand forecasting, and customizable reports to drive smarter decisions.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== How It Works ===== */}
            <section className="section how-section" id="how-it-works">
                <div className="section-inner">
                    <div className="section-header">
                        <div className="section-tag">How It Works</div>
                        <h2>Get Started in Minutes</h2>
                        <p>Four simple steps to transform your wholesale operations</p>
                    </div>

                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <h3>Create Your Account</h3>
                            <p>Register as a supplier or retailer with our simple multi-step registration process</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">2</div>
                            <h3>Set Up Your Business</h3>
                            <p>Add your branches, products, and team members to get your workspace ready</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">3</div>
                            <h3>Start Trading</h3>
                            <p>Place orders, manage procurement, and track inventory from your personalized dashboard</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">4</div>
                            <h3>Grow & Scale</h3>
                            <p>Use analytics and insights to optimize operations and expand your business reach</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Product Categories ===== */}
            <section className="section" id="categories">
                <div className="section-inner">
                    <div className="section-header">
                        <div className="section-tag">Categories</div>
                        <h2>One Platform for All Your Wholesale Needs</h2>
                        <p>Manage any type of wholesale product across industries</p>
                    </div>

                    <div className="categories-grid">
                        <div className="category-card">
                            <div className="category-emoji">🌾</div>
                            <h4>Grains & Cereals</h4>
                            <p>Rice, Wheat, Pulses & more</p>
                        </div>
                        <div className="category-card">
                            <div className="category-emoji">🛢️</div>
                            <h4>Cooking Oil</h4>
                            <p>Sunflower, Mustard, Groundnut</p>
                        </div>
                        <div className="category-card">
                            <div className="category-emoji">🧂</div>
                            <h4>Spices & Condiments</h4>
                            <p>Salt, Turmeric, Chilli & more</p>
                        </div>
                        <div className="category-card">
                            <div className="category-emoji">🍬</div>
                            <h4>Sugar & Sweeteners</h4>
                            <p>Sugar, Jaggery, Honey</p>
                        </div>
                        <div className="category-card">
                            <div className="category-emoji">☕</div>
                            <h4>Beverages</h4>
                            <p>Tea, Coffee, Juices</p>
                        </div>
                        <div className="category-card">
                            <div className="category-emoji">🧹</div>
                            <h4>Cleaning Supplies</h4>
                            <p>Detergents, Soaps, Sanitizers</p>
                        </div>
                        <div className="category-card">
                            <div className="category-emoji">📝</div>
                            <h4>Office & Stationery</h4>
                            <p>Paper, Pens, Supplies</p>
                        </div>
                        <div className="category-card">
                            <div className="category-emoji">🔧</div>
                            <h4>Industrial & MRO</h4>
                            <p>Tools, Hardware, Equipment</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Testimonials ===== */}
            <section className="section testimonials-section" id="testimonials">
                <div className="section-inner">
                    <div className="section-header">
                        <div className="section-tag" style={{ background: 'rgba(79, 140, 255, 0.15)' }}>Testimonials</div>
                        <h2 style={{ color: 'white' }}>Trusted by Growing Businesses</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)' }}>See what our customers have to say about WholesaleERP</p>
                    </div>

                    <div className="testimonials-grid">
                        <div className="testimonial-card">
                            <div className="testimonial-stars">★★★★★</div>
                            <blockquote>"WholesaleERP transformed how we manage inventory across our 5 warehouses. Stock tracking is now effortless!"</blockquote>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">RK</div>
                                <div>
                                    <h4>Rajesh Kumar</h4>
                                    <p>Owner, Kumar Wholesale Traders</p>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card">
                            <div className="testimonial-stars">★★★★★</div>
                            <blockquote>"The supplier portal makes procurement so smooth. Our ordering time reduced by 60% in the first month!"</blockquote>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">PS</div>
                                <div>
                                    <h4>Priya Sharma</h4>
                                    <p>Procurement Head, Star Retail Group</p>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card">
                            <div className="testimonial-stars">★★★★★</div>
                            <blockquote>"Real-time analytics helped us identify our best-selling products and optimize our supply chain significantly."</blockquote>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">AJ</div>
                                <div>
                                    <h4>Amit Joshi</h4>
                                    <p>Director, FreshMart Distribution</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="cta-section">
                <div className="section-inner">
                    <div className="cta-box">
                        <h2>Ready to Grow Your Wholesale Business?</h2>
                        <p>Join hundreds of businesses already using WholesaleERP to streamline operations and boost revenue.</p>
                        <Link to="/register" className="btn-cta">Create Free Account →</Link>
                    </div>
                </div>
            </section>

            {/* ===== Footer ===== */}
            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <h3>📦 WholesaleERP</h3>
                            <p>India's leading wholesale management platform. Streamline your B2B operations, manage inventory, and grow your business.</p>
                        </div>
                        <div className="footer-col">
                            <h4>Platform</h4>
                            <a href="#features">Features</a>
                            <a href="#categories">Categories</a>
                            <a href="#how-it-works">How It Works</a>
                            <a href="#testimonials">Testimonials</a>
                        </div>
                        <div className="footer-col">
                            <h4>Company</h4>
                            <a href="#">About Us</a>
                            <a href="#">Contact</a>
                            <a href="#">Careers</a>
                            <a href="#">Blog</a>
                        </div>
                        <div className="footer-col">
                            <h4>Support</h4>
                            <a href="#">Help Center</a>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                            <Link to="/login">Login</Link>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <span>© 2026 WholesaleERP. All rights reserved.</span>
                        <span>Made with ❤️ in India</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
