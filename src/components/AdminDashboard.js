import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PRICING_LABELS, buildUploadUrl } from '../utils/constants';
import PromptsLibraryAdmin from './PromptsLibraryAdmin';
import BlogAdmin from './BlogAdmin';
import AdminProfile from './AdminProfile';
import AdminUsersManagement from './AdminUsersManagement';
import SitemapGenerator from './utilities/SitemapGenerator';
import AdminSubmitTool from './AdminSubmitTool';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('approve-tools');
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTool, setEditingTool] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [dbConnectionStatus, setDbConnectionStatus] = useState(null);
  const [clearingConnections, setClearingConnections] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }

    loadTools();
    loadCategories();
    checkDbConnectionStatus();
  }, [navigate]);

  useEffect(() => {
    filterTools();
  }, [tools, filterStatus, searchTerm]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories.php');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTools = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tools.php/all');
      const allTools = response.data;
      setTools(allTools);

      const pending = allTools.filter(tool => tool.status === 'PENDING_APPROVAL').length;
      const approved = allTools.filter(tool => tool.status === 'APPROVED').length;
      const rejected = allTools.filter(tool => tool.status === 'REJECTED').length;

      setStats({
        pending,
        approved,
        rejected,
        total: allTools.length
      });
    } catch (error) {
      console.error('Error loading tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTools = () => {
    let filtered = [...tools];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(tool => tool.status === filterStatus);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(search) ||
        tool.shortDescription?.toLowerCase().includes(search) ||
        tool.websiteUrl?.toLowerCase().includes(search)
      );
    }

    setFilteredTools(filtered);
  };

  const handleApprove = async (toolId) => {
    if (!window.confirm('Approve this tool?')) return;

    try {
      await api.put(`/tools.php/${toolId}/approve`);
      alert('Tool approved!');
      loadTools();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReject = async (toolId) => {
    if (!window.confirm('Reject this tool?')) return;

    try {
      await api.put(`/tools.php/${toolId}/reject`);
      alert('Tool rejected!');
      loadTools();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (toolId) => {
    if (!window.confirm('Permanently delete this tool?')) return;

    try {
      await api.delete(`/tools.php/${toolId}`);
      alert('Tool deleted!');
      loadTools();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (tool) => {
    setEditingTool(tool.id);
    setEditForm({
      name: tool.name,
      websiteUrl: tool.websiteUrl,
      shortDescription: tool.shortDescription,
      fullDescription: tool.fullDescription || '',
      pricingModel: tool.pricingModel,
      categoryIds: tool.categories.map(c => c.id),
      verified: tool.verified || 0
    });
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleCancelEdit = () => {
    setEditingTool(null);
    setEditForm({});
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async (toolId) => {
    try {
      let updateData = { ...editForm };

      // Upload logo first if selected and get the URL
      if (selectedFile) {
        const formData = new FormData();
        formData.append('logo', selectedFile);
        const uploadResponse = await api.postFormData(`/tools.php/${toolId}/upload-logo`, formData);
        if (uploadResponse.data && uploadResponse.data.logoUrl) {
          updateData.logoUrl = uploadResponse.data.logoUrl;
        }
      }

      await api.put(`/tools.php/${toolId}`, updateData);
      alert('Tool updated!');
      setEditingTool(null);
      setEditForm({});
      setSelectedFile(null);
      setImagePreview(null);
      // Add a small delay to ensure DB update completes
      await new Promise(resolve => setTimeout(resolve, 100));
      loadTools();
    } catch (error) {
      console.error('Update error:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  const checkDbConnectionStatus = async () => {
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      const response = await api.get(`/admin-db-connection.php?action=status&user_id=${adminUser.id || ''}&username=u530425252_kyc`);
      setDbConnectionStatus(response.data);
    } catch (error) {
      console.error('Error checking DB connection status:', error);
    }
  };

  const clearDbConnections = async () => {
    if (!window.confirm('Are you sure you want to clear all database connections? This will KILL all active MySQL connections and may affect ongoing requests.')) {
      return;
    }

    setClearingConnections(true);
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      const response = await api.post('/admin-db-connection.php', {
        action: 'kill',
        user_id: adminUser.id || '',
        username: 'u530425252_kyc'
      });

      if (response.data.success) {
        const data = response.data.data;
        alert(`Database connections cleared successfully!\n\n` +
          `PHP Connections Closed: ${data.php_connections_closed}\n` +
          `MySQL Connections Killed: ${data.mysql_connections_killed}\n` +
          `MySQL Connections Before: ${data.mysql_connections_before}\n` +
          `MySQL Active Connections After: ${data.mysql_active_connections_after}\n` +
          (data.kill_errors && data.kill_errors.length > 0 ? `\nErrors: ${data.kill_errors.length}` : ''));
        setDbConnectionStatus(response.data.data);
      } else {
        alert('Error: ' + (response.data.error || 'Failed to clear connections'));
      }
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message || 'Failed to clear connections'));
    } finally {
      setClearingConnections(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      await api.post('/categories.php', newCategory);
      alert('Category added successfully!');
      setNewCategory({ name: '', description: '' });
      setShowAddCategory(false);
      loadCategories();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category.id);
  };

  const handleSaveCategory = async (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    try {
      await api.put(`/categories.php/${categoryId}`, {
        name: category.name,
        description: category.description
      });
      alert('Category updated!');
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? This may affect tools using this category.')) return;

    try {
      await api.delete(`/categories.php/${categoryId}`);
      alert('Category deleted!');
      loadCategories();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCategoryChange = (categoryId, field, value) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId ? { ...cat, [field]: value } : cat
    ));
  };

  const renderToolRow = (tool) => {
    if (editingTool === tool.id) {
      return (
        <tr key={tool.id} className="editing-row">
          <td>
            <div className="table-logo-edit">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="table-logo" />
              ) : tool.logoUrl ? (
                <img
                  key={`${tool.id}-${tool.logoUrl}`}
                  src={buildUploadUrl(tool.logoUrl)}
                  alt={tool.name}
                  className="table-logo"
                />
              ) : (
                <div className="table-logo-placeholder">{tool.name.charAt(0)}</div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                id={`file-${tool.id}`}
                style={{ display: 'none' }}
              />
              <label htmlFor={`file-${tool.id}`} className="btn-icon-sm" title="Upload">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </label>
            </div>
          </td>
          <td>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="form-input-sm"
              placeholder="Tool name"
            />
          </td>
          <td>
            <input
              type="text"
              value={editForm.websiteUrl}
              onChange={(e) => setEditForm({ ...editForm, websiteUrl: e.target.value })}
              className="form-input-sm"
              placeholder="Website URL"
            />
          </td>
          <td>
            <textarea
              value={editForm.shortDescription}
              onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
              className="form-textarea-sm"
              rows="2"
              placeholder="Description"
            />
          </td>
          <td>
            <select
              value={editForm.pricingModel}
              onChange={(e) => setEditForm({ ...editForm, pricingModel: e.target.value })}
              className="form-select-sm"
            >
              <option value="FREE">Free</option>
              <option value="FREEMIUM">Freemium</option>
              <option value="FREE_TRIAL">Free Trial</option>
              <option value="PAID">Paid</option>
            </select>
          </td>
          <td>
            <select
              multiple
              value={editForm.categoryIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                setEditForm({ ...editForm, categoryIds: selected });
              }}
              className="form-select-sm"
              size="2"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </td>
          <td>
            <span className={`badge badge-${tool.status.toLowerCase().replace('_', '-')}`}>
              {tool.status.replace('_', ' ')}
            </span>
          </td>
          <td>
            <input
              type="checkbox"
              checked={editForm.verified === 1}
              onChange={(e) => setEditForm({ ...editForm, verified: e.target.checked ? 1 : 0 })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </td>
          <td>
            <div className="table-actions">
              <button className="btn-icon-sm btn-success" onClick={() => handleSaveEdit(tool.id)} title="Save">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button className="btn-icon-sm btn-secondary" onClick={handleCancelEdit} title="Cancel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={tool.id}>
        <td>
          {tool.logoUrl ? (
            <img
              key={`${tool.id}-${tool.logoUrl}`}
              src={buildUploadUrl(tool.logoUrl)}
              alt={tool.name}
              className="table-logo"
            />
          ) : (
            <div className="table-logo-placeholder">{tool.name.charAt(0)}</div>
          )}
        </td>
        <td>
          <div className="table-tool-name">{tool.name}</div>
        </td>
        <td>
          <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer" className="table-link">
            {tool.websiteUrl.replace(/^https?:\/\//, '').substring(0, 30)}
          </a>
        </td>
        <td>
          <div className="table-description">{tool.shortDescription?.substring(0, 60)}...</div>
        </td>
        <td>
          <span className={`badge badge-pricing-${tool.pricingModel.toLowerCase()}`}>
            {PRICING_LABELS[tool.pricingModel]}
          </span>
        </td>
        <td>
          <div className="table-categories">
            {tool.categories.map(cat => cat.name).join(', ')}
          </div>
        </td>
        <td>
          <span className={`badge badge-${tool.status.toLowerCase().replace('_', '-')}`}>
            {tool.status.replace('_', ' ')}
          </span>
        </td>
        <td>
          {tool.verified === 1 ? (
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto' }}>
              <path d="M16.6453 7.03281C16.3508 6.725 16.0461 6.40781 15.9312 6.12891C15.825 5.87344 15.8187 5.45 15.8125 5.03984C15.8008 4.27734 15.7883 3.41328 15.1875 2.8125C14.5867 2.21172 13.7227 2.19922 12.9602 2.1875C12.55 2.18125 12.1266 2.175 11.8711 2.06875C11.593 1.95391 11.275 1.64922 10.9672 1.35469C10.4281 0.836719 9.81563 0.25 9 0.25C8.18437 0.25 7.57266 0.836719 7.03281 1.35469C6.725 1.64922 6.40781 1.95391 6.12891 2.06875C5.875 2.175 5.45 2.18125 5.03984 2.1875C4.27734 2.19922 3.41328 2.21172 2.8125 2.8125C2.21172 3.41328 2.20312 4.27734 2.1875 5.03984C2.18125 5.45 2.175 5.87344 2.06875 6.12891C1.95391 6.40703 1.64922 6.725 1.35469 7.03281C0.836719 7.57188 0.25 8.18437 0.25 9C0.25 9.81563 0.836719 10.4273 1.35469 10.9672C1.64922 11.275 1.95391 11.5922 2.06875 11.8711C2.175 12.1266 2.18125 12.55 2.1875 12.9602C2.19922 13.7227 2.21172 14.5867 2.8125 15.1875C3.41328 15.7883 4.27734 15.8008 5.03984 15.8125C5.45 15.8187 5.87344 15.825 6.12891 15.9312C6.40703 16.0461 6.725 16.3508 7.03281 16.6453C7.57188 17.1633 8.18437 17.75 9 17.75C9.81563 17.75 10.4273 17.1633 10.9672 16.6453C11.275 16.3508 11.5922 16.0461 11.8711 15.9312C12.1266 15.825 12.55 15.8187 12.9602 15.8125C13.7227 15.8008 14.5867 15.7883 15.1875 15.1875C15.7883 14.5867 15.8008 13.7227 15.8125 12.9602C15.8187 12.55 15.825 12.1266 15.9312 11.8711C16.0461 11.593 16.3508 11.275 16.6453 10.9672C17.1633 10.4281 17.75 9.81563 17.75 9C17.75 8.18437 17.1633 7.57266 16.6453 7.03281ZM12.5672 7.56719L8.19219 11.9422C8.13414 12.0003 8.06521 12.0464 7.98934 12.0779C7.91346 12.1093 7.83213 12.1255 7.75 12.1255C7.66787 12.1255 7.58654 12.1093 7.51066 12.0779C7.43479 12.0464 7.36586 12.0003 7.30781 11.9422L5.43281 10.0672C5.31554 9.94991 5.24965 9.79085 5.24965 9.625C5.24965 9.45915 5.31554 9.30009 5.43281 9.18281C5.55009 9.06554 5.70915 8.99965 5.875 8.99965C6.04085 8.99965 6.19991 9.06554 6.31719 9.18281L7.75 10.6164L11.6828 6.68281C11.7409 6.62474 11.8098 6.57868 11.8857 6.54725C11.9616 6.51583 12.0429 6.49965 12.125 6.49965C12.2071 6.49965 12.2884 6.51583 12.3643 6.54725C12.4402 6.57868 12.5091 6.62474 12.5672 6.68281C12.6253 6.74088 12.6713 6.80982 12.7027 6.88569C12.7342 6.96156 12.7503 7.04288 12.7503 7.125C12.7503 7.20712 12.7342 7.28844 12.7027 7.36431C12.6713 7.44018 12.6253 7.50912 12.5672 7.56719Z" fill="#49ADFF"></path>
            </svg>
          ) : (
            <span style={{ display: 'block', textAlign: 'center', color: '#999' }}>-</span>
          )}
        </td>
        <td>
          <div className="table-actions">
            <button className="btn-icon-sm" onClick={() => handleEdit(tool)} title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {tool.status === 'PENDING_APPROVAL' && (
              <>
                <button className="btn-icon-sm btn-success" onClick={() => handleApprove(tool.id)} title="Approve">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button className="btn-icon-sm btn-danger" onClick={() => handleReject(tool.id)} title="Reject">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
            {tool.status === 'APPROVED' && (
              <button className="btn-icon-sm btn-warning" onClick={() => handleReject(tool.id)} title="Reject">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
            {tool.status === 'REJECTED' && (
              <button className="btn-icon-sm btn-success" onClick={() => handleApprove(tool.id)} title="Approve">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            <button className="btn-icon-sm btn-danger" onClick={() => handleDelete(tool.id)} title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="admin-layout">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {(!sidebarCollapsed || sidebarOpen) && <span>Admin Panel</span>}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => {
              const isMobile = window.innerWidth <= 768;
              if (isMobile) {
                setSidebarOpen(false);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            aria-label="Toggle sidebar"
          >
            <svg className="sidebar-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg className="sidebar-close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeMenu === 'approve-tools' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('approve-tools');
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {(!sidebarCollapsed || sidebarOpen) && <span>Approve Tools</span>}
            {(!sidebarCollapsed || sidebarOpen) && stats.pending > 0 && (
              <span className="badge badge-danger">{stats.pending}</span>
            )}
          </button>

          <button
            className={`nav-item ${activeMenu === 'submit-tools' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('submit-tools');
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14m7-7H5" />
            </svg>
            {(!sidebarCollapsed || sidebarOpen) && <span>Submit Tools</span>}
          </button>

          <button
            className={`nav-item ${activeMenu === 'manage-categories' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('manage-categories');
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 4 0 014-4z" />
            </svg>
            {(!sidebarCollapsed || sidebarOpen) && <span>Manage Categories</span>}
          </button>

          <button
            className={`nav-item ${activeMenu === 'prompts-library' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('prompts-library');
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {(!sidebarCollapsed || sidebarOpen) && <span>Prompts Library</span>}
          </button>

          <button
            className={`nav-item ${activeMenu === 'blog-admin' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('blog-admin');
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            {(!sidebarCollapsed || sidebarOpen) && <span>Blog Management</span>}
          </button>

          <button
            className={`nav-item ${activeMenu === 'admin-profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('admin-profile');
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {(!sidebarCollapsed || sidebarOpen) && <span>My Profile</span>}
          </button>

          <button
            className={`nav-item ${activeMenu === 'admin-users' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('admin-users');
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {(!sidebarCollapsed || sidebarOpen) && <span>Admin Users</span>}
          </button>

          <button
            className={`nav-item ${activeMenu === 'sitemap-generator' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('sitemap-generator');
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {(!sidebarCollapsed || sidebarOpen) && <span>Sitemap Generator</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {(!sidebarCollapsed || sidebarOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {activeMenu === 'prompts-library' ? (
          <PromptsLibraryAdmin />
        ) : activeMenu === 'blog-admin' ? (
          <BlogAdmin />
        ) : activeMenu === 'admin-profile' ? (
          <AdminProfile />
        ) : activeMenu === 'admin-users' ? (
          <AdminUsersManagement />
        ) : activeMenu === 'sitemap-generator' ? (
          <SitemapGenerator />
        ) : activeMenu === 'submit-tools' ? (
          <AdminSubmitTool />
        ) : activeMenu === 'approve-tools' ? (
          <>
            <div className="admin-header-new">
              <div>
                <h1>Approve Tools</h1>
                <p className="text-muted">Manage and approve submitted tools</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {dbConnectionStatus && (
                  <div className="db-connection-status">
                    <span>DB: {dbConnectionStatus.php_connection_count || 0}</span>
                    {dbConnectionStatus.mysql_user_connections !== undefined && (
                      <span>| MySQL: {dbConnectionStatus.mysql_user_connections}</span>
                    )}
                  </div>
                )}
                <button
                  className="btn-secondary"
                  onClick={clearDbConnections}
                  disabled={clearingConnections}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  title="Clear all database connections"
                >
                  {clearingConnections ? (
                    <>
                      <svg className="spinner" style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite" />
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite" />
                        </circle>
                      </svg>
                      Clearing...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                        <path d="M3 3l18 18M9 9l3 3m0 0l3 3m-3-3l-3-3m3 3l3 3M21 21V9a2 2 0 00-2-2h-4M3 3v12a2 2 0 002 2h4m10 0V9a2 2 0 00-2-2h-4m-6 0V3a2 2 0 012-2h4" />
                      </svg>
                      Clear DB Connections
                    </>
                  )}
                </button>
                <button
                  className="btn-secondary"
                  onClick={checkDbConnectionStatus}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  title="Check database connection status"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Check Status
                </button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card-new">
                <div className="stat-icon pending">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-details">
                  <div className="stat-value-new">{stats.pending}</div>
                  <div className="stat-label-new">Pending Approval</div>
                </div>
              </div>

              <div className="stat-card-new">
                <div className="stat-icon approved">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-details">
                  <div className="stat-value-new">{stats.approved}</div>
                  <div className="stat-label-new">Approved</div>
                </div>
              </div>

              <div className="stat-card-new">
                <div className="stat-icon rejected">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-details">
                  <div className="stat-value-new">{stats.rejected}</div>
                  <div className="stat-label-new">Rejected</div>
                </div>
              </div>

              <div className="stat-card-new">
                <div className="stat-icon total">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="stat-details">
                  <div className="stat-value-new">{stats.total}</div>
                  <div className="stat-label-new">Total Tools</div>
                </div>
              </div>
            </div>

            <div className="filters-bar">
              <div className="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'PENDING_APPROVAL' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('PENDING_APPROVAL')}
                >
                  Pending
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'APPROVED' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('APPROVED')}
                >
                  Approved
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'REJECTED' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('REJECTED')}
                >
                  Rejected
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading tools...</p>
              </div>
            ) : filteredTools.length === 0 ? (
              <div className="empty-state-new">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3>No tools found</h3>
                <p>Try adjusting your filters or search term</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="tools-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Logo</th>
                      <th style={{ width: '180px' }}>Name</th>
                      <th style={{ width: '200px' }}>Website</th>
                      <th>Description</th>
                      <th style={{ width: '100px' }}>Pricing</th>
                      <th style={{ width: '150px' }}>Categories</th>
                      <th style={{ width: '120px' }}>Status</th>
                      <th style={{ width: '80px' }}>Verified</th>
                      <th style={{ width: '180px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTools.map(tool => renderToolRow(tool))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="admin-header-new">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <h1>Manage Categories</h1>
                  <p className="text-muted">Add, edit, or delete categories</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  Add Category
                </button>
              </div>
            </div>

            {showAddCategory && (
              <div className="category-form-card">
                <h3>Add New Category</h3>
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="form-input-sm"
                    placeholder="e.g., AI Tools, Design Tools"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="form-textarea-sm"
                    rows="3"
                    placeholder="Brief description of this category"
                  />
                </div>
                <div className="btn-group">
                  <button className="btn btn-primary" onClick={handleAddCategory}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    Save Category
                  </button>
                  <button className="btn btn-secondary" onClick={() => {
                    setShowAddCategory(false);
                    setNewCategory({ name: '', description: '' });
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="empty-state-new">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3>No categories found</h3>
                <p>Click "Add Category" to create your first category</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="tools-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ID</th>
                      <th style={{ width: '250px' }}>Name</th>
                      <th>Description</th>
                      <th style={{ width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(category => (
                      <tr key={category.id} className={editingCategory === category.id ? 'editing-row' : ''}>
                        <td>#{category.id}</td>
                        <td>
                          {editingCategory === category.id ? (
                            <input
                              type="text"
                              value={category.name}
                              onChange={(e) => handleCategoryChange(category.id, 'name', e.target.value)}
                              className="form-input-sm"
                            />
                          ) : (
                            <div className="table-tool-name">{category.name}</div>
                          )}
                        </td>
                        <td>
                          {editingCategory === category.id ? (
                            <textarea
                              value={category.description || ''}
                              onChange={(e) => handleCategoryChange(category.id, 'description', e.target.value)}
                              className="form-textarea-sm"
                              rows="2"
                            />
                          ) : (
                            <div className="table-description">{category.description || '-'}</div>
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            {editingCategory === category.id ? (
                              <>
                                <button className="btn-icon-sm btn-success" onClick={() => handleSaveCategory(category.id)} title="Save">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button className="btn-icon-sm btn-secondary" onClick={() => setEditingCategory(null)} title="Cancel">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="btn-icon-sm" onClick={() => handleEditCategory(category)} title="Edit">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button className="btn-icon-sm btn-danger" onClick={() => handleDeleteCategory(category.id)} title="Delete">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
