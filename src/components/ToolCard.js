import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import api from '../services/api';
import '../styles/ToolCard.css';

function ToolCard({ tool }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [viewCount, setViewCount] = useState(tool.view_count || tool.viewCount || 0);
  const [saveCount, setSaveCount] = useState(tool.save_count || tool.saveCount || 0);
  const [loading, setLoading] = useState(false);

  // Check if tool is saved when component mounts
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (isAuthenticated && tool.id) {
        try {
          const response = await userService.checkSavedTool(tool.id);
          setIsSaved(response.isSaved);
        } catch (error) {
          console.error('Error checking saved status:', error);
        }
      }
    };
    checkSavedStatus();
  }, [isAuthenticated, tool.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    if (!isAuthenticated) {
      // Redirect to login
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    setLoading(true);

    try {
      if (isSaved) {
        // Unsave the tool
        await userService.unsaveTool(tool.id);
        setIsSaved(false);
        setSaveCount(prev => Math.max(0, prev - 1));
      } else {
        // Save the tool
        await userService.saveTool(tool.id);
        setIsSaved(true);
        setSaveCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error saving/unsaving tool:', error);
      // Revert the state if there was an error
      setIsSaved(!isSaved);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitWebsite = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Get the website URL
    let websiteUrl = tool.website_url || tool.websiteUrl;

    // Check if URL exists
    if (!websiteUrl) {
      console.warn('No website URL available for this tool');
      return;
    }

    // Ensure URL has protocol
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl;
    }

    // Open website immediately (don't wait for API call)
    window.open(websiteUrl, '_blank', 'noopener,noreferrer');

    // Increment view count in background (non-blocking)
    api.post(`/tools/${tool.id}/view`)
      .then(() => {
        setViewCount(prev => prev + 1);
      })
      .catch(error => {
        console.error('Error incrementing view count:', error);
      });
  };

  const getPricingBadgeClass = (pricing) => {
    const classes = {
      'FREE': 'pricing-free',
      'FREEMIUM': 'pricing-freemium',
      'FREE_TRIAL': 'pricing-trial',
      'PAID': 'pricing-paid'
    };
    return classes[pricing] || 'pricing-default';
  };

  const getPricingLabel = (pricing) => {
    const labels = {
      'FREE': 'Free',
      'FREEMIUM': 'Freemium',
      'FREE_TRIAL': 'Free Trial',
      'PAID': 'Paid'
    };
    return labels[pricing] || pricing;
  };

  const defaultLogo = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23667eea" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle"%3E' + (tool.name ? tool.name.charAt(0) : 'A') + '%3C/text%3E%3C/svg%3E';

  return (
    <Link to={`/tool/${tool.slug || tool.id}`} className="tool-card-link">
      <article className="tool-card">
        <div className="tool-card-header">
          <div className="tool-logo-wrapper">
            <img
              src={imageError ? defaultLogo : (tool.logo_url || tool.logoUrl || defaultLogo)}
              alt={`${tool.name} logo`}
              className="tool-logo"
              width="80"
              height="80"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </div>

          <div className="tool-header-info">
            <h3 className="tool-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0, marginBottom: '4px' }}>
              {tool.name}
              {tool.verified === 1 && (
                <span title="Tool Verified" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <path d="M16.6453 7.03281C16.3508 6.725 16.0461 6.40781 15.9312 6.12891C15.825 5.87344 15.8187 5.45 15.8125 5.03984C15.8008 4.27734 15.7883 3.41328 15.1875 2.8125C14.5867 2.21172 13.7227 2.19922 12.9602 2.1875C12.55 2.18125 12.1266 2.175 11.8711 2.06875C11.593 1.95391 11.275 1.64922 10.9672 1.35469C10.4281 0.836719 9.81563 0.25 9 0.25C8.18437 0.25 7.57266 0.836719 7.03281 1.35469C6.725 1.64922 6.40781 1.95391 6.12891 2.06875C5.875 2.175 5.45 2.18125 5.03984 2.1875C4.27734 2.19922 3.41328 2.21172 2.8125 2.8125C2.21172 3.41328 2.20312 4.27734 2.1875 5.03984C2.18125 5.45 2.175 5.87344 2.06875 6.12891C1.95391 6.40703 1.64922 6.725 1.35469 7.03281C0.836719 7.57188 0.25 8.18437 0.25 9C0.25 9.81563 0.836719 10.4273 1.35469 10.9672C1.64922 11.275 1.95391 11.5922 2.06875 11.8711C2.175 12.1266 2.18125 12.55 2.1875 12.9602C2.19922 13.7227 2.21172 14.5867 2.8125 15.1875C3.41328 15.7883 4.27734 15.8008 5.03984 15.8125C5.45 15.8187 5.87344 15.825 6.12891 15.9312C6.40703 16.0461 6.725 16.3508 7.03281 16.6453C7.57188 17.1633 8.18437 17.75 9 17.75C9.81563 17.75 10.4273 17.1633 10.9672 16.6453C11.275 16.3508 11.5922 16.0461 11.8711 15.9312C12.1266 15.825 12.55 15.8187 12.9602 15.8125C13.7227 15.8008 14.5867 15.7883 15.1875 15.1875C15.7883 14.5867 15.8008 13.7227 15.8125 12.9602C15.8187 12.55 15.825 12.1266 15.9312 11.8711C16.0461 11.593 16.3508 11.275 16.6453 10.9672C17.1633 10.4281 17.75 9.81563 17.75 9C17.75 8.18437 17.1633 7.57266 16.6453 7.03281ZM12.5672 7.56719L8.19219 11.9422C8.13414 12.0003 8.06521 12.0464 7.98934 12.0779C7.91346 12.1093 7.83213 12.1255 7.75 12.1255C7.66787 12.1255 7.58654 12.1093 7.51066 12.0779C7.43479 12.0464 7.36586 12.0003 7.30781 11.9422L5.43281 10.0672C5.31554 9.94991 5.24965 9.79085 5.24965 9.625C5.24965 9.45915 5.31554 9.30009 5.43281 9.18281C5.55009 9.06554 5.70915 8.99965 5.875 8.99965C6.04085 8.99965 6.19991 9.06554 6.31719 9.18281L7.75 10.6164L11.6828 6.68281C11.7409 6.62474 11.8098 6.57868 11.8857 6.54725C11.9616 6.51583 12.0429 6.49965 12.125 6.49965C12.2071 6.49965 12.2884 6.51583 12.3643 6.54725C12.4402 6.57868 12.5091 6.62474 12.5672 6.68281C12.6253 6.74088 12.6713 6.80982 12.7027 6.88569C12.7342 6.96156 12.7503 7.04288 12.7503 7.125C12.7503 7.20712 12.7342 7.28844 12.7027 7.36431C12.6713 7.44018 12.6253 7.50912 12.5672 7.56719Z" fill="#49ADFF"></path>
                  </svg>
                </span>
              )}
            </h3>
            <span className={`pricing-badge ${getPricingBadgeClass(tool.pricing_model || tool.pricingModel)}`}>
              {getPricingLabel(tool.pricing_model || tool.pricingModel)}
            </span>
          </div>

          <button
            className={`save-button ${isSaved ? 'saved' : ''}`}
            onClick={handleSave}
            aria-label={isSaved ? 'Unsave tool' : 'Save tool'}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke={isSaved ? 'none' : 'currentColor'} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <div className="tool-card-body">
          <p className="tool-description" title={tool.short_description || tool.shortDescription || tool.description}>
            {tool.short_description || tool.shortDescription || tool.description}
          </p>

          <div className="tool-categories">
            {tool.categories && tool.categories.slice(0, 2).map((category, index) => (
              <span key={index} className="category-tag">
                {category.name}
              </span>
            ))}
            {tool.categories && tool.categories.length > 2 && (
              <span className="category-tag category-more">
                +{tool.categories.length - 2}
              </span>
            )}
          </div>
        </div>

        <div className="tool-card-footer">
          <div className="tool-card-stats">
            <div className="stat" title="Views" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{viewCount}</span>
            </div>
            <div className="stat" title="Saves" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{saveCount}</span>
            </div>
          </div>

          {(tool.website_url || tool.websiteUrl) && (
            <button
              className="visit-website-btn"
              onClick={handleVisitWebsite}
              title={`Visit ${tool.name}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Visit
            </button>
          )}
        </div>
      </article>
    </Link>
  );
}

export default ToolCard;
