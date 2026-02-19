import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from './SEO';
import SearchBar from './SearchBar';
import FilterSidebar from './FilterSidebar';
import ToolGrid from './ToolGrid';
import { getTools } from '../services/toolService';
import { filterTools, paginateTools } from '../utils/toolFilter';
import '../styles/HomePage.css';

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Cache all tools - loaded once on mount
  const [allTools, setAllTools] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Current filters (no search term - handled separately for real-time)
  const [filters, setFilters] = useState({
    searchTerm: '',
    pricingModel: '',
    categoryId: '',
    page: 0,
    size: 12
  });

  // Handle URL parameters on mount
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setFilters(prev => ({ ...prev, categoryId: categoryFromUrl, page: 0 }));
    }
  }, [searchParams]);

  // Load all tools once on mount (only DB call)
  useEffect(() => {
    loadAllTools();
  }, []);

  const loadAllTools = async () => {
    try {
      setToolsLoading(true);
      setError(null);
      // Load ALL approved tools without filters (no pagination, no search, no limit)
      // Use a large size to get all tools in one call
      const response = await getTools({
        size: 5000, // Get all tools
        page: 0
      });

      // Store all tools in cache
      setAllTools(response.tools || []);
    } catch (err) {
      setError('Failed to load tools. Please try again later.');
      console.error('Error fetching tools:', err);
    } finally {
      setToolsLoading(false);
    }
  };

  // Client-side filtering - instant results, no DB calls
  const filteredAndPaginated = useMemo(() => {
    if (toolsLoading || allTools.length === 0) {
      return {
        tools: [],
        totalPages: 0,
        totalElements: 0
      };
    }

    // Filter tools client-side
    const filtered = filterTools(
      allTools,
      filters.searchTerm,
      {
        categoryId: filters.categoryId,
        pricingModel: filters.pricingModel
      }
    );

    // Paginate filtered results
    return paginateTools(filtered, filters.page, filters.size);
  }, [allTools, filters.searchTerm, filters.categoryId, filters.pricingModel, filters.page, filters.size, toolsLoading]);

  const handleSearch = useCallback((searchTerm) => {
    setFilters(prev => ({ ...prev, searchTerm, page: 0 }));
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 0 }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="homepage">
      <SEO
        title="Clarifyall - Discover the Best AI Tools | AI Tool Directory"
        description={`Find and compare ${allTools.length > 0 ? allTools.length : 'hundreds of'}+ AI tools for writing, design, coding, marketing, and more. Browse by category, filter by pricing, and discover free AI tools. Your complete AI tool directory.`}
        keywords="AI tools, artificial intelligence tools, AI tool directory, best AI tools, free AI tools, AI writing tools, AI image generator, AI coding tools, AI chatbot, machine learning tools, AI productivity tools, AI design tools, AI marketing tools, ChatGPT alternatives, AI tool comparison, AI software directory"
        dynamicKeywords={{ totalTools: allTools.length > 0 ? allTools.length : filteredAndPaginated.totalElements }}
        canonicalUrl="/"
        schemaType="website"
      />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <svg className="hero-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {/* AI Brain/Neural Network Icon */}
              <circle cx="12" cy="12" r="3" strokeWidth="2" fill="currentColor" opacity="0.2" />
              <circle cx="6" cy="6" r="2" strokeWidth="2" />
              <circle cx="18" cy="6" r="2" strokeWidth="2" />
              <circle cx="6" cy="18" r="2" strokeWidth="2" />
              <circle cx="18" cy="18" r="2" strokeWidth="2" />
              <line x1="8" y1="7" x2="10" y2="10" strokeWidth="1.5" />
              <line x1="16" y1="7" x2="14" y2="10" strokeWidth="1.5" />
              <line x1="8" y1="17" x2="10" y2="14" strokeWidth="1.5" />
              <line x1="16" y1="17" x2="14" y2="14" strokeWidth="1.5" />
            </svg>
            <span>AI Tools, Simplified</span>
          </div>
          <h1 className="hero-title">
            Find & Master Your
            <br />
            <span className="text-gradient">Perfect AI Tool</span>
          </h1>
          <p className="hero-subtitle">
            Discover, compare, and master the best AI tools for every task.
            <br />
            From writing to design, coding to marketing - <strong>{allTools.length > 0 ? allTools.length : filteredAndPaginated.totalElements}+ tools</strong> at your fingertips!
          </p>

          {/* Search Bar in Hero */}
          <div className="hero-search">
            <SearchBar onSearch={handleSearch} realTime={true} />
          </div>

          {/* Quick Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">{allTools.length > 0 ? allTools.length : filteredAndPaginated.totalElements}+</div>
              <div className="stat-label">AI Tools</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">25+</div>
              <div className="stat-label">Categories</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Free Access</div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="hero-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </section>

      {/* Main Content */}
      <div className="homepage-container">
        <div className="homepage-layout">
          {/* Filter Sidebar */}
          <aside className="sidebar-wrapper">
            <FilterSidebar
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />
          </aside>

          {/* Tools Grid */}
          <main className="content-wrapper">
            {error && (
              <div className="error-message">
                <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {toolsLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading amazing AI tools...</p>
              </div>
            ) : (
              <>
                <div className="results-header">
                  <h2 className="results-title">
                    {filters.searchTerm ? (
                      <>
                        Search results for <span className="text-gradient">"{filters.searchTerm}"</span>
                      </>
                    ) : (
                      <>
                        All <span className="text-gradient">AI Tools</span>
                      </>
                    )}
                  </h2>
                  <p className="results-count">
                    Showing <strong style={{ color: 'var(--primary-color)' }}>{filteredAndPaginated.tools?.length || 0}</strong> of <strong style={{ color: 'var(--primary-color)' }}>{filteredAndPaginated.totalElements}</strong> tools
                    {filters.searchTerm && (
                      <span className="search-info"> • Instant search results</span>
                    )}
                  </p>
                </div>

                <ToolGrid
                  tools={filteredAndPaginated.tools || []}
                  currentPage={filters.page}
                  totalPages={filteredAndPaginated.totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
