import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from './SEO';
import { getCategories } from '../services/categoryService';
import { submitTool } from '../services/toolService';
import { PRICING_MODELS, PRICING_DESCRIPTIONS } from '../utils/constants';
import '../styles/SubmitToolPage.css';

function SubmitToolPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    categoryIds: [],
    pricingModel: '',
    shortDescription: '',
    fullDescription: '',
    submitterEmail: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  // Cleanup logo preview URL on unmount
  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  useEffect(() => {
    if (logoFile) {
      const preview = URL.createObjectURL(logoFile);
      setLogoPreview(preview);
      return () => {
        URL.revokeObjectURL(preview);
      };
    } else {
      setLogoPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoFile]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
      setFilteredCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
      setFilteredCategories([]);
    }
  };

  useEffect(() => {
    if (categorySearch.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(cat =>
        cat.name?.toLowerCase().includes(categorySearch.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [categorySearch, categories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCategoryChange = (categoryId) => {
    const currentCategories = [...formData.categoryIds];
    const index = currentCategories.indexOf(categoryId);

    if (index > -1) {
      // Deselect category
      currentCategories.splice(index, 1);
      setError(''); // Clear error when deselecting
    } else {
      // Select category
      if (currentCategories.length < 3) {
        currentCategories.push(categoryId);
        setError(''); // Clear error when selecting
      } else {
        setError('You can select a maximum of 3 categories');
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

    setFormData({ ...formData, categoryIds: currentCategories });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (PNG, JPG, GIF, or WebP)');
        setTimeout(() => setError(''), 3000);
        e.target.value = '';
        return;
      }
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setTimeout(() => setError(''), 3000);
        e.target.value = '';
        return;
      }
      
      setLogoFile(file);
      setError(''); // Clear any previous errors
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await submitTool(formData, logoFile);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit tool. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="submit-page">
        <div className="success-message">
          <h2>✓ Tool Submitted Successfully!</h2>
          <p>Thank you for your submission. Our team will review it within 48 hours.</p>
          <p>Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-page">
      <SEO 
        title="Submit Your AI Tool - Share with the Community | Clarifyall"
        description="Submit your AI tool to Clarifyall and reach thousands of users. Free submission with quick review process. Help others discover innovative AI solutions."
        keywords="submit AI tool, add AI tool, list AI tool, AI tool submission, share AI tool, promote AI tool, AI tool directory submission, add to AI directory, submit software"
        dynamicKeywords={{
          type: 'submission',
          category: 'AI tools'
        }}
        canonicalUrl="/submit"
        schemaType="website"
      />
      
      <div className="submit-container">
        <div className="guidelines-column">
          <h2>Help Us Clarify: Add Your AI Tool</h2>
          
          <div className="guideline-section">
            <h3>Thanks for sharing!</h3>
            <p>
              Submitting a tool to Clarifyall helps thousands of users find the perfect AI solution. 
              We review every submission to ensure quality.
            </p>
          </div>

          <div className="guideline-section">
            <h3>Our Guidelines:</h3>
            <ul>
              <li><strong>✓ Be Clear:</strong> Provide a simple, one-line description.</li>
              <li><strong>✓ Be Honest:</strong> Select the correct pricing and categories.</li>
              <li><strong>✗ No Affiliates:</strong> Please link directly to the tool, not an affiliate link.</li>
            </ul>
          </div>

          <div className="guideline-section">
            <h3>What's Next?</h3>
            <p>
              Our team will review your submission. You'll receive an email if it's approved 
              (usually within 48 hours).
            </p>
          </div>
        </div>

        <div className="form-column">
          <form onSubmit={handleSubmit} className="submit-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Tool Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label>Tool Website (URL) *</label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                placeholder="https://..."
                required
              />
            </div>

            <div className="form-group">
              <label>Categories (Select up to 3) *</label>
              <div className="category-selection-wrapper">
                {categories.length === 0 ? (
                  <div className="category-loading">Loading categories...</div>
                ) : (
                  <>
                    {categories.length > 8 && (
                      <div className="category-search-wrapper">
                        <input
                          type="text"
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="category-search-input"
                        />
                        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="category-grid">
                      {filteredCategories.length === 0 ? (
                        <div className="category-no-results">
                          No categories found matching "{categorySearch}"
                        </div>
                      ) : (
                        filteredCategories.map((category) => (
                          <label 
                            key={category.id} 
                            className={`category-checkbox ${formData.categoryIds.includes(category.id) ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.categoryIds.includes(category.id)}
                              onChange={() => handleCategoryChange(category.id)}
                            />
                            <span className="category-name">{category.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                    <div className="category-selection-info">
                      <span className="selection-count">
                        {formData.categoryIds.length}/3 categories selected
                      </span>
                      {formData.categoryIds.length === 3 && (
                        <span className="selection-limit">Maximum reached</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Pricing Model *</label>
              <div className="pricing-options">
                {PRICING_MODELS.map((pricing) => (
                  <label 
                    key={pricing.value} 
                    className={`pricing-option ${formData.pricingModel === pricing.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="pricingModel"
                      value={pricing.value}
                      checked={formData.pricingModel === pricing.value}
                      onChange={handleInputChange}
                      required
                    />
                    <div>
                      <strong>{pricing.label}</strong>
                      <p>{PRICING_DESCRIPTIONS[pricing.value]}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Short Description (Max 150 chars) *</label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                maxLength={150}
                required
              />
              <small>{formData.shortDescription.length}/150</small>
            </div>

            <div className="form-group">
              <label>Full Description (Optional)</label>
              <textarea
                name="fullDescription"
                value={formData.fullDescription}
                onChange={handleInputChange}
                rows={8}
                placeholder="Provide a detailed description of the tool, its features, capabilities, and use cases..."
              />
              <small>{formData.fullDescription.length} characters</small>
            </div>

            <div className="form-group">
              <label>Upload Logo (High-Res PNG) *</label>
              <div className="file-upload-wrapper">
                <label htmlFor="logo-upload" className="file-upload-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  {logoFile ? (
                    <span className="file-name">{logoFile.name}</span>
                  ) : (
                    <span className="file-placeholder">Choose a file or drag and drop</span>
                  )}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleFileChange}
                  required
                  className="file-input-hidden"
                />
                {logoPreview && (
                  <div className="file-preview">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="logo-preview-image"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        if (logoPreview) {
                          URL.revokeObjectURL(logoPreview);
                          setLogoPreview(null);
                        }
                      }}
                      className="file-remove-btn"
                      aria-label="Remove logo"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <small>Max file size: 5MB | Supported: PNG, JPG, GIF, WebP</small>
            </div>

            <div className="form-group">
              <label>Your Email (For notification) *</label>
              <input
                type="email"
                name="submitterEmail"
                value={formData.submitterEmail}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'SUBMIT FOR REVIEW'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SubmitToolPage;
