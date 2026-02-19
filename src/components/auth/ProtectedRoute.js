import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireVerified = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="6"/>
              <path d="M24 4C13.507 4 5 12.507 5 23" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 24 24"
                  to="360 24 24"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </div>
          <p style={{ marginTop: '1rem', color: '#6B7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if email verification is required
  // Backend returns is_verified (snake_case), so check both for compatibility
  // Handle boolean, number (0/1), and string ('0'/'1', 'true'/'false') values
  const isVerified = (() => {
    const value = user?.is_verified ?? user?.isVerified;
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value === true;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === '1' || lower === 'true' || lower === 'yes' || lower === 'on';
    }
    return false;
  })();
  
  if (requireVerified && user && !isVerified) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '4rem auto',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#FEF3C7',
        borderRadius: '8px',
        border: '1px solid #FCD34D'
      }}>
        <h2 style={{ color: '#92400E', marginBottom: '1rem' }}>Email Verification Required</h2>
        <p style={{ color: '#78350F', marginBottom: '1.5rem' }}>
          Please verify your email address to access this feature. Check your inbox for the verification link.
        </p>
        <button
          onClick={async () => {
            try {
              const authService = await import('../../services/authService');
              await authService.authService.resendVerification();
              alert('Verification email sent! Please check your inbox.');
            } catch (error) {
              alert('Failed to resend verification email. Please try again.');
            }
          }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#F59E0B',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Resend Verification Email
        </button>
      </div>
    );
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;
