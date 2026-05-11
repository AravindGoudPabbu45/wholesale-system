import React from 'react';

/**
 * Error Boundary — catches React render errors and shows a fallback UI
 * instead of crashing the entire application.
 */
class ErrorBoundary extends React.Component {
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
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '60vh', padding: '40px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>💔</div>
                    <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '8px' }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#8b8fa3', fontSize: '0.95rem', maxWidth: '400px', marginBottom: '24px' }}>
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
