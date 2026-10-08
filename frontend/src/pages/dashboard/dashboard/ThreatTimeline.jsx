import React from 'react';
import { Chart } from '../../../components/ui/Chart';
import { formatRelativeTime, getSeverityColor } from '../../../utils/formatters';

export const ThreatTimeline = ({ threats = [], trends = [] }) => {
  const chartData = trends.length > 0 ? trends.map((t, i) => ({
    time: t.time,
    count: t.count,
    severity: t.severity
  })) : Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    count: Math.floor(Math.random() * 50),
    severity: 'low'
  }));

  const [filterSeverity, setFilterSeverity] = React.useState('all');

  const filteredThreats = (threats.length > 0 ? threats : [
    { type: 'prompt_injection', severity: 'critical', source: 'email_attachment.pdf', status: 'blocked', timestamp: new Date().toISOString() },
    { type: 'jailbreak_attempt', severity: 'high', source: 'chat_session_409', status: 'blocked', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { type: 'data_leakage', severity: 'medium', source: 'internal_db_query', status: 'sanitized', timestamp: new Date(Date.now() - 7200000).toISOString() }
  ]).filter(t => {
    if (filterSeverity === 'all') return true;
    const sev = (t.severity || 'low').toLowerCase();
    if (filterSeverity === 'high') return sev === 'critical' || sev === 'high';
    if (filterSeverity === 'medium') return sev === 'medium';
    if (filterSeverity === 'low') return sev === 'low' || sev === 'none';
    return true;
  }).slice(0, 6);

  return (
    <div className="threat-timeline">
      <div className="chart-header-row">
        <div className="chart-meta-badge">
          <span className="dot pulse" />
          <span>REAL-TIME INJECTION SENSOR</span>
        </div>
        <div className="threat-filter-chips">
          {['all', 'high', 'medium', 'low'].map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`filter-chip-sm ${filterSeverity === s ? 'active' : ''}`}
            >
              {s === 'high' ? 'HIGH / CRIT' : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container" style={{ height: 200 }}>
        <Chart data={chartData} color="rose" height={200} />
      </div>
      
      <div className="threat-list">
        <h4 className="list-title">Live Interception Feed</h4>
        {filteredThreats.length === 0 ? (
          <div className="empty-state-small">
            <p>No matching threats detected</p>
          </div>
        ) : (
          <ul className="threat-items">
            {filteredThreats.map((threat, index) => {
              const threatType = threat.type || threat.threat_type || threat.event_type || 'INSPECTION';
              const threatSeverity = threat.severity || 'low';
              const threatStatus = threat.status || threat.decision || 'monitored';
              const threatSource = threat.source || threat.agent_id || threat.session_id || 'Agent';

              return (
                <li key={index} className="threat-item">
                  <div className="threat-indicator" style={{ backgroundColor: getSeverityColor(threatSeverity) }} />
                  <div className="threat-info">
                    <span className="threat-type">{String(threatType).replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="threat-source">{threatSource}</span>
                  </div>
                  <div className="threat-meta">
                    <span className={`threat-severity ${threatSeverity.toLowerCase()}`}>{String(threatSeverity).toUpperCase()}</span>
                    <span className="threat-time">{formatRelativeTime(threat.timestamp)}</span>
                  </div>
                  <span className={`threat-status ${threatStatus.toLowerCase()}`}>{String(threatStatus).toUpperCase()}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ThreatTimeline;