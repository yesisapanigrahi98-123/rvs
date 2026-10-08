import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '32px',
          margin: '24px',
          background: 'rgba(255, 23, 79, 0.08)',
          border: '1px solid rgba(255, 23, 79, 0.3)',
          borderRadius: '16px',
          color: '#eaf2ff',
          fontFamily: 'Inter, sans-serif'
        }}>
          <h3 style={{ color: '#ff5d7e', marginBottom: '8px' }}>Dashboard Component Error</h3>
          <p style={{ color: '#8b98b8', marginBottom: '16px', fontSize: '14px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#00eaff',
              color: '#020308',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Retry Component
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
