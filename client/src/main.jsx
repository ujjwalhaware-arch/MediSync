import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MediSync Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '24px', backgroundColor: '#f8fafc', color: '#1e293b' }}>
          <div style={{ maxWidth: '480px', width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e11d48', margin: '0 0 8px 0' }}>MediSync Application Error</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>Something went wrong while rendering the interface:</p>
            <pre style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '11px', overflowX: 'auto', margin: '0 0 16px 0', color: '#dc2626', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{ background: '#0d9488', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
