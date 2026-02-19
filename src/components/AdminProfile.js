import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/AdminProfile.css';

function AdminProfile() {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadAdminProfile();
  }, []);

  const loadAdminProfile = async () => {
    try {
      setLoading(true);
      const adminData = localStorage.getItem('adminUser');
      if (adminData) {
        const user = JSON.parse(adminData);
        setAdminUser(user);
        
        // Also fetch latest from API
        try {
          const response = await api.get(`/users.php?action=admin_profile&user_id=${user.id}`);
          if (response.data && response.data.user) {
            setAdminUser(response.data.user);
            localStorage.setItem('adminUser', JSON.stringify(response.data.user));
          }
        } catch (e) {
          // If API fails, use cached data
          console.warn('Failed to fetch latest profile, using cached data');
        }
      } else {
        setError('No admin user found. Please login again.');
      }
    } catch (err) {
      console.error('Error loading admin profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      if (!adminUser.id) {
        setError('Admin user not found. Please login again.');
        return;
      }
      
      const response = await api.put('/users.php?action=change_password', {
        user_id: adminUser.id,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.data && response.data.success) {
        setSuccess('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
      } else {
        setError(response.data?.error || 'Failed to change password');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-header">
        <h1>Admin Profile</h1>
        <p className="text-muted">Manage your profile and security settings</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      <div className="profile-card">
        <div className="profile-info">
          <div className="profile-avatar">
            {adminUser?.avatar_url ? (
              <img src={adminUser.avatar_url} alt={adminUser.name || 'Admin'} />
            ) : (
              <div className="avatar-placeholder">
                {(adminUser?.name || adminUser?.email || 'A').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-details">
            <h2>{adminUser?.name || 'Admin User'}</h2>
            <p className="profile-email">{adminUser?.email || 'No email set'}</p>
            <p className="profile-role">
              <span className="badge badge-admin">Administrator</span>
            </p>
            {adminUser?.created_at && (
              <p className="profile-meta">
                Member since: {new Date(adminUser.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="profile-actions-card">
        <h3>Security Settings</h3>
        
        {!showPasswordForm ? (
          <div className="action-item">
            <div className="action-info">
              <h4>Change Password</h4>
              <p>Update your account password for better security</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowPasswordForm(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </button>
          </div>
        ) : (
          <form className="password-change-form" onSubmit={handlePasswordChange}>
            <h4>Change Password</h4>
            
            <div className="form-group">
              <label>Current Password *</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label>New Password *</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password *</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
                required
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={changingPassword}
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setError('');
                  setSuccess('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminProfile;

