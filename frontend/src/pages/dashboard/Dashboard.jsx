import React, { useEffect } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Clock,
  AlertCircle,
  Database,
  Globe,
  Code,
  Mail,
  FileText
} from 'lucide-react';
import { 
  formatNumber, 
  formatPercent, 
  formatRelativeTime, 
  getSeverityColor, 
  getStatusColor 
} from '../../utils/formatters';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Chart } from '../../components/ui/Chart';
import { ThreatTimeline } from './dashboard/ThreatTimeline';
import { AttackSummary } from './dashboard/AttackSummary';
import { PolicyStatus } from './dashboard/PolicyStatus';
import { SystemHealth } from './dashboard/SystemHealth';

export const Dashboard = ({ onNavigate }) => {
  const { 
    stats, 
    health, 
    threats, 
    attacks, 
    recentActivity, 
    threatTrends,
    loading,
    refresh,
    getThreatSeverityCount,
    getAttackTypeDistribution
  } = useDashboard();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const severityCounts = getThreatSeverityCount();
  const attackTypes = getAttackTypeDistribution();

  const statCards = [
    {
      label: 'Total Requests',
      value: formatNumber(stats.totalRequests),
      icon: Activity,
      trend: '+12.5%',
      trendUp: true,
      color: 'cyan'
    },
    {
      label: 'Blocked',
      value: formatNumber(stats.blockedRequests),
      icon: Shield,
      trend: `${stats.totalRequests > 0 ? formatPercent((stats.blockedRequests / stats.totalRequests) * 100) : '0%'}`,
      trendUp: false,
      color: 'rose'
    },
    {
      label: 'Allowed',
      value: formatNumber(stats.allowedRequests),
      icon: CheckCircle2,
      trend: `${stats.totalRequests > 0 ? formatPercent((stats.allowedRequests / stats.totalRequests) * 100) : '0%'}`,
      trendUp: true,
      color: 'emerald'
    },
    {
      label: 'Active Threats',
      value: formatNumber(stats.activeThreats),
      icon: AlertTriangle,
      trend: stats.activeThreats > 0 ? 'Requires attention' : 'All clear',
      trendUp: stats.activeThreats > 0,
      color: 'amber'
    },
    {
      label: 'Avg Latency',
      value: `${stats.avgLatency}ms`,
      icon: Clock,
      trend: stats.avgLatency < 10 ? 'Optimal' : 'Elevated',
      trendUp: stats.avgLatency >= 10,
      color: 'blue'
    },
    {
      label: 'Policy Violations',
      value: formatNumber(stats.policyViolations),
      icon: AlertCircle,
      trend: stats.policyViolations > 0 ? 'Review needed' : 'Compliant',
      trendUp: stats.policyViolations > 0,
      color: 'violet'
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-kicker">
            <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', display: 'inline-block' }} />
            <span>AI Firewalled SOC // Operational Telemetry</span>
          </div>
          <h1 className="dashboard-title">Security Command Center</h1>
          <p className="dashboard-subtitle">
            <span>Continuous prompt injection shielding, DLP redaction & cryptographic audit verification.</span>
          </p>
        </div>
        <div className="dashboard-actions">
          <div className="live-pill">
            <span className="dot" />
            <span>LIVE AIRGAP</span>
          </div>
          <button onClick={refresh} disabled={loading} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className={loading ? 'animate-spin' : ''}>↻</span>
            <span>{loading ? 'Polling...' : 'Sync Telemetry'}</span>
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="grid-col-span-2">
          <Card title="Threat Timeline" subtitle="Last 24 hours">
            <ThreatTimeline threats={threats} trends={threatTrends} />
          </Card>
        </div>
        <div className="grid-col-span-1">
          <Card title="Attack Summary" subtitle="Recent interceptions">
            <AttackSummary attacks={attacks} types={attackTypes} />
          </Card>
        </div>
        <div className="grid-col-span-1">
          <Card title="Policy Status" subtitle="Active guardrails">
            <PolicyStatus activePolicy={stats.activePolicy} />
          </Card>
        </div>
        <div className="grid-col-span-1">
          <Card title="System Health" subtitle="Component status">
            <SystemHealth health={health} />
          </Card>
        </div>
        <div className="grid-col-span-2">
          <Card title="Recent Activity" subtitle="Latest security events">
            <div className="activity-list">
              {recentActivity.length === 0 ? (
                <div className="empty-state">
                  <Activity className="w-12 h-12 text-slate-500" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon" style={{ borderColor: getStatusColor(activity.status) }}>
                      {activity.type === 'exfiltration' ? <AlertCircle className="w-4 h-4" /> :
                       activity.type === 'privilege_escalation' ? <Shield className="w-4 h-4" /> :
                       activity.type === 'prompt_injection' ? <AlertTriangle className="w-4 h-4" /> :
                       <Activity className="w-4 h-4" />}
                    </div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span className="activity-type">{String(activity.type || 'activity').replace(/_/g, ' ').toUpperCase()}</span>
                        <span className="activity-time">{formatRelativeTime(activity.time)}</span>
                      </div>
                      <div className="activity-meta">
                        <span className="activity-policy">Policy: {activity.policy || 'default'}</span>
                        <span className={`activity-status ${String(activity.status || 'logged').toLowerCase()}`}>{String(activity.status || 'logged').toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
        <div className="grid-col-span-1">
          <Card title="Quick Actions">
            <div className="quick-actions">
              <a href="/firewall" className="action-btn" onClick={(e) => { e.preventDefault(); onNavigate('firewall'); }}>
                <Shield className="w-5 h-5" />
                <span>Configure Firewall</span>
              </a>
              <a href="/threats" className="action-btn" onClick={(e) => { e.preventDefault(); onNavigate('threats'); }}>
                <AlertTriangle className="w-5 h-5" />
                <span>View Threats</span>
              </a>
              <a href="/policies" className="action-btn" onClick={(e) => { e.preventDefault(); onNavigate('policies'); }}>
                <FileText className="w-5 h-5" />
                <span>Manage Policies</span>
              </a>
              <a href="/audit" className="action-btn" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>
                <Activity className="w-5 h-5" />
                <span>Audit Logs</span>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;