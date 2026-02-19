import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cachedPromptService from '../services/cachedPromptService';
import promptService from '../services/promptService'; // For write operations (voting)
import SEO from './SEO';
import {
  getPromptTypeIcon,
  getPromptTypeColor,
  getPromptTypeLabel,
  getDifficultyIcon,
  getDifficultyColor,
  getDifficultyLabel,
  formatViews,
  formatScore,
  copyToClipboard,
  generateSlug
} from '../utils/promptConstants';
import '../styles/PromptsLibrary.css';

function PromptDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(null);
  const [relatedPrompts, setRelatedPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userVote, setUserVote] = useState(null); // 'up', 'down', or null
  const [imageViewer, setImageViewer] = useState(null); // For fullscreen image viewing

  useEffect(() => {
    loadPrompt();
  }, [slug]);

  const loadPrompt = async () => {
    setLoading(true);
    try {
      const data = await cachedPromptService.getPromptBySlug(slug);
      setPrompt(data);
      
      // Load related prompts by category, tool_id, and tool name
      loadRelatedPrompts(data.category_id, data.tool_id, data.tool_name, data.id);
    } catch (error) {
      console.error('Error loading prompt:', error);
      alert('Prompt not found');
      navigate('/prompts');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedPrompts = async (categoryId, toolId, toolName, currentId) => {
    try {
      const relatedPromptsList = [];
      
      // Load prompts by category
      if (categoryId) {
        const categoryData = await cachedPromptService.getPrompts({
          category_id: categoryId,
          limit: 6
        });
        const categoryPrompts = (categoryData.prompts || categoryData).filter(p => p.id !== parseInt(currentId));
        relatedPromptsList.push(...categoryPrompts);
      }
      
      // Load prompts by tool_id
      if (toolId) {
        const toolData = await cachedPromptService.getPrompts({
          tool_id: toolId,
          limit: 6
        });
        const toolPrompts = (toolData.prompts || toolData).filter(p => p.id !== parseInt(currentId));
        relatedPromptsList.push(...toolPrompts);
      }
      
      // Load prompts by tool name (if tool_id didn't work)
      if (toolName && !toolId) {
        const toolNameData = await cachedPromptService.getPrompts({
          tool_id: toolName,
          limit: 6
        });
        const toolNamePrompts = (toolNameData.prompts || toolNameData).filter(p => p.id !== parseInt(currentId));
        relatedPromptsList.push(...toolNamePrompts);
      }
      
      // Remove duplicates and limit to 6 related prompts
      const uniquePrompts = relatedPromptsList.reduce((acc, prompt) => {
        if (!acc.find(p => p.id === prompt.id)) {
          acc.push(prompt);
        }
        return acc;
      }, []);
      
      setRelatedPrompts(uniquePrompts.slice(0, 6));
    } catch (error) {
      console.error('Error loading related prompts:', error);
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(prompt.prompt_text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpvote = async () => {
    try {
      // TODO: Get user ID from auth context
      const userId = 1; // Placeholder
      await promptService.upvotePrompt(prompt.id, userId);
      setUserVote('up');
      // Reload prompt to get updated counts
      loadPrompt();
    } catch (error) {
      console.error('Error upvoting:', error);
      alert('Please login to vote on prompts');
    }
  };

  const handleDownvote = async () => {
    try {
      // TODO: Get user ID from auth context
      const userId = 1; // Placeholder
      await promptService.downvotePrompt(prompt.id, userId);
      setUserVote('down');
      // Reload prompt to get updated counts
      loadPrompt();
    } catch (error) {
      console.error('Error downvoting:', error);
      alert('Please login to vote on prompts');
    }
  };

  const handleSave = () => {
    // TODO: Implement save to collection
    alert('Please login to save prompts to your collection');
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.share({
        title: prompt.title,
        text: prompt.description,
        url: url
      });
    } catch (error) {
      // Fallback to copying URL
      await copyToClipboard(url);
      alert('Link copied to clipboard!');
    }
  };

  // Format prompt text for better display
  const formatPromptText = (text) => {
    if (!text) return '';
    
    // Escape HTML first
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Format --parameters (bold)
    formatted = formatted.replace(/(--\w+)/g, '<span class="prompt-parameter">$1</span>');
    
    // Format numbers (light gray)
    formatted = formatted.replace(/\b(\d+)\b/g, '<span class="prompt-number">$1</span>');
    
    // Format URLs
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="prompt-link">$1</a>');
    
    // Format common keywords (--ar, --style, --v, etc.)
    formatted = formatted.replace(/(--ar|--style|--v|--aspect|--ratio|--quality|--seed)/gi, '<span class="prompt-keyword">$1</span>');
    
    // Preserve line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };

  if (loading) {
    return (
      <div className="prompt-detail">
        <div className="prompts-loading" style={{ minHeight: '60vh' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading prompt...</p>
        </div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="prompt-detail">
        <div className="prompts-empty" style={{ minHeight: '60vh' }}>
          <h3>Prompt not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/prompts')}>
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  const typeColor = getPromptTypeColor(prompt.prompt_type);
  const difficultyColor = getDifficultyColor(prompt.difficulty);

  return (
    <div className="prompt-detail">
      <SEO 
        title={`${prompt.title} - ${getPromptTypeLabel(prompt.prompt_type)} AI Prompt | Clarifyall`}
        description={prompt.description || `${prompt.title} - ${getPromptTypeLabel(prompt.prompt_type)} AI prompt. ${getDifficultyLabel(prompt.difficulty)} difficulty. ${prompt.prompt_text.substring(0, 120)}...`}
        keywords={`AI prompt, ${prompt.prompt_type}, ${prompt.difficulty}, ${prompt.tags?.join(', ') || ''}`}
        dynamicKeywords={{
          title: prompt.title,
          type: prompt.prompt_type,
          difficulty: prompt.difficulty,
          tags: prompt.tags
        }}
        ogTitle={`${prompt.title} - Free AI Prompt`}
        ogDescription={prompt.description || prompt.prompt_text.substring(0, 160)}
        ogImage={prompt.example_image_url}
        canonicalUrl={`/prompt/${prompt.id}`}
        schemaType="website"
      />
      

      {/* Back Button */}
      <button 
        className="btn btn-secondary"
        onClick={() => navigate('/prompts')}
        style={{ marginBottom: '1rem' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
          <path d="M15 19l-7-7 7-7" />
        </svg>
        Back to Library
      </button>

      {/* Header */}
      <div className="prompt-detail-header">
        <h1 className="prompt-detail-title">{prompt.title}</h1>
        
        <div className="prompt-detail-meta">
          <span 
            className="prompt-type-badge" 
            style={{ backgroundColor: typeColor + '20', color: typeColor }}
          >
            {getPromptTypeIcon(prompt.prompt_type)} {getPromptTypeLabel(prompt.prompt_type)}
          </span>
          
          <span 
            className="prompt-difficulty-badge"
            style={{ backgroundColor: difficultyColor + '20', color: difficultyColor }}
          >
            {getDifficultyIcon(prompt.difficulty)} {getDifficultyLabel(prompt.difficulty)}
          </span>

          {prompt.category_name && (
            <span className="prompt-type-badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              🏷️ {prompt.category_name}
            </span>
          )}

          {prompt.tool_name && (
            <span className="prompt-type-badge" style={{ backgroundColor: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
              🛠️ {prompt.tool_name}
            </span>
          )}
        </div>

        {prompt.description && (
          <p className="prompt-detail-description">{prompt.description}</p>
        )}

        {/* Stats and Actions */}
        <div className="prompt-detail-header-footer">
          <div className="prompt-stats">
            <div className="prompt-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{formatViews(prompt.views || 0)} views</span>
            </div>
            
            <div className="prompt-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span>{formatScore(prompt.upvotes || 0, prompt.downvotes || 0)} score</span>
            </div>
          </div>

          <div className="prompt-detail-actions">
            <button 
              className={`prompt-action-icon-btn upvote ${userVote === 'up' ? 'active' : ''}`}
              onClick={handleUpvote}
              title={`Upvote (${prompt.upvotes || 0})`}
            >
              <svg viewBox="0 0 24 24" fill={userVote === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                <path d="M5 15l7-7 7 7" />
              </svg>
              <span className="action-count">{prompt.upvotes || 0}</span>
            </button>
            
            <button 
              className={`prompt-action-icon-btn downvote ${userVote === 'down' ? 'active' : ''}`}
              onClick={handleDownvote}
              title={`Downvote (${prompt.downvotes || 0})`}
            >
              <svg viewBox="0 0 24 24" fill={userVote === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                <path d="M19 9l-7 7-7-7" />
              </svg>
              <span className="action-count">{prompt.downvotes || 0}</span>
            </button>

            <button 
              className="prompt-action-icon-btn save"
              onClick={handleSave}
              title="Save to collection"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>

            <button 
              className="prompt-action-icon-btn share"
              onClick={handleShare}
              title="Share prompt"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="prompt-detail-body">
        {/* Example Image - Reduced size */}
        {prompt.example_image_url && (
          <div className="prompt-example prompt-example-featured">
            <h3>Example Output</h3>
            <div className="example-image-container-small" onClick={() => setImageViewer(prompt.example_image_url)}>
              <img 
                src={prompt.example_image_url} 
                alt={`${prompt.title} example output`}
                className="example-image-medium"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
            <p style={{ fontSize: '0.875rem', color: '#8b92b0', marginTop: '0.75rem', textAlign: 'center', fontStyle: 'italic' }}>
              ✨ Click image to view full size
            </p>
          </div>
        )}

        {/* Image Viewer Modal */}
        {imageViewer && (
          <div 
            className="image-viewer-modal"
            onClick={() => setImageViewer(null)}
          >
            <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="image-viewer-close"
                onClick={() => setImageViewer(null)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <img src={imageViewer} alt="Full size preview" />
            </div>
          </div>
        )}

        {/* Prompt Text */}
        <div className="prompt-text-section">
          <h3>Prompt Text</h3>
          <div className="prompt-text-box">
            <div className="prompt-text-content" dangerouslySetInnerHTML={{ __html: formatPromptText(prompt.prompt_text) }} />
            <button 
              className={`copy-prompt-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
                    <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Parameters */}
        {prompt.parameters && Object.keys(prompt.parameters).length > 0 && (
          <div className="prompt-parameters">
            <h3>Parameters</h3>
            <div className="parameters-grid">
              {Object.entries(prompt.parameters).map(([key, value]) => (
                <div key={key} className="parameter-item">
                  <div className="parameter-label">{key.replace(/_/g, ' ')}</div>
                  <div className="parameter-value">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example Video */}
        {prompt.example_video_url && (
          <div className="prompt-example">
            <h3>Example Video</h3>
            <video 
              src={prompt.example_video_url}
              controls
              className="example-video"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="prompt-text-section">
            <h3>Tags</h3>
            <div className="prompt-card-tags">
              {prompt.tags.map((tag, index) => (
                <span key={index} className="prompt-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Prompts - Moved below tags */}
        {relatedPrompts.length > 0 && (
          <div className="prompt-text-section" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Related Prompts</h3>
            <div className="prompts-grid">
              {relatedPrompts.map(relatedPrompt => (
                <div 
                  key={relatedPrompt.id}
                  className="prompt-card"
                  onClick={() => {
                    const relatedSlug = relatedPrompt.slug || generateSlug(relatedPrompt.title);
                    window.open(`/prompts/${relatedSlug}`, '_blank', 'noopener,noreferrer');
                  }}
                >
                  {relatedPrompt.example_image_url && (
                    <div className="prompt-card-image-container">
                      <img 
                        src={relatedPrompt.example_image_url} 
                        alt={relatedPrompt.title}
                        className="prompt-card-image"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                  <div className="prompt-card-header">
                    <h3 className="prompt-card-title">{relatedPrompt.title}</h3>
                    <div className="prompt-card-meta">
                      <span 
                        className="prompt-type-badge" 
                        style={{ backgroundColor: getPromptTypeColor(relatedPrompt.prompt_type) + '20', color: getPromptTypeColor(relatedPrompt.prompt_type) }}
                      >
                        {getPromptTypeIcon(relatedPrompt.prompt_type)}
                      </span>
                    </div>
                  </div>
                  <div className="prompt-card-body">
                    <div className="prompt-card-text">
                      {relatedPrompt.prompt_text.substring(0, 100)}...
                    </div>
                  </div>
                  <div className="prompt-card-footer">
                    <div className="prompt-stats">
                      <div className="prompt-stat">
                        <span>👁️ {formatViews(relatedPrompt.views || 0)}</span>
                      </div>
                      <div className="prompt-stat">
                        <span>👍 {formatScore(relatedPrompt.upvotes || 0, relatedPrompt.downvotes || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PromptDetailPage;
