import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import SEO from './SEO';
import { buildUploadUrl } from '../utils/constants';
import '../styles/SavedToolsPage.css';

const SavedToolsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const [filters, setFilters] = useState({ search: '' });

  const getDefaultLogo = (toolName) => {
    const firstLetter = toolName ? toolName.charAt(0).toUpperCase() : 'A';
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23667eea" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle"%3E${firstLetter}%3C/text%3E%3C/svg%3E`;
  };

  const getLogoUrl = (logoUrl) => {
    if (!logoUrl) return null;
    return buildUploadUrl(logoUrl);
  };

  const handleImageError = (toolId) => {
    setImageErrors(prev => ({ ...prev, [toolId]: true }));
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadSavedTools();
  }, [user, filters]);

  const loadSavedTools = async () => {
    try {
      setLoading(true);
      const response = await userService.getSavedTools();
      
      // Filter tools
      let filteredTools = response.tools || [];
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredTools = filteredTools.filter(tool => 
          tool.name.toLowerCase().includes(searchLower) ||
          (tool.description && tool.description.toLowerCase().includes(searchLower)) ||
          (tool.shortDescription && tool.shortDescription.toLowerCase().includes(searchLower))
        );
      }
      
      setTools(filteredTools);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load saved tools');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (toolId) => {
    try {
      await userService.unsaveTool(toolId);
      setTools(tools.filter(tool => tool.id !== toolId));
    } catch (err) {
      alert('Failed to unsave tool');
    }
  };

  if (loading) {
    return (
      <div className="saved-tools-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your saved tools...</p>
        </div>
      </div>
    );
  }

  const filteredTools = tools;

  return (
    <div className="saved-tools-page">
      <SEO 
        title="My Saved Tools - Bookmarked AI Tools | Clarifyall"
        description={`View and manage your saved AI tools. ${tools.length > 0 ? `You have ${tools.length} saved tools.` : 'Start saving your favorite AI tools for easy access.'}`}
        keywords="saved tools, bookmarked tools, favorite AI tools, saved AI tools"
        dynamicKeywords={{ totalSaved: tools.length }}
        canonicalUrl="/saved-tools"
        schemaType="website"
      />
      
      <div className="saved-tools-container">
        <div className="page-header">
          <div className="header-content">
            <h1>My Saved Tools</h1>
            <p>Tools you've bookmarked for later</p>
            {tools.length > 0 && (
              <div className="save-count">
                {tools.length} {tools.length === 1 ? 'tool' : 'tools'} saved
              </div>
            )}
          </div>
        </div>

        {/* Search Filter */}
        {tools.length > 0 && (
          <div className="search-filter">
            <div className="search-group">
              <input
                type="text"
                placeholder="Search saved tools..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="search-input"
              />
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {filteredTools.length === 0 ? (
          <div className="no-saved-tools">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path d="M60 15L75 45H105L81 63L90 93L60 75L30 93L39 63L15 45H45L60 15Z" stroke="#D1D5DB" strokeWidth="3" fill="none"/>
            </svg>
            <h2>
              {filters.search ? 'No tools found' : 'No Saved Tools Yet'}
            </h2>
            <p>
              {filters.search 
                ? 'Try adjusting your search'
                : 'Start exploring and save your favorite AI tools'}
            </p>
            {!filters.search && (
              <Link to="/" className="btn btn-primary">
                Explore Tools
              </Link>
            )}
          </div>
        ) : (
          <div className="saved-tools-grid">
            {filteredTools.map((tool) => (
              <div key={tool.id} className="saved-tool-card">
                <button
                  className="unsave-button"
                  onClick={() => handleUnsave(tool.id)}
                  title="Remove from saved"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3.22l-.61-.6a5.5 5.5 0 0 0-7.78 7.77L10 18.78l8.39-8.4a5.5 5.5 0 0 0-7.78-7.77l-.61.61z"/>
                  </svg>
                </button>
                
                <div className="tool-card-content">
                  <div className="tool-header">
                    <img
                      src={imageErrors[tool.id] ? getDefaultLogo(tool.name) : (getLogoUrl(tool.logo_url || tool.logoUrl) || getDefaultLogo(tool.name))}
                      alt={`${tool.name} logo`}
                      className="tool-logo"
                      onError={() => handleImageError(tool.id)}
                    />
                    <div className="tool-header-info">
                      <h3>{tool.name}</h3>
                      <span className="tool-pricing">{tool.pricing_model || tool.pricingModel || 'FREE'}</span>
                    </div>
                  </div>
                  
                  <p className="tool-description" title={tool.description || tool.shortDescription || 'No description available'}>
                    {tool.description || tool.shortDescription || 'No description available'}
                  </p>
                  
                  {(tool.categoryNames || tool.category_name) && (
                    <div className="tool-categories">
                      {(tool.categoryNames || tool.category_name || '').split(',').slice(0, 3).map((cat, idx) => (
                        <span key={idx} className="category-tag">{cat.trim()}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className="tool-card-footer">
                    <span className="saved-date">
                      Saved {tool.created_at || tool.savedAt 
                        ? new Date(tool.created_at || tool.savedAt).toLocaleDateString()
                        : 'Recently'}
                    </span>
                    <Link to={`/tool/${tool.id}`} className="btn btn-secondary">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedToolsPage;
