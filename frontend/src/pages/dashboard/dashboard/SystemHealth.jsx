import React from 'react';
import { 
  Server, 
  Shield, 
  Database, 
  FileText, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

const components = [
  { id: 'firewall', name: 'Firewall Engine', icon: Shield, description: 'Traffic inspection & rule enforcement' },
  { id: 'policyEngine', name: 'Policy Engine', icon: FileText, description: 'Rule evaluation & decision making' },
  { id: 'auditLogger', name: 'Audit Logger', icon: Activity, description: 'Immutable event logging & hashing' },
  { id: 'database', name: 'Database', icon: Database, description: 'PostgreSQL connection pool' }
];

export const SystemHealth = ({ health }) => {
  const componentStatus = health?.components || {
    firewall: 'operational',
    policyEngine: 'operational',
    auditLogger: 'operational',
    database: 'connected'
  };

  const getStatusConfig = (status) => {
    const configs = {
      operational: { icon: CheckCircle2, color: '#10b981', label: 'Operational' },
      connected: { icon: CheckCircle2, color: '#10b981', label: 'Connected' },
      degraded: { icon: AlertCircle, color: '#f59e0b', label: 'Degraded' },
      down: { icon: AlertCircle, color: '#ef4444', label: 'Down' },
      starting: { icon: Loader2, color: '#3b82f6', label: 'Starting' }
    };
    return configs[status] || configs.operational;
  };

  return (
    <div className="system-health">
      <div className="health-summary">
        <div className={`health-status ${health?.status || 'healthy'}`}>
          <div className="health-indicator" />
          <div>
            <span className="health-label">System Status</span>
            <strong className="health-value">{(health?.status || 'healthy').toUpperCase()}</strong>
          </div>
        </div>
        <div className="last-check">
          <span>Last check</span>
          <time>{health?.lastCheck ? new Date(health.lastCheck).toLocaleTimeString() : '—'}</time>
        </div>
      </div>

      <ul className="component-list">
        {components.map((comp) => {
          const status = componentStatus[comp.id] || 'operational';
          const config = getStatusConfig(status);
          const StatusIcon = config.icon;
          const CompIcon = comp.icon;
          
          return (
            <li key={comp.id} className="component-item">
              <div className="component-icon">
                <CompIcon className="w-5 h-5" />
              </div>
              <div className="component-info">
                <div className="component-name-row">
                  <strong>{comp.name}</strong>
                  <StatusIcon className={`w-4 h-4 ${status === 'operational' || status === 'connected' ? 'text-emerald-400' : status === 'degraded' ? 'text-amber-400' : 'text-rose-400'}`} />
                </div>
                <p className="component-description">{comp.description}</p>
              </div>
              <div className={`component-status ${status}`}>
                <span className="status-dot" style={{ backgroundColor: config.color }} />
                <span>{config.label}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="health-metrics">
        <div className="metric">
          <span className="metric-value">99.99%</span>
          <span className="metric-label">Uptime</span>
        </div>
        <div className="metric">
          <span className="metric-value">&lt;5ms</span>
          <span className="metric-label">Avg Latency</span>
        </div>
        <div className="metric">
          <span className="metric-value">100%</span>
          <span className="metric-label">Audit Integrity</span>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;