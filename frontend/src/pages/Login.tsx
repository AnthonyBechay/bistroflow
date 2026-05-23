import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Eye, EyeOff, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/app', { replace: true });
    }
  }, [navigate]);

  const handleDemoLogin = async (role: 'owner' | 'manager' | 'employee') => {
    setError('');
    setLoading(true);
    try {
      let credentials;
      if (role === 'owner') {
        credentials = { email: 'demo@bistroflow.com', password: 'demo123' };
      } else if (role === 'manager') {
        credentials = { email: 'manager@bistroflow.com', password: 'manager123' };
      } else {
        credentials = { email: 'alice.demo@bistroflow.com', password: 'alice123' };
      }
      const data = await api.post('/auth/login', credentials);
      localStorage.setItem('token', data.token);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
        const data = await api.post('/auth/register', { email, password, name });
        localStorage.setItem('token', data.token);
      } else {
        const data = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
      }
      navigate('/app');
    } catch (err: any) {
      setError(err.message || (isRegister ? 'Registration failed' : 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-gradient"></div>
      </div>
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <img src="/logo.png" alt="BistroFlow" className="login-logo-img" />
          </div>
          <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isRegister ? 'Sign up to get started' : 'Sign in to your kitchen'}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          {isRegister && (
            <div className="form-group">
              <label className="label">Name</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? 'Choose a password' : 'Enter password'}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {isRegister ? <UserPlus size={18} /> : <ChefHat size={18} />}
            {loading ? (isRegister ? 'Creating...' : 'Signing in...') : (isRegister ? 'Create Account' : 'Enter Kitchen')}
          </button>
        </form>
        <button className="login-toggle" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </button>
        
        <div className="demo-shortcuts">
          <div className="demo-divider">
            <span>Or try the demo</span>
          </div>
          <div className="demo-buttons">
            <button type="button" className="btn demo-btn" onClick={() => handleDemoLogin('owner')} disabled={loading}>
              Owner Demo
            </button>
            <button type="button" className="btn demo-btn" onClick={() => handleDemoLogin('manager')} disabled={loading}>
              Branch Manager Demo
            </button>
            <button type="button" className="btn demo-btn" onClick={() => handleDemoLogin('employee')} disabled={loading}>
              Employee Demo
            </button>
          </div>
        </div>

        <button className="login-back" onClick={() => navigate('/')}>Back to home</button>
      </div>
    </div>
  );
}
