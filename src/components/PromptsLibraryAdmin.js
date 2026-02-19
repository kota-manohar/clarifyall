import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import promptService from '../services/promptService'; // For reads (admin needs fresh data)
import cachedPromptService from '../services/cachedPromptService'; // For writes (to clear cache)
import { getTools } from '../services/toolService';
import { generateAIPrompt } from '../services/openrouterService';
import {
  PROMPT_TYPES,
  PROMPT_TYPE_LABELS,
  PROMPT_TYPE_ICONS,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABELS,
  PROMPT_STATUS,
  POPULAR_AI_TOOLS,
  getPromptTypeIcon,
  getDifficultyIcon,
  formatViews,
  formatScore
} from '../utils/promptConstants';
import '../styles/PromptsLibrary.css';

function PromptsLibraryAdmin() {
  const [activeTab, setActiveTab] = useState('prompts');
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratorForm, setAiGeneratorForm] = useState({
    description: '',
    style: '',
    toolName: '',
    promptType: 'IMAGE'
  });

  const [promptForm, setPromptForm] = useState({
    title: '',
    description: '',
    prompt_text: '',
    prompt_type: 'IMAGE',
    category_id: '',
    tool_id: '',
    difficulty: 'BEGINNER',
    tags: [],
    example_image_url: '',
    example_video_url: '',
    parameters: {}
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '🎨',
    parent_id: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPrompts(),
        loadCategories(),
        loadTools(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrompts = async () => {
    try {
      const data = await promptService.getAllPrompts();
      setPrompts(data);
    } catch (error) {
      console.error('Error loading prompts:', error);
      alert('Failed to load prompts');
    }
  };

  const loadCategories = async () => {
    try {
      const data = await promptService.getCategories();
      setCategories(flattenCategories(data));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTools = async () => {
    try {
      const response = await getTools({ size: 1000 }); // Load all tools
      setTools(response.tools || []);
    } catch (error) {
      console.error('Error loading tools:', error);
      // Fallback to empty array if API fails
      setTools([]);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await promptService.getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const flattenCategories = (categories, level = 0) => {
    let result = [];
    categories.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  };

  const filteredPrompts = prompts.filter(prompt => {
    if (filterStatus !== 'all' && prompt.status !== filterStatus) return false;
    if (filterType !== 'all' && prompt.prompt_type !== filterType) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        prompt.title.toLowerCase().includes(search) ||
        prompt.description?.toLowerCase().includes(search) ||
        prompt.prompt_text.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this prompt?')) return;
    try {
      await cachedPromptService.approvePrompt(id); // Use cached service to clear cache
      alert('Prompt approved!');
      loadPrompts();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this prompt?')) return;
    try {
      await cachedPromptService.rejectPrompt(id); // Use cached service to clear cache
      alert('Prompt rejected!');
      loadPrompts();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this prompt?')) return;
    try {
      await cachedPromptService.deletePrompt(id); // Use cached service to clear cache
      alert('Prompt deleted!');
      loadPrompts();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleEditPrompt = (prompt) => {
    setEditingPrompt(prompt.id);
    setPromptForm({
      title: prompt.title,
      description: prompt.description || '',
      prompt_text: prompt.prompt_text,
      prompt_type: prompt.prompt_type,
      category_id: prompt.category_id || '',
      tool_id: prompt.tool_id || '',
      difficulty: prompt.difficulty,
      tags: prompt.tags || [],
      example_image_url: prompt.example_image_url || '',
      example_video_url: prompt.example_video_url || '',
      parameters: prompt.parameters || {}
    });
  };

  const handleSavePrompt = async () => {
    try {
      if (editingPrompt) {
        // Use cached service to clear cache when updating
        await cachedPromptService.updatePrompt(editingPrompt, promptForm);
        alert('Prompt updated!');
        setEditingPrompt(null);
      } else {
        // Use cached service to clear cache when creating
        await cachedPromptService.createPrompt({ ...promptForm, status: 'APPROVED' });
        alert('Prompt created!');
        setShowAddPrompt(false);
      }
      resetPromptForm();
      loadPrompts();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleCancelPrompt = () => {
    setEditingPrompt(null);
    setShowAddPrompt(false);
    resetPromptForm();
  };

  const handleAdminImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      const formDataToUpload = new FormData();
      formDataToUpload.append('image', file);
      
      const response = await fetch('https://clarifyall.com/php-api/upload-prompt-image.php', {
        method: 'POST',
        body: formDataToUpload
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.url) {
        setPromptForm({ ...promptForm, example_image_url: data.url });
        alert('Image uploaded successfully!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. You can still use a URL instead.');
    } finally {
      e.target.value = '';
    }
  };

  const resetPromptForm = () => {
    setPromptForm({
      title: '',
      description: '',
      prompt_text: '',
      prompt_type: 'IMAGE',
      category_id: '',
      tool_id: '',
      difficulty: 'BEGINNER',
      tags: [],
      example_image_url: '',
      example_video_url: '',
      parameters: {}
    });
  };

  const handleAddTag = (tag) => {
    if (tag && !promptForm.tags.includes(tag)) {
      setPromptForm({ ...promptForm, tags: [...promptForm.tags, tag] });
    }
  };

  const handleRemoveTag = (tag) => {
    setPromptForm({ ...promptForm, tags: promptForm.tags.filter(t => t !== tag) });
  };

  const handleGenerateAIPrompt = async () => {
    if (!aiGeneratorForm.description.trim()) {
      alert('Please enter a description for the prompt');
      return;
    }

    setAiGenerating(true);
    try {
      const generated = await generateAIPrompt(
        aiGeneratorForm.promptType,
        aiGeneratorForm.description,
        aiGeneratorForm.style,
        aiGeneratorForm.toolName
      );

      // Auto-populate the form
      setPromptForm({
        ...promptForm,
        title: generated.title || promptForm.title,
        description: generated.description || promptForm.description,
        prompt_text: generated.prompt_text || promptForm.prompt_text,
        prompt_type: aiGeneratorForm.promptType,
        difficulty: generated.difficulty || promptForm.difficulty,
        tags: generated.tags || promptForm.tags,
        parameters: generated.parameters || promptForm.parameters
      });

      // If tool name was provided, try to find matching tool
      if (aiGeneratorForm.toolName && tools.length > 0) {
        const matchingTool = tools.find(t => 
          t.name.toLowerCase().includes(aiGeneratorForm.toolName.toLowerCase()) ||
          aiGeneratorForm.toolName.toLowerCase().includes(t.name.toLowerCase())
        );
        if (matchingTool) {
          setPromptForm(prev => ({ ...prev, tool_id: matchingTool.id }));
        }
      }

      // Show the form if it's not already visible
      if (!showAddPrompt && !editingPrompt) {
        setShowAddPrompt(true);
      }

      // Close the AI generator modal
      setShowAIGenerator(false);
      setAiGeneratorForm({
        description: '',
        style: '',
        toolName: '',
        promptType: 'IMAGE'
      });

      alert('AI prompt generated and form populated! Review and adjust as needed.');
    } catch (error) {
      console.error('Error generating AI prompt:', error);
      alert('Failed to generate AI prompt: ' + error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await cachedPromptService.updateCategory(editingCategory, categoryForm); // Use cached service to clear cache
        alert('Category updated!');
        setEditingCategory(null);
      } else {
        await cachedPromptService.createCategory(categoryForm); // Use cached service to clear cache
        alert('Category created!');
        setShowAddCategory(false);
      }
      setCategoryForm({ name: '', description: '', icon: '🎨', parent_id: null });
      loadCategories();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await cachedPromptService.deleteCategory(id); // Use cached service to clear cache
      alert('Category deleted!');
      loadCategories();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Memoized handlers to prevent re-renders
  const handleDescriptionChange = React.useCallback((e) => {
    setAiGeneratorForm(prev => ({ ...prev, description: e.target.value }));
  }, []);

  const handleStyleChange = React.useCallback((e) => {
    setAiGeneratorForm(prev => ({ ...prev, style: e.target.value }));
  }, []);

  const handleToolNameChange = React.useCallback((e) => {
    setAiGeneratorForm(prev => ({ ...prev, toolName: e.target.value }));
  }, []);

  const handlePromptTypeChange = React.useCallback((e) => {
    setAiGeneratorForm(prev => ({ ...prev, promptType: e.target.value }));
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setShowAIGenerator(false);
  }, []);

  const handleModalBackdropClick = React.useCallback((e) => {
    if (e.target.className === 'ai-generator-modal' || e.target.classList.contains('ai-generator-modal')) {
      setShowAIGenerator(false);
    }
  }, []);

  return (
    <>
      {showAIGenerator && createPortal(
        <div 
          className="ai-generator-modal" 
          onClick={handleModalBackdropClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            className="ai-generator-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, background: 'var(--ai-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                🤖 AI Prompt Generator
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label className="required">What should the prompt create?</label>
              <textarea
                className="form-input"
                value={aiGeneratorForm.description}
                onChange={handleDescriptionChange}
                placeholder="e.g., A cinematic portrait of a warrior in golden hour lighting, dramatic shadows, photorealistic"
                rows="3"
                style={{ minHeight: '80px' }}
              />
              <div className="form-help">Describe what you want the AI to generate</div>
            </div>

            <div className="filters-row">
              <div className="filter-group">
                <label>Prompt Type</label>
                <select
                  className="form-select"
                  value={aiGeneratorForm.promptType}
                  onChange={handlePromptTypeChange}
                >
                  <option value="IMAGE">🖼️ Image</option>
                  <option value="VIDEO">🎬 Video</option>
                  <option value="IMAGE_EDIT">✏️ Image Edit</option>
                  <option value="VIDEO_EDIT">🎞️ Video Edit</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Style (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={aiGeneratorForm.style}
                  onChange={handleStyleChange}
                  placeholder="e.g., cinematic, realistic, anime"
                />
              </div>
            </div>

            <div className="form-group">
              <label>AI Tool (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={aiGeneratorForm.toolName}
                onChange={handleToolNameChange}
                placeholder="e.g., Midjourney, DALL-E, Stable Diffusion"
              />
              <div className="form-help">Specify the AI tool to optimize the prompt for</div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleGenerateAIPrompt}
                disabled={aiGenerating || !aiGeneratorForm.description.trim()}
                style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', opacity: (aiGenerating || !aiGeneratorForm.description.trim()) ? 0.6 : 1 }}
              >
                {aiGenerating ? (
                  <>
                    <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '0.5rem', display: 'inline-block' }}></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}>
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Generate Prompt
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCloseModal}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <div className="prompts-library">
        {/* Header */}
        <div className="prompts-header">
          <h1>🎨 Prompts Library</h1>
          <p>Manage AI prompts for images, videos, and editing</p>
        </div>

      {/* Statistics */}
      {statistics && (
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card-new">
            <div className="stat-icon pending">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-details">
              <div className="stat-value-new">{statistics.pending_prompts || 0}</div>
              <div className="stat-label-new">Pending</div>
            </div>
          </div>

          <div className="stat-card-new">
            <div className="stat-icon approved">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-details">
              <div className="stat-value-new">{statistics.approved_prompts || 0}</div>
              <div className="stat-label-new">Approved</div>
            </div>
          </div>

          <div className="stat-card-new">
            <div className="stat-icon total">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="stat-details">
              <div className="stat-value-new">{formatViews(statistics.total_views || 0)}</div>
              <div className="stat-label-new">Total Views</div>
            </div>
          </div>

          <div className="stat-card-new">
            <div className="stat-icon approved">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <div className="stat-details">
              <div className="stat-value-new">{statistics.total_upvotes || 0}</div>
              <div className="stat-label-new">Total Upvotes</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="type-filters" style={{ marginBottom: '2rem' }}>
        <button
          className={`type-filter-btn ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          🎨 Manage Prompts
        </button>
        <button
          className={`type-filter-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          🏷️ Manage Categories
        </button>
      </div>

      {/* Prompts Tab */}
      {activeTab === 'prompts' && (
        <>
          {/* Filters */}
          <div className="prompts-filters">
            <div className="filters-row">
              <div className="filter-group">
                <label>Search</label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Status</label>
                <select
                  className="filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Type</label>
                <select
                  className="filter-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {Object.keys(PROMPT_TYPES).map(type => (
                    <option key={type} value={type}>
                      {getPromptTypeIcon(type)} {PROMPT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group filter-group-buttons">
                <label style={{ marginBottom: '0.5rem' }}>Actions</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-ai-generate"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowAIGenerator(true);
                    }}
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>AI Generate</span>
                  </button>
                  <button
                    className="btn btn-primary btn-add-prompt"
                    onClick={() => setShowAddPrompt(true)}
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Prompt</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Add/Edit Prompt Form */}
          {(showAddPrompt || editingPrompt) && (
            <div className="prompt-form" style={{ marginBottom: '2rem' }}>
              <h3>{editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}</h3>
              
              <div className="form-group">
                <label className="required">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={promptForm.title}
                  onChange={(e) => setPromptForm({ ...promptForm, title: e.target.value })}
                  placeholder="e.g., Cinematic Portrait in Golden Hour"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  value={promptForm.description}
                  onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
                  placeholder="Brief description of this prompt"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label className="required">Prompt Text</label>
                <textarea
                  className="form-textarea"
                  value={promptForm.prompt_text}
                  onChange={(e) => setPromptForm({ ...promptForm, prompt_text: e.target.value })}
                  placeholder="Enter the full prompt text here..."
                  rows="4"
                />
              </div>

              <div className="filters-row">
                <div className="filter-group">
                  <label className="required">Type</label>
                  <select
                    className="form-select"
                    value={promptForm.prompt_type}
                    onChange={(e) => setPromptForm({ ...promptForm, prompt_type: e.target.value })}
                  >
                    {Object.keys(PROMPT_TYPES).map(type => (
                      <option key={type} value={type}>
                        {getPromptTypeIcon(type)} {PROMPT_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Category</label>
                  <select
                    className="form-select"
                    value={promptForm.category_id}
                    onChange={(e) => setPromptForm({ ...promptForm, category_id: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {'  '.repeat(cat.level)}{cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Difficulty</label>
                  <select
                    className="form-select"
                    value={promptForm.difficulty}
                    onChange={(e) => setPromptForm({ ...promptForm, difficulty: e.target.value })}
                  >
                    {Object.keys(DIFFICULTY_LEVELS).map(level => (
                      <option key={level} value={level}>
                        {getDifficultyIcon(level)} {DIFFICULTY_LABELS[level]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>AI Tool</label>
                  <select
                    className="form-select"
                    value={promptForm.tool_id || ''}
                    onChange={(e) => setPromptForm({ ...promptForm, tool_id: e.target.value || '' })}
                  >
                    <option value="">Select AI tool (optional)</option>
                    {tools.length > 0 ? (
                      tools.map(tool => (
                        <option key={tool.id} value={tool.id}>
                          {tool.name}
                        </option>
                      ))
                    ) : (
                      POPULAR_AI_TOOLS.map(tool => (
                        <option key={tool} value={tool}>
                          {tool}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="portrait, cinematic, photography"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const tag = e.target.value.trim().replace(',', '');
                      if (tag) {
                        handleAddTag(tag);
                        e.target.value = '';
                      }
                    }
                  }}
                />
                {promptForm.tags.length > 0 && (
                  <div className="prompt-card-tags" style={{ marginTop: '0.5rem' }}>
                    {promptForm.tags.map((tag, index) => (
                      <span key={index} className="prompt-tag">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Example Image Upload */}
              <div className="form-group">
                <label>Example Image</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="admin-example-image-upload"
                      className="file-input"
                      onChange={handleAdminImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="admin-example-image-upload" className="file-upload-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload Image
                    </label>
                  </div>
                  <div style={{ flex: '2', minWidth: '250px' }}>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="Or enter image URL"
                      value={promptForm.example_image_url}
                      onChange={(e) => setPromptForm({ ...promptForm, example_image_url: e.target.value })}
                    />
                  </div>
                </div>
                {promptForm.example_image_url && (
                  <div style={{ marginTop: '1rem' }}>
                    <img 
                      src={promptForm.example_image_url} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Example Video URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="Video URL (optional)"
                  value={promptForm.example_video_url}
                  onChange={(e) => setPromptForm({ ...promptForm, example_video_url: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button className="btn btn-secondary" onClick={handleCancelPrompt}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSavePrompt}>
                  {editingPrompt ? 'Update Prompt' : 'Create Prompt'}
                </button>
              </div>
            </div>
          )}

          {/* Prompts Table */}
          {loading ? (
            <div className="prompts-loading">
              <div className="spinner"></div>
              <p>Loading prompts...</p>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="prompts-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3>No prompts found</h3>
              <p>Try adjusting your filters or add a new prompt</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="tools-table">
                <thead>
                  <tr>
                    <th style={{width: '60px'}}>Type</th>
                    <th style={{width: '250px'}}>Title</th>
                    <th>Prompt Text</th>
                    <th style={{width: '120px'}}>Category</th>
                    <th style={{width: '100px'}}>Difficulty</th>
                    <th style={{width: '100px'}}>Stats</th>
                    <th style={{width: '100px'}}>Status</th>
                    <th style={{width: '180px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrompts.map(prompt => (
                    <tr key={prompt.id}>
                      <td>
                        <span style={{ fontSize: '1.5rem' }}>
                          {getPromptTypeIcon(prompt.prompt_type)}
                        </span>
                      </td>
                      <td>
                        <div className="table-tool-name">{prompt.title}</div>
                      </td>
                      <td>
                        <div className="table-description">
                          {prompt.prompt_text.substring(0, 80)}...
                        </div>
                      </td>
                      <td>
                        <div className="table-categories">
                          {prompt.category_name || '-'}
                        </div>
                      </td>
                      <td>
                        <span className="prompt-difficulty-badge">
                          {getDifficultyIcon(prompt.difficulty)}
                        </span>
                      </td>
                      <td>
                        <div className="prompt-stats-text">
                          👁️ {formatViews(prompt.views)}
                          <br />
                          👍 {formatScore(prompt.upvotes, prompt.downvotes)}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${prompt.status.toLowerCase().replace('_', '-')}`}>
                          {prompt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon-sm" onClick={() => handleEditPrompt(prompt)} title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {prompt.status === 'PENDING' && (
                            <>
                              <button className="btn-icon-sm btn-success" onClick={() => handleApprove(prompt.id)} title="Approve">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button className="btn-icon-sm btn-danger" onClick={() => handleReject(prompt.id)} title="Reject">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                          {prompt.status === 'APPROVED' && (
                            <button className="btn-icon-sm btn-warning" onClick={() => handleReject(prompt.id)} title="Reject">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          {prompt.status === 'REJECTED' && (
                            <button className="btn-icon-sm btn-success" onClick={() => handleApprove(prompt.id)} title="Approve">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button className="btn-icon-sm btn-danger" onClick={() => handleDelete(prompt.id)} title="Delete">
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
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2>Prompt Categories</h2>
            <button className="btn btn-primary" onClick={() => setShowAddCategory(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <path d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </button>
          </div>

          {/* Add/Edit Category Form */}
          {(showAddCategory || editingCategory) && (
            <div className="prompt-form" style={{ marginBottom: '2rem' }}>
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              
              <div className="form-group">
                <label className="required">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Photography"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Brief description"
                  rows="2"
                />
              </div>

              <div className="filters-row">
                <div className="filter-group">
                  <label>Icon (Emoji)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    placeholder="🎨"
                  />
                </div>

                <div className="filter-group">
                  <label>Parent Category</label>
                  <select
                    className="form-select"
                    value={categoryForm.parent_id || ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, parent_id: e.target.value || null })}
                  >
                    <option value="">None (Top Level)</option>
                    {categories.filter(c => !c.parent_id).map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => {
                  setShowAddCategory(false);
                  setEditingCategory(null);
                  setCategoryForm({ name: '', description: '', icon: '🎨', parent_id: null });
                }}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveCategory}>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </div>
          )}

          {/* Categories Table */}
          <div className="table-container">
            <table className="tools-table">
              <thead>
                <tr>
                  <th style={{width: '80px'}}>Icon</th>
                  <th style={{width: '250px'}}>Name</th>
                  <th>Description</th>
                  <th style={{width: '100px'}}>Prompts</th>
                  <th style={{width: '150px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id}>
                    <td style={{ fontSize: '1.5rem', textAlign: 'center' }}>
                      {category.icon}
                    </td>
                    <td>
                      <div className="table-tool-name" style={{ paddingLeft: `${category.level * 20}px` }}>
                        {category.name}
                      </div>
                    </td>
                    <td>
                      <div className="table-description">
                        {category.description || '-'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary">
                        {category.prompt_count || 0}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon-sm" onClick={() => {
                          setEditingCategory(category.id);
                          setCategoryForm({
                            name: category.name,
                            description: category.description || '',
                            icon: category.icon,
                            parent_id: category.parent_id
                          });
                        }} title="Edit">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>
    </>
  );
}

export default PromptsLibraryAdmin;
