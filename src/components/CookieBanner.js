import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/CookieBanner.css';

function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a short delay for better UX
      setTimeout(() => {
        setIsVisible(true);
      }, 500);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    closeBanner();
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    closeBanner();
  };

  const handleClose = () => {
    closeBanner();
  };

  const closeBanner = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`cookie-banner ${isClosing ? 'cookie-banner-closing' : ''}`}>
      <div className="cookie-banner-container">
        <div className="cookie-banner-content">
          <div className="cookie-banner-icon">🍪</div>
          <div className="cookie-banner-text">
            <h3 className="cookie-banner-title">About Cookies on This Site</h3>
            <p className="cookie-banner-description">
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
              By clicking "Accept All", you consent to our use of cookies. You can also choose to reject non-essential cookies.
              <Link to="/cookies" className="cookie-banner-link">Learn more about our cookie policy</Link>.
            </p>
          </div>
          <button 
            className="cookie-banner-close" 
            onClick={handleClose}
            aria-label="Close cookie banner"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="cookie-banner-actions">
          <button 
            className="cookie-banner-btn cookie-banner-btn-reject" 
            onClick={handleReject}
          >
            Reject All
          </button>
          <button 
            className="cookie-banner-btn cookie-banner-btn-accept" 
            onClick={handleAccept}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;

