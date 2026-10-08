import React from 'react';
import { Link } from 'react-router-dom';

const B = import.meta.env.BASE_URL;
const img = (p) => `${B}${p}`;

export const LandingNavbar = ({ active, menuOpen, setMenuOpen, vivid, toggleVivid }) => {
  return (
    <div className="nav-wrap">
      <div className="navbar-container">
        <nav className="navbar" aria-label="Main Navigation">
          <a href="#home" className="brand" aria-label="SentinelFlow Homepage">
            <img 
              src={img('01_Hero/logo-mark.png')} 
              alt="SentinelFlow Logo" 
              className="brand-logo" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="brand-text">
              <strong>SENTINEL<em>FLOW</em></strong>
              <small>ZERO-TRUST FIREWALL</small>
            </div>
          </a>

          <div className="nav-links">
            <a href="#home" className={`nav-link ${active === 'home' ? 'active' : ''}`}>Overview</a>
            <a href="#how" className={`nav-link ${active === 'how' ? 'active' : ''}`}>How It Works</a>
            <a href="#modules" className={`nav-link ${active === 'modules' ? 'active' : ''}`}>Modules</a>
            <a href="#proof" className={`nav-link ${active === 'proof' ? 'active' : ''}`}>Live Telemetry</a>
            <a href="#docs" className={`nav-link ${active === 'docs' ? 'active' : ''}`}>Docs</a>
          </div>

          <div className="nav-actions">
            <button
              onClick={toggleVivid}
              className="theme-btn"
              title="Toggle Vivid Palette"
              aria-label="Toggle Vivid Color Palette"
            >
              {vivid ? '✦' : '✧'}
            </button>

            <Link to="/dashboard" className="btn-get" id="landing-nav-dashboard-btn">
              <span>Open Dashboard</span>
              <span aria-hidden="true">→</span>
            </Link>

            <button
              className={`hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={menuOpen}
            >
              <i />
              <i />
              <i />
            </button>
          </div>
        </nav>

        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-inner">
            <a href="#home" onClick={() => setMenuOpen(false)} className="nav-link">Overview</a>
            <a href="#how" onClick={() => setMenuOpen(false)} className="nav-link">How It Works</a>
            <a href="#modules" onClick={() => setMenuOpen(false)} className="nav-link">Modules</a>
            <a href="#proof" onClick={() => setMenuOpen(false)} className="nav-link">Live Telemetry</a>
            <a href="#docs" onClick={() => setMenuOpen(false)} className="nav-link">Docs</a>
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="btn-get" style={{ marginTop: 8 }}>
              Open Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingNavbar;
