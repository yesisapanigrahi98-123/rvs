import React from 'react';

export const Card = ({ 
  title, 
  subtitle, 
  children, 
  className = '', 
  action,
  loading = false 
}) => {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle || action) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className={`card-content ${loading ? 'loading' : ''}`}>
        {loading && <div className="card-skeleton" />}
        {children}
      </div>
    </div>
  );
};

export default Card;