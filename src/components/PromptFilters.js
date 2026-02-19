import React from 'react';
import {
  PROMPT_TYPES,
  PROMPT_TYPE_LABELS,
  PROMPT_TYPE_ICONS,
  POPULAR_AI_TOOLS,
  getPromptTypeIcon
} from '../utils/promptConstants';
import '../styles/PromptsLibrary.css';

function PromptFilters({ 
  filters, 
  onFilterChange, 
  categories = [],
  onClearFilters 
}) {
  const handleTypeToggle = (type) => {
    onFilterChange({ ...filters, type: filters.type === type ? null : type });
  };

  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleCategoryChange = (e) => {
    onFilterChange({ ...filters, category_id: e.target.value || null });
  };

  const handleToolChange = (e) => {
    onFilterChange({ ...filters, tool_id: e.target.value || null });
  };

  const handleSortChange = (e) => {
    onFilterChange({ ...filters, sort: e.target.value });
  };

  const activeFilterCount = [
    filters.type,
    filters.category_id,
    filters.tool_id,
    filters.search
  ].filter(Boolean).length;

  const handleClear = () => {
    if (onClearFilters) {
      onClearFilters();
    }
  };

  return (
    <div className="prompts-filters">
      {/* Compact Search and Filters */}
      <div className="filters-compact">
        <div className="filter-search">
          <input
            type="text"
            className="filter-input"
            placeholder="Search prompts..."
            value={filters.search || ''}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filter-dropdowns">
          <select
            className="filter-select compact"
            value={filters.category_id || ''}
            onChange={handleCategoryChange}
          >
            <option value="">All Categories</option>
            {Array.isArray(categories) && categories.length > 0
              ? (() => {
                  // Use Map to ensure unique categories by name (not ID)
                  // This prevents showing parent and child with same name
                  const uniqueMap = new Map();
                  categories.forEach(cat => {
                    if (cat && cat.id && cat.name) {
                      const nameKey = cat.name.toLowerCase().trim();
                      // Only keep the first occurrence (parent category)
                      if (!uniqueMap.has(nameKey)) {
                        uniqueMap.set(nameKey, cat);
                      }
                    }
                  });
                  return Array.from(uniqueMap.values())
                    .sort((a, b) => {
                      // Sort by name alphabetically
                      return (a.name || '').localeCompare(b.name || '');
                    })
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                      </option>
                    ));
                })()
              : null}
          </select>

          <select
            className="filter-select compact"
            value={filters.tool_id || ''}
            onChange={handleToolChange}
          >
            <option value="">All Tools</option>
            {POPULAR_AI_TOOLS.map(tool => (
              <option key={tool} value={tool}>
                {tool}
              </option>
            ))}
          </select>
        </div>

        {activeFilterCount > 0 && (
          <button
            className="clear-filters-btn"
            onClick={handleClear}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Type Filters */}
      <div className="type-filters">
        {Object.keys(PROMPT_TYPES).map(type => (
          <button
            key={type}
            className={`type-filter-btn ${filters.type === type ? 'active' : ''}`}
            onClick={() => handleTypeToggle(type)}
          >
            {getPromptTypeIcon(type)} {PROMPT_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PromptFilters;
