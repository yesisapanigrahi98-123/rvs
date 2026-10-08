import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@sentinelflow.io');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />
      <div className="login-card">
        <div className="login-brand">
          <span className="login-shield">◈</span>
          <strong>SENTINEL<em>FLOW</em></strong>
          <small>SECURITY DASHBOARD</small>
        </div>
        <h2>Sign in to your account</h2>
        <p className="login-sub">Monitor, manage, and secure your AI agents in real time.</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            <span>Email</span>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sentinelflow.io"
              required
              autoFocus
            />
          </label>
          <label>
            <span>Password</span>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          <button
            id="login-submit"
            type="submit"
            className="btn-primary login-btn"
            disabled={loading}
          >
            {loading ? 'Authenticating…' : 'Sign In →'}
          </button>
        </form>
        <p className="login-footer">
          <Link to="/">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
