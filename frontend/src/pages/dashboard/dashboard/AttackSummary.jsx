import React from 'react';
import { 
  AlertCircle, 
  Shield, 
  Target, 
  AlertTriangle,
  Database,
  Globe,
  Code,
  Mail,
  FileText
} from 'lucide-react';
import { formatNumber, getStatusColor } from '../../../utils/formatters';

const attackIcons = {
  exfiltration: AlertCircle,
  privilege_escalation: Shield,
  prompt_injection: Target,
  tool_manipulation: AlertTriangle,
  data_leakage: Database,
  web_exploit: Globe,
  code_injection: Code,
  email_attack: Mail,
  document_exploit: FileText
};

export const AttackSummary = ({ attacks = [], types = {} }) => {
  const totalAttacks = attacks.length;
  const blockedAttacks = attacks.filter(a => a.status === 'blocked').length;
  const blockRate = totalAttacks > 0 ? ((blockedAttacks / totalAttacks) * 100).toFixed(1) : 100;

  const typeEntries = Object.entries(types).length > 0 
    ? Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [
        ['exfiltration', 42],
        ['prompt_injection', 28],
        ['privilege_escalation', 15],
        ['tool_manipulation', 10],
        ['data_leakage', 5]
      ];

  const recentAttacks = attacks.slice(0, 4);

  return (
    <div className="attack-summary">
      <div className="summary-stats">
        <div className="summary-stat">
          <span className="summary-value">{formatNumber(totalAttacks)}</span>
          <span className="summary-label">Total Attacks</span>
        </div>
        <div className="summary-stat">
          <span className="summary-value" style={{ color: '#10b981' }}>{formatNumber(blockedAttacks)}</span>
          <span className="summary-label">Blocked</span>
        </div>
        <div className="summary-stat">
          <span className="summary-value" style={{ color: '#06b6d4' }}>{blockRate}%</span>
          <span className="summary-label">Block Rate</span>
        </div>
      </div>

      <div className="attack-types">
        <h4 className="list-title">Attack Types</h4>
        <div className="type-bars">
          {typeEntries.map(([type, count], index) => {
            const Icon = attackIcons[type] || AlertCircle;
            const percentage = typeEntries.reduce((sum, [, c]) => sum + c, 0) > 0 
              ? (count / typeEntries.reduce((sum, [, c]) => sum + c, 0) * 100).toFixed(0)
              : 0;
            return (
              <div key={index} className="type-bar-item">
                <div className="type-info">
                  <Icon className="w-4 h-4" style={{ color: getStatusColor(type) }} />
                  <span className="type-name">{String(type || 'other').replace(/_/g, ' ').toUpperCase()}</span>
                </div>
                <div className="type-bar-container">
                  <div 
                    className="type-bar-fill" 
                    style={{ 
                      width: `${percentage}%`, 
                      backgroundColor: getStatusColor(type) 
                    }} 
                  />
                </div>
                <span className="type-count">{formatNumber(count)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="recent-attacks">
        <h4 className="list-title">Recent Interceptions</h4>
        {recentAttacks.length === 0 ? (
          <div className="empty-state-small">
            <p>No attacks intercepted</p>
          </div>
        ) : (
          <ul className="attack-items">
            {recentAttacks.map((attack, index) => {
              const attackType = attack.type || attack.category || attack.name || 'exploit';
              const attackStatus = attack.status || attack.expected_decision || 'blocked';
              const attackPolicy = attack.policy || attack.target_tool || 'default';
              const Icon = attackIcons[attackType] || attackIcons[attack.type] || Shield;
              return (
                <li key={index} className="attack-item">
                  <div className="attack-icon" style={{ backgroundColor: getStatusColor(attackStatus) }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="attack-info">
                    <span className="attack-type">{String(attackType).replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="attack-policy">Policy: {attackPolicy}</span>
                  </div>
                  <span className={`attack-status ${attackStatus.toLowerCase()}`}>{String(attackStatus).toUpperCase()}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AttackSummary;