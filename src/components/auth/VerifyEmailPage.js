import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { updateUser, checkAuth } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await authService.verifyEmail(token);
      setStatus('success');
      setMessage(response.message || 'Email verified successfully!');
      
      // Update auth context with verified user
      if (response.user) {
        // Normalize is_verified - ensure both formats exist for compatibility
        const user = response.user;
        if (user.is_verified !== undefined) {
          user.isVerified = user.is_verified === 1 || user.is_verified === true || user.is_verified === '1';
        }
        updateUser(user);
      } else {
        // Refresh auth context to get updated user data
        await checkAuth();
      }
      
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || err.message || 'Failed to verify email');
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await authService.resendVerification();
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="loading-spinner">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="8"/>
                  <path d="M32 4C16.536 4 4 16.536 4 32" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 32 32"
                      to="360 32 32"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
              </div>
              <h1>Verifying Your Email</h1>
              <p>Please wait while we verify your email address...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="success-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="32" fill="#10B981" opacity="0.1"/>
                  <path d="M20 32L28 40L44 24" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1>Email Verified!</h1>
              <p>{message}</p>
            </div>

            <p className="auth-redirect">Redirecting to login page...</p>

            <Link to="/login" className="auth-button">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="error-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="#EF4444" opacity="0.1"/>
                <path d="M32 20v16M32 44h.01" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1>Verification Failed</h1>
            <p>{message}</p>
          </div>

          <div className="auth-info">
            <p><strong>Possible reasons:</strong></p>
            <ul>
              <li>The verification link has expired</li>
              <li>The link has already been used</li>
              <li>The link is invalid or corrupted</li>
            </ul>
          </div>

          <button 
            onClick={handleResendVerification}
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>

          <div className="auth-switch">
            <p>
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
