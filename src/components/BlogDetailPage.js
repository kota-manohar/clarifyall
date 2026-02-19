import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import cachedBlogService from '../services/cachedBlogService';
import { getToolById } from '../services/toolService';
import SEO from './SEO';
import '../styles/BlogPage.css';

function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [relatedTools, setRelatedTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await cachedBlogService.getArticleBySlug(slug);
      setArticle(data);
      
      // Load related articles
      if (data.category) {
        loadRelatedArticles(data.category, data.id);
      }
      
      // Load related tools
      if (data.related_tools && data.related_tools.length > 0) {
        loadRelatedTools(data.related_tools);
      }
    } catch (err) {
      setError('Article not found');
      console.error('Error loading article:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedArticles = async (category, currentId) => {
    try {
      const data = await cachedBlogService.getArticlesByCategory(category, 3);
      const filtered = (data.articles || data).filter(a => a.id !== currentId);
      setRelatedArticles(filtered.slice(0, 3));
    } catch (err) {
      console.error('Error loading related articles:', err);
    }
  };

  const loadRelatedTools = async (toolIds) => {
    try {
      const toolsPromises = toolIds.map(id => 
        getToolById(id).catch(err => {
          console.warn(`Error loading tool ${id}:`, err);
          return null;
        })
      );
      const tools = await Promise.all(toolsPromises);
      setRelatedTools(tools.filter(tool => tool !== null));
    } catch (err) {
      console.error('Error loading related tools:', err);
      setRelatedTools([]);
    }
  };

  if (loading) {
    return (
      <div className="blog-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="blog-detail-page">
        <div className="error-container">
          <h2>Article Not Found</h2>
          <p>{error || 'The article you are looking for does not exist.'}</p>
          <button onClick={() => navigate('/blog')} className="btn btn-primary">
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-detail-page">
      <SEO 
        title={`${article.title} | Clarifyall Blog`}
        description={article.meta_description || article.excerpt || `${article.title} - Read this comprehensive AI tools article. ${article.category ? `${article.category} category.` : ''} ${article.read_time ? `${article.read_time} min read.` : ''}`}
        keywords={article.meta_keywords || article.tags?.join(', ') || 'AI tools, artificial intelligence'}
        dynamicKeywords={{
          title: article.title,
          category: article.category,
          tags: article.tags
        }}
        ogTitle={article.meta_title || article.title}
        ogDescription={article.meta_description || article.excerpt}
        ogImage={article.featured_image}
        canonicalUrl={`/blog/${article.slug}`}
        schemaType="article"
        schemaData={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.excerpt,
          image: article.featured_image,
          datePublished: article.published_at || article.created_at,
          dateModified: article.updated_at || article.published_at || article.created_at,
          author: {
            '@type': 'Organization',
            name: 'Clarifyall'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Clarifyall'
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://clarifyall.com/blog/${article.slug}`
          }
        }}
      />
      
      {/* Article Header */}
      <article className="blog-article">
        <div className="blog-container">
          <div className="article-header">
            <div className="article-meta-top">
              <span className="article-category">{article.category}</span>
              <span className="article-date">
                {new Date(article.published_at || article.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="article-read-time">{article.read_time || 5} min read</span>
              <span className="article-views">👁️ {article.view_count || 0} views</span>
            </div>
            
            <h1 className="article-title-main">{article.title}</h1>
            
            {article.excerpt && (
              <p className="article-excerpt-main">{article.excerpt}</p>
            )}
            
            {article.author_name && (
              <div className="article-author-info">
                <div className="author-avatar">
                  {article.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="author-details">
                  <span className="author-name">By {article.author_name}</span>
                  {article.author_email && (
                    <span className="author-email">{article.author_email}</span>
                  )}
                </div>
              </div>
            )}

            {article.featured_image && (
              <div className="article-featured-image">
                <img src={article.featured_image} alt={article.title} />
              </div>
            )}

          </div>

          {/* Article Content */}
          <div className="article-body">
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
            
          </div>

          {/* Article Footer */}
          <div className="article-footer">
            {article.tags && article.tags.length > 0 && (
              <div className="article-tags-section">
                <h3>Tags</h3>
                <div className="article-tags">
                  {article.tags.map((tag, index) => (
                    <Link key={index} to={`/blog?search=${tag}`} className="article-tag">
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {relatedTools.length > 0 && (
              <div className="related-tools-section">
                <h3>Related Tools</h3>
                <div className="related-tools-list">
                  {relatedTools.map((tool) => (
                    <Link key={tool.id} to={`/tool/${tool.id}`} className="related-tool-link">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', marginRight: '0.5rem', flexShrink: 0 }}>
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      <span>{tool.name || `Tool #${tool.id}`}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Share Buttons */}
            <div className="article-share">
              <h3>Share this article</h3>
              <div className="share-buttons">
                <button
                  className="share-btn share-btn-icon share-btn-twitter"
                  onClick={() => {
                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`, '_blank');
                  }}
                  title="Share on Twitter"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                  </svg>
                </button>
                <button
                  className="share-btn share-btn-icon share-btn-facebook"
                  onClick={() => {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                  }}
                  title="Share on Facebook"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                </button>
                <button
                  className="share-btn share-btn-icon share-btn-linkedin"
                  onClick={() => {
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
                  }}
                  title="Share on LinkedIn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </button>
                <button
                  className="share-btn share-btn-icon share-btn-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                  title="Copy link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M8 5.00005C7.01165 5.00005 6.49359 5.00005 6.09202 5.33751C5.99058 5.42787 5.89993 5.51852 5.80957 5.61998C5.5 6.02054 5.5 6.53861 5.5 7.52696V16.4731C5.5 17.4614 5.5 17.9795 5.80957 18.38C5.89993 18.4815 5.99058 18.5721 6.09202 18.6625C6.49359 19 7.01165 19 8 19H16C16.9883 19 17.5064 19 17.908 18.6625C18.0094 18.5721 18.1 18.4815 18.1904 18.38C18.5 17.9795 18.5 17.4614 18.5 16.4731V7.52696C18.5 6.53861 18.5 6.02054 18.1904 5.61998C18.1 5.51852 18.0094 5.42787 17.908 5.33751C17.5064 5.00005 16.9883 5.00005 16 5.00005H8Z"/>
                    <path d="M8 5.00005C8 4.05719 8 3.58576 8.29289 3.29287C8.58579 3.00005 9.05722 3.00005 10 3.00005H14C14.9428 3.00005 15.4142 3.00005 15.7071 3.29287C16 3.58576 16 4.05719 16 5.00005"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="related-articles">
          <div className="blog-container">
            <h2>Related Articles</h2>
            <div className="articles-grid">
              {relatedArticles.map((relatedArticle) => (
                <Link key={relatedArticle.id} to={`/blog/${relatedArticle.slug}`} className="article-card">
                  {relatedArticle.featured_image && (
                    <div className="article-image">
                      <img src={relatedArticle.featured_image} alt={relatedArticle.title} />
                    </div>
                  )}
                  <div className="article-content">
                    <div className="article-meta">
                      <span className="article-category">{relatedArticle.category}</span>
                      <span className="article-date">
                        {new Date(relatedArticle.published_at || relatedArticle.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="article-title">{relatedArticle.title}</h3>
                    {relatedArticle.excerpt && (
                      <p className="article-excerpt">{relatedArticle.excerpt.substring(0, 120)}...</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

export default BlogDetailPage;

