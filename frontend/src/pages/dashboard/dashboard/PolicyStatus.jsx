import React from 'react';
import { 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Key,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useSecurity } from '../../../context/SecurityContext';

export const PolicyStatus = ({ activePolicy }) => {
  const { policies, switchActivePolicy } = useSecurity();
  const [expanded, setExpanded] = React.useState(false);

  const policyList = policies.length > 0 ? policies : [
    { name: 'default', description: 'Balanced security for production', version: '1.0.0', is_active: true, rules: 24 },
    { name: 'strict_enterprise', description: 'Maximum security for sensitive data', version: '1.0.0', is_active: false, rules: 42 },
    { name: 'lenient_sandbox', description: 'Permissive for development/testing', version: '1.0.0', is_active: false, rules: 8 }
  ];

  const currentActive = policyList.find(p => p.name === activePolicy || p.is_active) || policyList[0] || {};
  const activeRulesCount = typeof currentActive.rules === 'number'
    ? currentActive.rules
    : Array.isArray(currentActive.rules)
      ? currentActive.rules.length
      : (currentActive.rules && typeof currentActive.rules === 'object')
        ? Object.keys(currentActive.rules).length
        : 7;

  return (
    <div className="policy-status">
      <div className="active-policy-card">
        <div className="policy-header">
          <div className="policy-icon active">
            <Shield className="w-5 h-5" />
          </div>
          <div className="policy-info">
            <span className="policy-badge">ACTIVE ENFORCEMENT</span>
            <h4>{currentActive.name || activePolicy || 'default'}</h4>
            <p className="policy-description">{currentActive.description || 'Continuous least-privilege boundary'}</p>
          </div>
        </div>
        <div className="policy-meta">
          <div className="meta-item">
            <span className="meta-label">Rules</span>
            <span className="meta-value">{activeRulesCount}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Version</span>
            <span className="meta-value">v{currentActive.version || '1.0.0'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Mode</span>
            <span className="meta-value">AIRGAP</span>
          </div>
        </div>
      </div>

      <div className="other-policies">
        <h4 className="list-title">
          All Policies
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="expand-btn"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </h4>
        
        <ul className={`policy-list ${expanded ? 'expanded' : ''}`}>
          {policyList.map((policy) => {
            const ruleCount = typeof policy.rules === 'number' 
              ? policy.rules 
              : Array.isArray(policy.rules) 
                ? policy.rules.length 
                : (policy.rules && typeof policy.rules === 'object') 
                  ? Object.keys(policy.rules).length 
                  : 0;

            return (
              <li key={policy.name} className={`policy-item ${policy.is_active ? 'active' : ''}`}>
                <div className={`policy-icon ${policy.is_active ? 'active' : ''}`}>
                  {policy.is_active ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="policy-info">
                  <div className="policy-name-row">
                    <strong>{policy.name}</strong>
                    {policy.is_active && <span className="active-badge">ACTIVE</span>}
                  </div>
                  <p className="policy-description">{policy.description}</p>
                  <div className="policy-details">
                    <span><Key className="w-3 h-3" /> {ruleCount} rules</span>
                    <span>v{policy.version}</span>
                  </div>
                </div>
              {!policy.is_active && (
                <button 
                  onClick={() => switchActivePolicy(policy.name)}
                  className="btn-ghost btn-sm"
                  disabled={policy.is_active}
                >
                  Activate
                </button>
              )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PolicyStatus;