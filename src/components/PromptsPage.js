import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cachedPromptService from '../services/cachedPromptService';
import promptService from '../services/promptService'; // For write operations (voting)
import PromptCard from './PromptCard';
import PromptFilters from './PromptFilters';
import SEO from './SEO';
import '../styles/PromptsLibrary.css';

function PromptsPage() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPrompts, setTotalPrompts] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    type: null,
    category_id: null,
    tool_id: null,
    sort: 'created_at',
    order: 'desc',
    page: 1,
    limit: 12
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Check if we should append (page > 1) or replace (page === 1)
    const shouldAppend = filters.page > 1;
    loadPrompts(shouldAppend);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadCategories()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadPrompts = async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const data = await cachedPromptService.getPrompts({
        search: filters.search,
        type: filters.type,
        category_id: filters.category_id,
        tool_id: filters.tool_id,
        sort: filters.sort,
        order: filters.order,
        page: filters.page,
        limit: filters.limit
      });
      
      const newPrompts = data.prompts || data;
      
      if (append) {
        // Append new prompts to existing ones
        setPrompts(prev => [...prev, ...newPrompts]);
      } else {
        // Replace prompts
        setPrompts(newPrompts);
      }
      
      // Calculate total pages and check if there's more
      if (data.total !== undefined) {
        setTotalPrompts(data.total);
        setTotalPages(Math.ceil(data.total / filters.limit));
        setHasMore(filters.page < Math.ceil(data.total / filters.limit));
      } else {
        // If no total, check if we got fewer items than limit
        setHasMore(newPrompts.length === filters.limit);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
      if (!append) {
        setPrompts([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await cachedPromptService.getCategories();
      // Flatten categories for dropdown
      const flatCategories = flattenCategories(data);
      // Remove duplicates by ID (additional safety check)
      const uniqueCategories = flatCategories.filter((cat, index, self) => 
        index === self.findIndex(c => c.id === cat.id)
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const flattenCategories = (categories, level = 0, seenIds = new Set(), seenNames = new Set()) => {
    let result = [];
    if (!categories || !Array.isArray(categories)) {
      return result;
    }
    categories.forEach(cat => {
      // Skip if category is invalid or we've already seen this category ID
      if (cat && cat.id && !seenIds.has(cat.id)) {
        // Only include parent categories (no parent_id) or if we haven't seen this name yet
        // This prevents showing duplicate category names (parent and child with same name)
        const isParent = !cat.parent_id || cat.parent_id === null;
        const nameKey = (cat.name || '').toLowerCase().trim();
        
        if (isParent || !seenNames.has(nameKey)) {
          seenIds.add(cat.id);
          seenNames.add(nameKey);
          result.push({ ...cat, level });
          // Don't include children in the dropdown to avoid duplicates
          // if (cat.children && Array.isArray(cat.children) && cat.children.length > 0) {
          //   result = result.concat(flattenCategories(cat.children, level + 1, seenIds, seenNames));
          // }
        }
      }
    });
    return result;
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...newFilters, page: 1 });
    setPage(1);
    setHasMore(true);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: null,
      category_id: null,
      tool_id: null,
      sort: 'created_at',
      order: 'desc',
      page: 1,
      limit: 12
    });
    setPage(1);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      setFilters(prev => ({ ...prev, page: nextPage }));
      // Load prompts will be triggered by filters change
    }
  };

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Load more when user is 200px from bottom
      if (scrollTop + windowHeight >= documentHeight - 200) {
        handleLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, page]);

  const handleSave = (promptId) => {
    // TODO: Implement save to collection
    console.log('Save prompt:', promptId);
    alert('Please login to save prompts to your collection');
  };

  const handleUpvote = async (promptId) => {
    try {
      // TODO: Get user ID from auth context
      const userId = 1; // Placeholder
      await promptService.upvotePrompt(promptId, userId);
      loadPrompts(); // Reload to get updated counts
    } catch (error) {
      console.error('Error upvoting:', error);
      alert('Please login to vote on prompts');
    }
  };

  const handleDownvote = async (promptId) => {
    try {
      // TODO: Get user ID from auth context
      const userId = 1; // Placeholder
      await promptService.downvotePrompt(promptId, userId);
      loadPrompts(); // Reload to get updated counts
    } catch (error) {
      console.error('Error downvoting:', error);
      alert('Please login to vote on prompts');
    }
  };

  return (
    <div className="prompts-library">
      <SEO 
        title={`AI Prompts Library - ${filters.search ? `Search: ${filters.search}` : filters.category_id ? 'Browse by Category' : filters.tool_id ? 'Browse by Tool' : 'Free AI Prompts'} | Clarifyall`}
        description={`Browse our collection of ${prompts.length > 0 ? `${prompts.length}+` : ''} AI prompts for image generation, video creation, and editing. Find prompts for Midjourney, DALL-E, Stable Diffusion, and more. ${filters.difficulty ? `Difficulty: ${filters.difficulty}.` : ''}`}
        keywords={`AI prompts, ${filters.type || 'image generation'} prompts, Midjourney prompts, DALL-E prompts, Stable Diffusion prompts, AI art, image generation, video prompts, ${filters.difficulty ? `${filters.difficulty} prompts` : ''}`}
        dynamicKeywords={{
          totalPrompts: prompts.length,
          type: filters.type,
          difficulty: filters.difficulty,
          category: filters.category_id
        }}
        canonicalUrl="/prompts"
        schemaType="website"
      />
      

      {/* Header */}
      <div className="prompts-header">
        <h1>AI Prompts Library</h1>
      
      </div>

      {/* Filters */}
      <PromptFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        onClearFilters={handleClearFilters}
      />

      {/* Results Header with Sort */}
      {!loading && prompts.length > 0 && (
        <div className="results-header">
          <div className="results-count">
            <span>
              Showing {prompts.length} 
              {totalPrompts > 0 && ` of ${totalPrompts}`} 
              {' '}prompt{prompts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="sort-control">
            <label>Sort By:</label>
            <select
              className="sort-select"
              value={filters.sort || 'created_at'}
              onChange={(e) => handleFilterChange({ ...filters, sort: e.target.value })}
            >
              <option value="created_at">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="views">Most Viewed</option>
              <option value="upvotes">Most Upvoted</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="prompts-loading">
          <div className="spinner"></div>
          <p>Loading prompts...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && prompts.length === 0 && (
        <div className="prompts-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3>No prompts found</h3>
          <p>Try adjusting your filters or be the first to submit a prompt!</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/submit-prompt')}
            style={{ marginTop: '1rem' }}
          >
            Submit Your Prompt
          </button>
        </div>
      )}

      {/* Prompts Grid */}
      {!loading && prompts.length > 0 && (
        <>
          <div className="prompts-grid">
            {prompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onSave={handleSave}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                isSaved={false} // TODO: Check if saved
              />
            ))}
          </div>

          {/* Load More Button / Infinite Scroll Indicator */}
          {hasMore && (
            <div className="load-more-container">
              {loadingMore ? (
                <div className="loading-more">
                  <div className="spinner"></div>
                  <p>Loading more prompts...</p>
                </div>
              ) : (
                <button 
                  className="load-more-btn"
                  onClick={handleLoadMore}
                >
                  Load More Prompts
                </button>
              )}
            </div>
          )}

          {/* End of results message */}
          {!hasMore && prompts.length > 0 && (
            <div className="end-of-results">
              <p>You've reached the end! 🎉</p>
              <p className="end-of-results-subtitle">Showing all {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PromptsPage;
