import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from './SEO';
import ToolGrid from './ToolGrid';
import { getCategoryBySlug, getCategoryById } from '../services/categoryService';
import { getTools } from '../services/toolService';
import { filterTools, paginateTools } from '../utils/toolFilter';
import '../styles/CategoryDetailPage.css'; // We'll need to create this or reuse existing

function CategoryDetailPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 12;

    useEffect(() => {
        loadCategoryAndTools();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const loadCategoryAndTools = async () => {
        try {
            setLoading(true);
            setError(null);
            setCurrentPage(0);

            // 1. Get Category
            let categoryData;
            try {
                // Try fetching by slug first
                categoryData = await getCategoryBySlug(slug);
            } catch (e) {
                // If not found by slug, maybe it's an ID (legacy support or fallback)
                // But the route is /category/:slug. If user passed an ID, we should probably handle it.
                // For now, let's assume it's a slug or ID that matches what getCategoryBySlug expects or we try ID.
                try {
                    if (!isNaN(slug)) {
                        categoryData = await getCategoryById(slug);
                    }
                } catch (e2) {
                    console.log("Not found by ID either");
                }
            }

            if (!categoryData) {
                setError('Category not found');
                setLoading(false);
                return;
            }

            setCategory(categoryData);

            // 2. Get Tools for this Category
            // We can use getTools and filter, OR if there's a specialized getToolsByCategory, use that.
            // Based on HomePage.js, it fetches ALL tools and filters client side. 
            // Ideally we should have a server-side filter, but let's stick to what works for now or check toolService.
            // HomePage.js: const response = await getTools({ size: 5000, page: 0 });
            // Then filterTools(allTools, ... { categoryId: ... })

            const response = await getTools({ size: 5000, page: 0 });
            const allTools = response.tools || [];

            const filtered = filterTools(allTools, '', { categoryId: categoryData.id });
            setTools(filtered);

        } catch (err) {
            console.error('Error loading category:', err);
            setError('Failed to load category details');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Paginate results
    const paginatedTools = paginateTools(tools, currentPage, pageSize);

    if (loading) {
        return (
            <div className="category-detail-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading category...</p>
                </div>
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="category-detail-page">
                <div className="error-container">
                    <h2>Category Not Found</h2>
                    <button onClick={() => navigate('/categories')} className="primary-button">
                        Browse All Categories
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="category-detail-page">
            <SEO
                title={`Best ${category.name} AI Tools for 2026 - Compare & Review`}
                description={`Discover and compare the best ${category.name} AI tools. Find top-rated ${category.name.toLowerCase()} software, read reviews, and find the perfect tool for your needs.`}
                keywords={`${category.name}, AI ${category.name}, best ${category.name} tools, top ${category.name} software`}
                dynamicKeywords={{
                    categoryName: category.name,
                    totalTools: tools.length
                }}
                canonicalUrl={`/category/${slug}`}
                schemaType="website"
            />

            {/* Hero Section */}
            <section className="category-hero" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '4rem 2rem', color: 'white', textAlign: 'center' }}>
                <div className="category-hero-content">
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Best {category.name} AI Tools</h1>
                    <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '800px', margin: '0 auto' }}>
                        {category.description || `Explore our curated list of the best ${category.name} tools powered by artificial intelligence.`}
                    </p>
                </div>
            </section>

            {/* Tools Grid */}
            <section className="category-tools-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="results-header" style={{ marginBottom: '2rem' }}>
                    <h2>Top Rated Tools</h2>
                    <p>Showing {tools.length} results</p>
                </div>

                <ToolGrid
                    tools={paginatedTools.tools}
                    currentPage={currentPage}
                    totalPages={paginatedTools.totalPages}
                    onPageChange={handlePageChange}
                />
            </section>
        </div>
    );
}

export default CategoryDetailPage;
