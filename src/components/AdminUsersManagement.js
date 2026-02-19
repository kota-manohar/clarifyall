import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/AdminUsersManagement.css';

function AdminUsersManagement() {
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  
  // Add admin form
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Edit admin form
  const [editAdmin, setEditAdmin] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/users.php?action=list_admins');
      if (response.data && response.data.admins) {
        setAdminUsers(response.data.admins);
      }
    } catch (err) {
      console.error('Error loading admin users:', err);
      setError('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      setError('All fields are required');
      return;
    }

    if (newAdmin.password !== newAdmin.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newAdmin.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdmin.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/users.php?action=create_admin', {
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password
      });

      if (response.data.success) {
        setSuccess('Admin user created successfully!');
        setNewAdmin({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setShowAddForm(false);
        loadAdminUsers();
      } else {
        setError(response.data.error || 'Failed to create admin user');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create admin user');
    } finally {
      setCreating(false);
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setEditAdmin({
      name: admin.name || '',
      email: admin.email || '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editAdmin.name || !editAdmin.email) {
      setError('Name and email are required');
      return;
    }

    // If password is provided, validate it
    if (editAdmin.password) {
      if (editAdmin.password !== editAdmin.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (editAdmin.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editAdmin.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setUpdating(true);
      const updateData = {
        user_id: editingAdmin.id,
        name: editAdmin.name,
        email: editAdmin.email
      };

      // Only include password if it's provided
      if (editAdmin.password) {
        updateData.password = editAdmin.password;
      }

      const response = await api.post('/users.php?action=update_admin', updateData);

      if (response.data.success) {
        setSuccess('Admin user updated successfully!');
        setEditingAdmin(null);
        setEditAdmin({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        loadAdminUsers();
      } else {
        setError(response.data.error || 'Failed to update admin user');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update admin user');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) {
      return;
    }

    // Prevent deleting yourself
    const currentAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (currentAdmin.id === userId) {
      setError('You cannot delete your own account');
      return;
    }

    try {
      const response = await api.delete(`/users.php/${userId}?action=delete_admin`);
      if (response.data && response.data.success) {
        setSuccess('Admin user deleted successfully');
        setError('');
        loadAdminUsers();
      } else {
        setError(response.data?.error || 'Failed to delete admin user');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete admin user');
    }
  };

  const handleCancelEdit = () => {
    setEditingAdmin(null);
    setEditAdmin({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <div>
          <h1>Admin Users Management</h1>
          <p className="text-muted">Create and manage administrator accounts</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v16m8-8H4" />
          </svg>
          {showAddForm ? 'Cancel' : 'Add Admin User'}
        </button>
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

      {showAddForm && (
        <div className="add-admin-card">
          <h3>Create New Admin User</h3>
          <form onSubmit={handleCreateAdmin}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                placeholder="Enter admin full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                placeholder="Enter admin email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                placeholder="Enter password (min 6 characters)"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                value={newAdmin.confirmPassword}
                onChange={(e) => setNewAdmin({...newAdmin, confirmPassword: e.target.value})}
                placeholder="Confirm password"
                required
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Admin User'}
              </button>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setNewAdmin({
                    name: '',
                    email: '',
                    password: '',
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
        </div>
      )}

      {editingAdmin && (
        <div className="add-admin-card">
          <h3>Edit Admin User</h3>
          <form onSubmit={handleUpdateAdmin}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={editAdmin.name}
                onChange={(e) => setEditAdmin({...editAdmin, name: e.target.value})}
                placeholder="Enter admin full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={editAdmin.email}
                onChange={(e) => setEditAdmin({...editAdmin, email: e.target.value})}
                placeholder="Enter admin email"
                required
              />
            </div>

            <div className="form-group">
              <label>New Password (leave blank to keep current)</label>
              <input
                type="password"
                value={editAdmin.password}
                onChange={(e) => setEditAdmin({...editAdmin, password: e.target.value})}
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
              />
            </div>

            {editAdmin.password && (
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={editAdmin.confirmPassword}
                  onChange={(e) => setEditAdmin({...editAdmin, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update Admin User'}
              </button>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading admin users...</p>
        </div>
      ) : adminUsers.length === 0 ? (
        <div className="empty-state-new">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3>No admin users found</h3>
          <p>Click "Add Admin User" to create the first administrator</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((admin) => (
                <tr key={admin.id}>
                  <td>#{admin.id}</td>
                  <td>
                    <div className="admin-user-info">
                      {admin.avatar_url ? (
                        <img src={admin.avatar_url} alt={admin.name} className="admin-avatar-sm" />
                      ) : (
                        <div className="admin-avatar-sm placeholder">
                          {(admin.name || admin.email || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{admin.name}</span>
                    </div>
                  </td>
                  <td>{admin.email}</td>
                  <td>
                    <span className="badge badge-admin">Administrator</span>
                  </td>
                  <td>{admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn-icon-sm btn-primary"
                        onClick={() => handleEditAdmin(admin)}
                        title="Edit Admin"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button 
                        className="btn-icon-sm btn-danger"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        title="Delete Admin"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminUsersManagement;

