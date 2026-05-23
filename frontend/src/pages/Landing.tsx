import { useNavigate } from 'react-router-dom';
import {
  ChefHat,
  ArrowRight,
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  Thermometer,
  ScanLine,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <img src="/logo.png" alt="BistroFlow" className="logo-mark-img" />
            <span className="logo-text">BistroFlow</span>
          </div>
          <div className="landing-nav-links">
            {isLoggedIn ? (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/app')}>
                <LayoutDashboard size={16} /> Console
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grain"></div>
          <div className="hero-gradient"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <TrendingUp size={14} />
            <span>Smart Restaurant Operations</span>
          </div>
          <h1 className="hero-title">
            <span className="hero-title-line">Streamline Your</span>
            <span className="hero-title-line hero-title-accent">Kitchen & Staff</span>
          </h1>
          <p className="hero-subtitle">
            All-in-one operations operating system for restaurants. Build menus,
            manage staff schedules, track temperature compliance, scan receipts, and run checklists.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate(isLoggedIn ? '/app' : '/login')}>
              {isLoggedIn ? 'Go to Dashboard' : 'Open Console'}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Floating elements */}
        <div className="hero-float hero-float-1">
          <CalendarDays size={32} />
        </div>
        <div className="hero-float hero-float-2">
          <ClipboardCheck size={28} />
        </div>
        <div className="hero-float hero-float-3">
          <Thermometer size={24} />
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="features-inner">
          <div className="features-header">
            <h2 className="section-title">Designed for Fast-Paced Kitchens</h2>
            <p className="section-subtitle">A digital workspace built to keep your front-of-house and back-of-house perfectly in sync.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <CalendarDays size={28} />
              </div>
              <h3>Employee Scheduling</h3>
              <p>Create visual weekly schedules, auto-calculate labor hours and projected payroll, and share live web links with your staff.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <ChefHat size={28} />
              </div>
              <h3>Menu Engineering</h3>
              <p>Standardize recipes, manage ingredients databases, calculate serving costs, and design digital menu sections easily.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <ClipboardCheck size={28} />
              </div>
              <h3>Checklists & Audits</h3>
              <p>Enforce opening, closing, and custom cleaning checklists with daily runs and structured accountability tracking.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Thermometer size={28} />
              </div>
              <h3>HACCP Temperature Logs</h3>
              <p>Log and monitor refrigeration and heating equipment temperatures to ensure food safety compliance and log histories.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <ScanLine size={28} />
              </div>
              <h3>Receipt & Invoice AI</h3>
              <p>Digitize and archive supplier receipts. Process invoice details, items, and totals automatically to track cost fluctuations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <ShieldAlert size={28} />
              </div>
              <h3>Secure Sub-Accounts</h3>
              <p>Grant managers or staff members specific access to schedules, checklists, or ingredients settings while protecting financial data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="quote-section">
        <div className="quote-inner">
          <blockquote className="quote">
            <span className="quote-mark">"</span>
            <p>BistroFlow brings order to kitchen chaos. It replaces clipboards, notebooks, and messy group chats with a single sources of truth.</p>
          </blockquote>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-content">
            <h2>Ready to Optimize Your Restaurant?</h2>
            <p>Get started today and experience the difference a unified management operating system makes.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(isLoggedIn ? '/app' : '/login')}>
              {isLoggedIn ? 'Go to Dashboard' : 'Get Started Now'}
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="cta-decoration">
            <div className="cta-circle cta-circle-1"></div>
            <div className="cta-circle cta-circle-2"></div>
            <div className="cta-circle cta-circle-3"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <img src="/logo.png" alt="BistroFlow" className="logo-mark-img" />
            <span className="logo-text">BistroFlow</span>
          </div>
          <p className="footer-text">The Complete Restaurant Operating System.</p>
        </div>
      </footer>
    </div>
  );
}
