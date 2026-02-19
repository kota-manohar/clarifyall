/**
 * Client-side tool filtering utilities
 * Filters tools based on search term and filters
 */

/**
 * Filter tools based on search term and filters
 * @param {Array} allTools - All tools to filter
 * @param {string} searchTerm - Search term
 * @param {Object} filters - Filter object { categoryId, pricingModel }
 * @returns {Array} Filtered tools
 */
export function filterTools(allTools = [], searchTerm = '', filters = {}) {
  if (!Array.isArray(allTools)) return [];

  let filtered = [...allTools];

  // Search filter
  if (searchTerm && searchTerm.trim()) {
    const search = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(tool => {
      // Search in multiple fields
      const name = (tool.name || '').toLowerCase();
      const description = (tool.description || tool.short_description || '').toLowerCase();
      const fullDescription = (tool.full_description || '').toLowerCase();
      const slug = (tool.slug || '').toLowerCase();
      const websiteUrl = (tool.website_url || tool.websiteUrl || '').toLowerCase();

      // Search in category name
      const categoryName = tool.categories?.map(cat => cat.name?.toLowerCase()).join(' ') || '';
      const categoryNameSingle = tool.category_name?.toLowerCase() || '';

      // Search in feature tags (if JSON string, parse it)
      let featureTags = '';
      try {
        if (tool.feature_tags) {
          const tags = typeof tool.feature_tags === 'string'
            ? JSON.parse(tool.feature_tags)
            : tool.feature_tags;
          featureTags = Array.isArray(tags) ? tags.join(' ').toLowerCase() : '';
        }
      } catch (e) {
        featureTags = '';
      }

      // Search in platforms
      let platforms = '';
      try {
        if (tool.platforms) {
          const plat = typeof tool.platforms === 'string'
            ? JSON.parse(tool.platforms)
            : tool.platforms;
          platforms = Array.isArray(plat) ? plat.join(' ').toLowerCase() : '';
        }
      } catch (e) {
        platforms = '';
      }

      return (
        name.includes(search) ||
        description.includes(search) ||
        fullDescription.includes(search) ||
        slug.includes(search) ||
        websiteUrl.includes(search) ||
        categoryName.includes(search) ||
        categoryNameSingle.includes(search) ||
        featureTags.includes(search) ||
        platforms.includes(search)
      );
    });
  }

  // Category filter
  if (filters.categoryId) {
    const filterCategoryId = parseInt(filters.categoryId);

    filtered = filtered.filter(tool => {
      // Check single category_id field (from database)
      const toolCategoryId = tool.category_id || tool.categoryId;
      if (toolCategoryId) {
        const numToolCategoryId = typeof toolCategoryId === 'string' ? parseInt(toolCategoryId) : toolCategoryId;
        if (numToolCategoryId === filterCategoryId) {
          return true;
        }
      }

      // Check categories array (from API response)
      if (tool.categories && Array.isArray(tool.categories)) {
        return tool.categories.some(cat => {
          const catId = typeof cat.id === 'string' ? parseInt(cat.id) : cat.id;
          return catId === filterCategoryId;
        });
      }

      return false;
    });
  }

  // Pricing model filter
  if (filters.pricingModel) {
    filtered = filtered.filter(tool => {
      const pricing = tool.pricing_model || tool.pricingModel;
      return pricing === filters.pricingModel;
    });
  }

  return filtered;
}

/**
 * Get paginated results from filtered tools
 * @param {Array} filteredTools - Filtered tools
 * @param {number} page - Current page (0-indexed)
 * @param {number} size - Items per page
 * @returns {Object} { tools, totalPages, totalElements }
 */
export function paginateTools(filteredTools = [], page = 0, size = 12) {
  const totalElements = filteredTools.length;
  const totalPages = Math.ceil(totalElements / size);
  const startIndex = page * size;
  const endIndex = startIndex + size;
  const tools = filteredTools.slice(startIndex, endIndex);

  return {
    tools,
    totalPages,
    totalElements,
    currentPage: page,
    size
  };
}

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function with cancel method
 */
export function debounce(func, wait) {
  let timeout;

  const debouncedFunction = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };

  // Add cancel method
  debouncedFunction.cancel = () => {
    clearTimeout(timeout);
  };

  return debouncedFunction;
}

