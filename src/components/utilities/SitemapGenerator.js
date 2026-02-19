import React, { useState } from 'react';
import api from '../../services/api';
import SEO from '../SEO';
import '../../styles/SitemapGenerator.css';

function SitemapGenerator() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sitemapInfo, setSitemapInfo] = useState(null);

  const handleGenerateSitemap = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');
    setGenerated(false);

    try {
      const response = await api.post('/sitemap.php', {
        action: 'generate'
      });

      if (response.data && response.data.success) {
        setSuccess('Sitemaps generated successfully!');
        setSitemapUrl(response.data.sitemap_index_url || 'https://clarifyall.com/sitemap.xml');
        setSitemapInfo(response.data);
        setGenerated(true);
      } else {
        setError(response.data?.error || 'Failed to generate sitemaps');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate sitemaps');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewSitemap = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="sitemap-generator-container">
      <SEO
        title="XML Sitemap Generator | ClarifyAll Tools"
        description="Generate XML sitemaps for your website instantly. Helps search engines discover and index your content effectively."
        keywords="xml sitemap generator, sitemap creator, google sitemap, seo tools"
        canonicalUrl="/tools/sitemap-generator"
      />
      <div className="sitemap-generator-header">
        <div>
          <h1>Sitemap Generator</h1>
          <p className="text-muted">Generate XML sitemaps for all pages, tools, blog posts, and prompts</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      <div className="sitemap-generator-card">
        <div className="sitemap-info-section">
          <h3>Sitemap Overview</h3>
          <p>
            This tool generates XML sitemaps following Google's sitemap protocol and AdSense policy requirements.
            Sitemaps help search engines discover and index your content more effectively.
          </p>

          <div className="sitemap-features">
            <h4>Generated Sitemaps Include:</h4>
            <ul>
              <li>✅ Static Pages (Home, About, Categories, etc.)</li>
              <li>✅ All Approved Tools</li>
              <li>✅ Blog Posts</li>
              <li>✅ AI Prompts</li>
              <li>✅ Prompt Categories</li>
              <li>✅ Categories</li>
            </ul>
          </div>

          <div className="sitemap-notes">
            <h4>Important Notes:</h4>
            <ul>
              <li>Sitemaps are generated according to Google's XML Sitemap Protocol</li>
              <li>Only approved/published content is included</li>
              <li>Each sitemap contains up to 50,000 URLs (Google's limit)</li>
              <li>A sitemap index file references all generated sitemaps</li>
              <li>Generated files are saved in the <code>public</code> directory</li>
            </ul>
          </div>
        </div>

        <div className="sitemap-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={handleGenerateSitemap}
            disabled={generating}
          >
            {generating ? (
              <>
                <div className="spinner-sm"></div>
                Generating Sitemaps...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5l-5 5-5-5" />
                </svg>
                Generate Sitemaps
              </>
            )}
          </button>
        </div>

        {generated && sitemapInfo && (
          <div className="sitemap-results">
            <h3>Generated Sitemaps</h3>
            <div className="sitemap-urls">
              <div className="sitemap-url-item">
                <strong>Sitemap Index:</strong>
                <div className="sitemap-url-box">
                  <code>{sitemapInfo.sitemap_index_url || 'https://clarifyall.com/sitemap.xml'}</code>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleViewSitemap(sitemapInfo.sitemap_index_url || 'https://clarifyall.com/sitemap.xml')}
                  >
                    View
                  </button>
                </div>
              </div>

              {sitemapInfo.sitemaps && sitemapInfo.sitemaps.length > 0 && (
                <>
                  <div className="sitemap-url-item">
                    <strong>Individual Sitemaps:</strong>
                    <div className="sitemap-list">
                      {sitemapInfo.sitemaps.map((sitemap, index) => (
                        <div key={index} className="sitemap-url-box">
                          <code>{sitemap.url}</code>
                          <span className="sitemap-count">({sitemap.url_count} URLs)</span>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleViewSitemap(sitemap.url)}
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="sitemap-stats">
                <div className="stat-item">
                  <strong>Total URLs:</strong>
                  <span>{sitemapInfo.total_urls || 0}</span>
                </div>
                <div className="stat-item">
                  <strong>Total Sitemaps:</strong>
                  <span>{sitemapInfo.sitemap_count || 0}</span>
                </div>
                <div className="stat-item">
                  <strong>Generated:</strong>
                  <span>{new Date(sitemapInfo.generated_at || Date.now()).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="sitemap-submit-section">
              <h4>Submit to Google Search Console</h4>
              <p>
                After generating sitemaps, submit the sitemap index URL to Google Search Console:
              </p>
              <ol>
                <li>Go to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">Google Search Console</a></li>
                <li>Select your property (clarifyall.com)</li>
                <li>Navigate to "Sitemaps" in the left menu</li>
                <li>Enter the sitemap index URL: <code>{sitemapInfo.sitemap_index_url || 'https://clarifyall.com/sitemap.xml'}</code></li>
                <li>Click "Submit"</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SitemapGenerator;


