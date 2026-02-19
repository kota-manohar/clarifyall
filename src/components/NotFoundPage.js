import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from './SEO';
import '../styles/NotFoundPage.css';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <SEO 
        title="404 - Page Not Found | Clarifyall"
        description="The page you're looking for doesn't exist. Browse our AI tools directory, prompts library, or blog articles to find what you need."
        noindex={true}
      />
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="not-found-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">Page Not Found</h2>
          <p className="not-found-description">
            Oops! The page you're looking for doesn't exist or has been moved.
            <br />
            Don't worry, we've got plenty of AI tools, prompts, and articles to explore!
          </p>
          
          <div className="not-found-actions">
            <Link to="/" className="not-found-btn primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Homepage
            </Link>
            <button 
              className="not-found-btn secondary" 
              onClick={() => navigate(-1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Go Back
            </button>
          </div>

          <div className="not-found-links">
            <h3>Popular Pages</h3>
            <div className="not-found-link-grid">
              <Link to="/" className="not-found-link-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <path d="M17 21v-8H7v8" />
                  <path d="M7 3v5h8" />
                </svg>
                <span>AI Tools Directory</span>
              </Link>
              <Link to="/prompts" className="not-found-link-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span>AI Prompts Library</span>
              </Link>
              <Link to="/blog" className="not-found-link-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
                <span>Blog Articles</span>
              </Link>
              <Link to="/categories" className="not-found-link-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Browse Categories</span>
              </Link>
            </div>
          </div>

          <div className="not-found-search">
            <h3>Search for AI Tools</h3>
            <p>Use our search to find the AI tools you're looking for:</p>
            <Link to="/" className="not-found-search-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search AI Tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;


