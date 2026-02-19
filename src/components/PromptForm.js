import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import promptService from '../services/promptService'; // Keep original for writes
import cachedPromptService from '../services/cachedPromptService'; // Use cached for reads
import { getTools } from '../services/toolService';
import SEO from './SEO';
import {
  PROMPT_TYPES,
  PROMPT_TYPE_LABELS,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABELS,
  POPULAR_AI_TOOLS,
  COMMON_TAGS,
  getPromptTypeIcon,
  getDifficultyIcon
} from '../utils/promptConstants';
import '../styles/PromptsLibrary.css';

function PromptForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
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

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCategories();
    loadTools();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await cachedPromptService.getCategories(); // Use cached for reading
      const flatCategories = flattenCategories(data);
      setCategories(flatCategories);
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
      // Fallback to POPULAR_AI_TOOLS if API fails
      setTools([]);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formDataToUpload = new FormData();
      formDataToUpload.append('image', file);
      
      // Use the API service to upload
      const response = await fetch('https://clarifyall.com/php-api/upload-prompt-image.php', {
        method: 'POST',
        body: formDataToUpload
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.url) {
        setFormData({ ...formData, example_image_url: data.url });
        alert('Image uploaded successfully!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. You can still use a URL instead.');
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleAddTag = (tag) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      // Remove last tag on backspace if input is empty
      const newTags = [...formData.tags];
      newTags.pop();
      setFormData({ ...formData, tags: newTags });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!formData.prompt_text.trim()) {
      newErrors.prompt_text = 'Prompt text is required';
    } else if (formData.prompt_text.length < 20) {
      newErrors.prompt_text = 'Prompt text must be at least 20 characters';
    }

    if (!formData.prompt_type) {
      newErrors.prompt_type = 'Prompt type is required';
    }

    if (!formData.difficulty) {
      newErrors.difficulty = 'Difficulty level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        category_id: formData.category_id || null,
        tool_id: formData.tool_id || null,
        status: 'PENDING' // New submissions are pending approval
      };

      await promptService.createPrompt(submitData);
      alert('Prompt submitted successfully! It will be reviewed by our team.');
      navigate('/prompts');
    } catch (error) {
      console.error('Error submitting prompt:', error);
      alert('Error submitting prompt: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Your changes will be lost.')) {
      navigate('/prompts');
    }
  };

  return (
    <div className="prompt-detail">
      <SEO 
        title="Submit AI Prompt - ClarifyAll"
        description="Share your AI prompts with the community. Submit prompts for Midjourney, DALL-E, Stable Diffusion, and more."
        keywords="submit AI prompt, share prompt, AI community"
      />

      {/* Header */}
      <div className="prompts-header">
        <h1>✨ Submit Your Prompt</h1>
        <p>Share your amazing AI prompts with the community</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="prompt-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label className="required">Title</label>
            <input
              type="text"
              name="title"
              className={`form-input ${errors.title ? 'error' : ''}`}
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Cinematic Portrait in Golden Hour"
              maxLength="200"
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
            <div className="form-help">
              Give your prompt a descriptive and catchy title (min. 10 characters)
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of what this prompt creates and when to use it"
              rows="3"
              maxLength="500"
            />
            <div className="form-help">
              Optional: Provide context about your prompt and its best use cases
            </div>
          </div>

          <div className="form-group">
            <label className="required">Prompt Text</label>
            <textarea
              name="prompt_text"
              className={`form-textarea ${errors.prompt_text ? 'error' : ''}`}
              value={formData.prompt_text}
              onChange={handleChange}
              placeholder="Enter your full prompt here... Be as detailed as possible!"
              rows="6"
            />
            {errors.prompt_text && <div className="form-error">{errors.prompt_text}</div>}
            <div className="form-help">
              The complete prompt text that users will copy (min. 20 characters)
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="form-section">
          <h3>Classification</h3>

          <div className="filters-row">
            <div className="filter-group">
              <label className="required">Prompt Type</label>
              <select
                name="prompt_type"
                className={`form-select ${errors.prompt_type ? 'error' : ''}`}
                value={formData.prompt_type}
                onChange={handleChange}
              >
                {Object.keys(PROMPT_TYPES).map(type => (
                  <option key={type} value={type}>
                    {getPromptTypeIcon(type)} {PROMPT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              {errors.prompt_type && <div className="form-error">{errors.prompt_type}</div>}
            </div>

            <div className="filter-group">
              <label className="required">Difficulty Level</label>
              <select
                name="difficulty"
                className={`form-select ${errors.difficulty ? 'error' : ''}`}
                value={formData.difficulty}
                onChange={handleChange}
              >
                {Object.keys(DIFFICULTY_LEVELS).map(level => (
                  <option key={level} value={level}>
                    {getDifficultyIcon(level)} {DIFFICULTY_LABELS[level]}
                  </option>
                ))}
              </select>
              {errors.difficulty && <div className="form-error">{errors.difficulty}</div>}
            </div>
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label>Category</label>
              <select
                name="category_id"
                className="form-select"
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">Select a category (optional)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {'  '.repeat(cat.level)}{cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>AI Tool</label>
              <select
                name="tool_id"
                className="form-select"
                value={formData.tool_id}
                onChange={handleChange}
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
              <div className="form-help">
                Which AI tool is this prompt designed for?
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="form-section">
          <h3>Tags</h3>

          <div className="form-group">
            <label>Add Tags</label>
            <div className="tags-input-container">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag-item">
                  {tag}
                  <button
                    type="button"
                    className="tag-remove"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Type and press Enter or comma..."
              />
            </div>
            <div className="form-help">
              Add relevant tags to help users find your prompt (press Enter or comma to add)
            </div>
          </div>

          {/* Common Tags */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Common tags:
            </div>
            <div className="prompt-card-tags">
              {COMMON_TAGS.slice(0, 15).map((tag, index) => (
                <button
                  key={index}
                  type="button"
                  className="prompt-tag"
                  onClick={() => handleAddTag(tag)}
                  style={{ cursor: 'pointer', opacity: formData.tags.includes(tag) ? 0.5 : 1 }}
                  disabled={formData.tags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="form-section">
          <h3>Examples (Optional)</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Upload or provide a URL to an example image/video to help users understand what this prompt creates.
          </p>

          <div className="form-group">
            <label>Example Image</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <input
                  type="file"
                  accept="image/*"
                  id="example-image-upload"
                  className="file-input"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="example-image-upload" className="file-upload-btn">
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
                  name="example_image_url"
                  className="form-input"
                  value={formData.example_image_url}
                  onChange={handleChange}
                  placeholder="Or enter image URL: https://example.com/image.jpg"
                />
              </div>
            </div>
            {formData.example_image_url && (
              <div style={{ marginTop: '1rem' }}>
                <img 
                  src={formData.example_image_url} 
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
            <div className="form-help">
              Upload an image file or provide a URL to an example image generated with this prompt
            </div>
          </div>

          <div className="form-group">
            <label>Example Video URL</label>
            <input
              type="url"
              name="example_video_url"
              className="form-input"
              value={formData.example_video_url}
              onChange={handleChange}
              placeholder="https://example.com/video.mp4 or YouTube/Vimeo URL"
            />
            <div className="form-help">
              URL to an example video generated with this prompt (supports YouTube, Vimeo, or direct video URLs)
            </div>
          </div>
        </div>

        {/* Preview */}
        {formData.title && formData.prompt_text && (
          <div className="form-section">
            <h3>Preview</h3>
            <div className="prompt-card" style={{ maxWidth: '400px' }}>
              <div className="prompt-card-header">
                <h3 className="prompt-card-title">{formData.title}</h3>
                <div className="prompt-card-meta">
                  <span className="prompt-type-badge">
                    {getPromptTypeIcon(formData.prompt_type)} {formData.prompt_type}
                  </span>
                  <span className="prompt-difficulty-badge">
                    {getDifficultyIcon(formData.difficulty)} {formData.difficulty}
                  </span>
                </div>
              </div>
              <div className="prompt-card-body">
                {formData.description && (
                  <p className="prompt-card-description">
                    {formData.description.substring(0, 120)}...
                  </p>
                )}
                <div className="prompt-card-text">
                  {formData.prompt_text.substring(0, 150)}...
                </div>
                {formData.tags.length > 0 && (
                  <div className="prompt-card-tags">
                    {formData.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="prompt-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                Submitting...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Submit Prompt
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#eff6ff', 
          borderRadius: '8px',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px', color: '#3b82f6', flexShrink: 0 }}>
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
              <strong>Note:</strong> Your prompt will be reviewed by our team before being published. 
              We'll notify you once it's approved. Thank you for contributing to the community!
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default PromptForm;
