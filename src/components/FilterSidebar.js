import React, { useState, useEffect } from 'react';
import { getCategories } from '../services/categoryService';
import { PRICING_MODELS } from '../utils/constants';
import '../styles/FilterSidebar.css';

// Helper function to get icon for each category
const getCategoryIcon = (categoryName) => {
  const name = categoryName.toLowerCase();

  // Chatbots & Virtual Companions
  if (name.includes('chatbot') || name.includes('virtual') || name.includes('companion')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    );
  }

  // Image Generation & Editing
  if (name.includes('image') || name.includes('photo') || name.includes('picture')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }

  // Writing & Editing
  if (name.includes('writing') || name.includes('edit') || name.includes('content')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    );
  }

  // Coding & Development
  if (name.includes('cod') || name.includes('develop') || name.includes('program')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  }

  // Video & Animation
  if (name.includes('video') || name.includes('animation') || name.includes('film')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }

  // Audio & Music
  if (name.includes('audio') || name.includes('music') || name.includes('sound')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    );
  }

  // Marketing & Advertising
  if (name.includes('market') || name.includes('advertis') || name.includes('seo')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    );
  }

  // Office & Productivity
  if (name.includes('office') || name.includes('productiv') || name.includes('business')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }

  // Data & Analytics
  if (name.includes('data') || name.includes('analytic') || name.includes('chart')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  }

  // Design & Graphics
  if (name.includes('design') || name.includes('graphic') || name.includes('art')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    );
  }

  // Education & Learning
  if (name.includes('educat') || name.includes('learn') || name.includes('teach')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }

  // E-commerce & Sales
  if (name.includes('commerce') || name.includes('shop') || name.includes('sales')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    );
  }

  // Social Media
  if (name.includes('social') || name.includes('media')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    );
  }

  // Gaming
  if (name.includes('gam') || name.includes('play')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    );
  }

  // Healthcare & Medical
  if (name.includes('health') || name.includes('medical') || name.includes('fitness')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  }

  // Research & Science
  if (name.includes('research') || name.includes('science') || name.includes('lab')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    );
  }

  // Default icon for other categories
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
};

function FilterSidebar({ onFilterChange, currentFilters }) {
  const [categories, setCategories] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedPricing, setSelectedPricing] = useState(currentFilters.pricingModel || '');
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.categoryId || '');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handlePricingChange = (pricing) => {
    const newPricing = selectedPricing === pricing ? '' : pricing;
    setSelectedPricing(newPricing);
    onFilterChange({ pricingModel: newPricing, categoryId: selectedCategory });
  };

  const handleCategoryChange = (categoryId) => {
    // Convert to number for proper comparison
    const numCategoryId = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
    const currentCategoryNum = typeof selectedCategory === 'string' ? parseInt(selectedCategory) : selectedCategory;

    const newCategory = currentCategoryNum === numCategoryId ? '' : categoryId;
    setSelectedCategory(newCategory);
    onFilterChange({ pricingModel: selectedPricing, categoryId: newCategory });
  };

  const handleClearFilters = () => {
    setSelectedPricing('');
    setSelectedCategory('');
    onFilterChange({ pricingModel: '', categoryId: '' });
  };

  const hasActiveFilters = selectedPricing || selectedCategory;

  // Filter categories based on search
  const filteredCategories = categorySearch
    ? categories.filter(cat =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    )
    : categories;

  const displayedCategories = showAllCategories
    ? filteredCategories
    : filteredCategories.slice(0, 8);

  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <h3 className="filter-title">
          <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h3>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={handleClearFilters}>
            Clear All
          </button>
        )}
      </div>

      {/* Pricing Filter */}
      <div className="filter-section">
        <h4 className="filter-section-title">
          <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pricing
        </h4>
        <div className="filter-options">
          {PRICING_MODELS.map((model) => (
            <label key={model.value} className={`filter-option ${selectedPricing === model.value ? 'active' : ''}`}>
              <input
                type="radio"
                name="pricing"
                value={model.value}
                checked={selectedPricing === model.value}
                onChange={() => handlePricingChange(model.value)}
              />
              <span className="option-label">{model.label}</span>
              <span className="option-checkmark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories Filter */}
      <div className="filter-section">
        <h4 className="filter-section-title">
          <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Categories
        </h4>

        {/* Category Search */}
        <div className="category-search-wrapper">
          <input
            type="text"
            className="category-search"
            placeholder="Search categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
          />
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="filter-options">
          {displayedCategories.map((category) => {
            // Convert both to numbers for proper comparison
            const isSelected = (typeof selectedCategory === 'string' ? parseInt(selectedCategory) : selectedCategory) === category.id;

            return (
              <label key={category.id} className={`filter-option ${isSelected ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="category"
                  value={category.id}
                  checked={isSelected}
                  onChange={() => handleCategoryChange(category.id)}
                />
                <span className="category-icon">
                  {getCategoryIcon(category.name)}
                </span>
                <span className="option-label">{category.name}</span>
                <span className="option-checkmark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </label>
            );
          })}
        </div>

        {!categorySearch && filteredCategories.length > 8 && (
          <button
            className="show-more-btn"
            onClick={() => setShowAllCategories(!showAllCategories)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAllCategories ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
            {showAllCategories ? 'Show Less' : `Show All ${filteredCategories.length} Categories`}
          </button>
        )}

        {categorySearch && filteredCategories.length === 0 && (
          <div className="no-results">
            <p>No categories found matching "{categorySearch}"</p>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="active-filters">
          <h4 className="active-filters-title">Active Filters</h4>
          <div className="active-filter-tags">
            {selectedPricing && (
              <span className="active-filter-tag">
                {PRICING_MODELS.find(m => m.value === selectedPricing)?.label}
                <button onClick={() => handlePricingChange(selectedPricing)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="active-filter-tag">
                {categories.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => handleCategoryChange(selectedCategory)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterSidebar;
