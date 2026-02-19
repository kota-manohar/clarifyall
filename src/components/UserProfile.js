import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import userActivityService from '../services/userActivityService';
import SEO from './SEO';
import EditProfileModal from './EditProfileModal';
import { buildUploadUrl } from '../utils/constants';
import '../styles/UserProfile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('submitted');
  
  // Dashboard features
  const [stats, setStats] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommendedTools, setRecommendedTools] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);

  // If on /my-profile route, use current user's ID
  const actualUserId = location.pathname === '/my-profile' 
    ? (currentUser?.id?.toString() || userId || null) 
    : (userId || null);

  // Check if this is the current user's own profile
  // Compare as both string and number to handle type mismatches
  const isOwnProfile = currentUser && actualUserId && (
    currentUser.id?.toString() === actualUserId?.toString() ||
    parseInt(currentUser.id) === parseInt(actualUserId)
  );
  
  // Determine if edit button should be shown
  // Show if on /my-profile route OR if user ID matches current user
  const shouldShowEditButton = currentUser && (
    location.pathname === '/my-profile' || 
    isOwnProfile
  );
  
  // Debug logging (remove in production)
  console.log('UserProfile Debug:', {
    currentUser: currentUser?.id,
    currentUserName: currentUser?.name,
    actualUserId,
    isOwnProfile,
    shouldShowEditButton,
    pathname: location.pathname,
    userId
  });

  useEffect(() => {
    if (actualUserId) {
      loadProfile();
      if (isOwnProfile || location.pathname === '/my-profile') {
        loadDashboardData();
      }
    }
  }, [actualUserId, isOwnProfile, location.pathname]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await userService.getUserProfile(actualUserId);
      setProfile(profileData.user || profileData);
      
      // Load user's submitted tools
      const toolsData = await userService.getUserTools(actualUserId);
      setTools(toolsData.tools || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const userIdNum = parseInt(actualUserId);
      
      // Load all dashboard data in parallel
      const [statsData, recentlyViewedData, recommendedData, activityData] = await Promise.all([
        userActivityService.getUserStats(userIdNum),
        userActivityService.getRecentlyViewed(userIdNum, 8),
        userActivityService.getRecommendedTools(userIdNum, 6),
        userActivityService.getUserActivity(userIdNum, 10, 30)
      ]);
      
      setStats(statsData);
      setRecentlyViewed(recentlyViewedData.tools || []);
      setRecommendedTools(recommendedData.tools || []);
      setUserActivity(activityData.activities || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  const loadSavedTools = async () => {
    try {
      const savedData = await userService.getSavedTools();
      setTools(savedData.tools || []);
    } catch (err) {
      setError('Failed to load saved tools');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'saved' && isOwnProfile) {
      loadSavedTools();
    } else {
      loadProfile();
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <h2>User Not Found</h2>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <SEO 
        title={`${profile.name} - Profile | Clarifyall`}
        description={`View ${isOwnProfile ? 'your' : profile.name + "'s"} profile. ${tools.length} submitted tools.`}
        keywords={`${profile.name}, user profile, AI tools, submissions`}
        dynamicKeywords={{ userName: profile.name, totalTools: tools.length }}
        canonicalUrl={`/profile/${actualUserId}`}
        schemaType="website"
      />
      
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-large">
            {profile.avatar_url || profile.avatarUrl ? (
              <img src={profile.avatar_url || profile.avatarUrl} alt={profile.name} />
            ) : (
              <span>{profile.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="profile-info">
            <h1>{profile.name}</h1>
            <p className="profile-email">{profile.email}</p>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            
            {/* Enhanced Stats for Dashboard */}
            {isOwnProfile && stats && (
              <div className="profile-stats-enhanced">
                <div className="stat-card">
                  <div className="stat-icon">👁️</div>
                  <div className="stat-content">
                    <span className="stat-value">{stats.total_views || 0}</span>
                    <span className="stat-label">Tools Viewed</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <span className="stat-value">{stats.total_saved || 0}</span>
                    <span className="stat-label">Tools Saved</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <span className="stat-value">{stats.total_submitted || 0}</span>
                    <span className="stat-label">Submitted</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-content">
                    <span className="stat-value">{stats.recent_activity || 0}</span>
                    <span className="stat-label">Activity (30d)</span>
                  </div>
                </div>
                {stats.top_category && (
                  <div className="stat-card stat-card-category">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-content">
                      <span className="stat-label">Top Category</span>
                      <span className="stat-value-small">{stats.top_category}</span>
                      <span className="stat-label-small">{stats.top_category_views} views</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Basic Stats for others */}
            {!isOwnProfile && (
              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-value">{tools.length}</span>
                  <span className="stat-label">Tools Submitted</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{profile.saveCount || 0}</span>
                  <span className="stat-label">Tools Saved</span>
                </div>
              </div>
            )}
            
            {shouldShowEditButton && (
              <div className="profile-actions">
                <button 
                  className="btn-edit-profile"
                  onClick={() => setShowEditModal(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </button>
                <Link to="/my-submissions" className="btn-secondary-profile">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  My Submissions
                </Link>
                <Link to="/saved-tools" className="btn-secondary-profile">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                  Saved Tools
                </Link>
                <Link to="/my-collections" className="btn-secondary-profile">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  My Collections
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Sections for Own Profile */}
        {isOwnProfile && (
          <>
            {/* Recently Viewed Tools */}
            {recentlyViewed.length > 0 && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Recently Viewed</h2>
                  <Link to="/recently-viewed" className="view-all-link">View All</Link>
                </div>
                <div className="tools-grid">
                  {recentlyViewed.map((tool) => (
                    <Link key={tool.id} to={`/tool/${tool.id}`} className="tool-card-link">
                      <div className="tool-card">
                        <div className="tool-card-header">
                          <img
                            src={tool.logo_url || tool.logoUrl || '/default-logo.png'}
                            alt={tool.name}
                            className="tool-logo"
                          />
                          <h3>{tool.name}</h3>
                        </div>
                        <p className="tool-description" title={tool.description || tool.shortDescription || ''}>
                          {tool.description || tool.shortDescription || ''}
                        </p>
                        <div className="tool-card-footer">
                          <span className="tool-pricing">{tool.pricing_model || tool.pricingModel}</span>
                          <span className="viewed-time">
                            {new Date(tool.viewed_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Tools */}
            {recommendedTools.length > 0 && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Recommended for You</h2>
                  <span className="section-subtitle">Based on your viewing history</span>
                </div>
                <div className="tools-grid">
                  {recommendedTools.map((tool) => (
                    <Link key={tool.id} to={`/tool/${tool.id}`} className="tool-card-link">
                      <div className="tool-card">
                        <div className="tool-card-header">
                          <img
                            src={tool.logo_url || tool.logoUrl || '/default-logo.png'}
                            alt={tool.name}
                            className="tool-logo"
                            onError={(e) => {
                              e.target.src = '/default-logo.png';
                            }}
                          />
                          <h3>{tool.name}</h3>
                        </div>
                        <p className="tool-description">
                          {(tool.description || tool.shortDescription || 'No description available').substring(0, 80)}
                          {(tool.description || tool.shortDescription || '').length > 80 ? '...' : ''}
                        </p>
                        <div className="tool-card-footer">
                          <span className="tool-pricing">{tool.pricing_model || tool.pricingModel || 'FREE'}</span>
                          {tool.category_name && (
                            <span className="tool-category">{tool.category_name}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {userActivity.length > 0 && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Recent Activity</h2>
                </div>
                <div className="activity-list">
                  {userActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {activity.activity_type === 'VIEW' && '👁️'}
                        {activity.activity_type === 'SAVE' && '⭐'}
                        {activity.activity_type === 'UNSAVE' && '💔'}
                        {activity.activity_type === 'SHARE' && '🔗'}
                        {activity.activity_type === 'VISIT_WEBSITE' && '🌐'}
                        {activity.activity_type === 'CLICK' && '👆'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-main">
                          <Link to={`/tool/${activity.tool_id}`} className="activity-tool-name">
                            {activity.tool_name}
                          </Link>
                          <span className="activity-type">
                            {activity.activity_type.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                        <div className="activity-meta">
                          {activity.category_name && (
                            <span className="activity-category">{activity.category_name}</span>
                          )}
                          <span className="activity-time">
                            {new Date(activity.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'submitted' ? 'active' : ''}`}
            onClick={() => handleTabChange('submitted')}
          >
            Submitted Tools
          </button>
          {isOwnProfile && (
            <button
              className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => handleTabChange('saved')}
            >
              Saved Tools
            </button>
          )}
        </div>

        {/* Tools Grid */}
        <div className="profile-tools">
          {tools.length === 0 ? (
            <div className="no-tools">
              <p>
                {activeTab === 'submitted'
                  ? 'No tools submitted yet'
                  : 'No saved tools yet'}
              </p>
              {isOwnProfile && activeTab === 'submitted' && (
                <Link to="/submit" className="btn-primary">
                  Submit Your First Tool
                </Link>
              )}
            </div>
          ) : (
            <div className="tools-grid">
              {tools.map((tool) => {
                const getDefaultLogo = (toolName) => {
                  const firstLetter = toolName ? toolName.charAt(0).toUpperCase() : 'A';
                  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23667eea" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle"%3E${firstLetter}%3C/text%3E%3C/svg%3E`;
                };
                
                return (
                  <div key={tool.id} className="tool-card">
                    <div className="tool-card-header">
                      <img
                        src={buildUploadUrl(tool.logo_url) || tool.logoUrl || getDefaultLogo(tool.name)}
                        alt={tool.name}
                        className="tool-logo"
                        onError={(e) => {
                          e.target.src = getDefaultLogo(tool.name);
                        }}
                      />
                      <h3>{tool.name}</h3>
                    </div>
                    <p className="tool-description" title={tool.shortDescription || tool.description}>
                      {tool.shortDescription || tool.description}
                    </p>
                    <div className="tool-card-footer">
                      <span className="tool-pricing">{tool.pricingModel}</span>
                      <Link to={`/tool/${tool.id}`} className="btn-view">
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={profile}
          onUpdate={(updatedUser) => {
            setProfile(updatedUser);
            // Reload profile data
            loadProfile();
            // Update local storage if it's current user
            if (isOwnProfile && currentUser) {
              const userStr = localStorage.getItem('user');
              if (userStr) {
                const localUser = JSON.parse(userStr);
                localStorage.setItem('user', JSON.stringify({ ...localUser, ...updatedUser }));
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default UserProfile;
