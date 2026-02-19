import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import SEO from './SEO';
import { buildUploadUrl } from '../utils/constants';
import '../styles/MySubmissionsPage.css';

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444'
};

const STATUS_LABELS = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

function MySubmissionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadSubmissions();
  }, [user, filters]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserTools(user.id);
      
      // Filter submissions
      let filteredTools = response.tools || [];
      
      if (filters.status !== 'all') {
        filteredTools = filteredTools.filter(tool => tool.status === filters.status);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredTools = filteredTools.filter(tool => 
          tool.name.toLowerCase().includes(searchLower) ||
          (tool.description && tool.description.toLowerCase().includes(searchLower))
        );
      }
      
      setSubmissions(filteredTools);
      setError('');
    } catch (err) {
      console.error('Error loading submissions:', err);
      setError('Failed to load your submissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const color = STATUS_COLORS[status] || '#6b7280';
    const label = STATUS_LABELS[status] || status;
    
    return (
      <span 
        className="status-badge" 
        style={{ 
          backgroundColor: `${color}15`,
          color: color,
          borderColor: color
        }}
      >
        {label}
      </span>
    );
  };

  const getDefaultLogo = (toolName) => {
    const firstLetter = toolName ? toolName.charAt(0).toUpperCase() : 'A';
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23667eea" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle"%3E${firstLetter}%3C/text%3E%3C/svg%3E`;
  };

  const handleDelete = async (toolId) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Implement delete API endpoint
      alert('Delete functionality coming soon');
    } catch (err) {
      alert('Failed to delete submission');
    }
  };

  const filteredSubmissions = submissions;

  if (loading) {
    return (
      <div className="my-submissions-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-submissions-page">
      <SEO 
        title="My Submissions - Manage Your AI Tools | Clarifyall"
        description="View and manage your submitted AI tools. Track the status of your submissions and see which tools have been approved."
        keywords="my submissions, submitted tools, AI tool submission, tool status"
        dynamicKeywords={{ type: 'submissions' }}
        canonicalUrl="/my-submissions"
        schemaType="website"
      />
      
      <div className="submissions-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>My Submissions</h1>
            <p>Track and manage your submitted AI tools</p>
          </div>
          <Link to="/submit" className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16m8-8H4" />
            </svg>
            Submit New Tool
          </Link>
        </div>

        {/* Filters */}
        <div className="submissions-filters">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          
          <div className="filter-group search-group">
            <input
              type="text"
              placeholder="Search submissions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="search-input"
            />
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div className="submissions-stats">
          <div className="stat-card">
            <div className="stat-value">{submissions.length}</div>
            <div className="stat-label">Total Submissions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{submissions.filter(s => s.status === 'APPROVED').length}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{submissions.filter(s => s.status === 'PENDING').length}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{submissions.filter(s => s.status === 'REJECTED').length}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Submissions Grid */}
        {filteredSubmissions.length === 0 ? (
          <div className="no-submissions">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path d="M60 15L75 45H105L81 63L90 93L60 75L30 93L39 63L15 45H45L60 15Z" stroke="#D1D5DB" strokeWidth="3" fill="none"/>
            </svg>
            <h2>
              {filters.status !== 'all' || filters.search
                ? 'No submissions found'
                : 'No Submissions Yet'}
            </h2>
            <p>
              {filters.status !== 'all' || filters.search
                ? 'Try adjusting your filters'
                : 'Start sharing AI tools with the community'}
            </p>
            {(!filters.status || filters.status === 'all') && !filters.search && (
              <Link to="/submit" className="btn btn-primary">
                Submit Your First Tool
              </Link>
            )}
          </div>
        ) : (
          <div className="submissions-grid">
            {filteredSubmissions.map((tool) => (
              <div key={tool.id} className="submission-card">
                <div className="submission-header">
                  <img
                    src={buildUploadUrl(tool.logo_url) || getDefaultLogo(tool.name)}
                    alt={tool.name}
                    className="submission-logo"
                    onError={(e) => {
                      e.target.src = getDefaultLogo(tool.name);
                    }}
                  />
                  <div className="submission-info">
                    <h3>{tool.name}</h3>
                    {getStatusBadge(tool.status)}
                  </div>
                </div>
                
                <p className="submission-description">
                  {tool.description || tool.shortDescription || 'No description available'}
                </p>
                
                <div className="submission-meta">
                  <span className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3h18v18H3zM9 9h6v6H9z" />
                    </svg>
                    {tool.pricing_model || 'FREE'}
                  </span>
                  {tool.view_count !== undefined && (
                    <span className="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {tool.view_count || 0} views
                    </span>
                  )}
                  <span className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {tool.created_at 
                      ? new Date(tool.created_at).toLocaleDateString()
                      : 'Recently'}
                  </span>
                </div>
                
                <div className="submission-actions">
                  <Link to={`/tool/${tool.id}`} className="btn btn-secondary">
                    View Details
                  </Link>
                  {tool.status === 'PENDING' && (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(tool.id)}
                      title="Delete submission"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MySubmissionsPage;

