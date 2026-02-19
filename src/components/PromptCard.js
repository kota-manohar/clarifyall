import React from 'react';
import {
  getPromptTypeIcon,
  getPromptTypeColor,
  getDifficultyIcon,
  getDifficultyColor,
  formatViews,
  formatScore,
  truncateText,
  copyToClipboard,
  generateSlug
} from '../utils/promptConstants';
import '../styles/PromptsLibrary.css';

function PromptCard({ prompt, onSave, onUpvote, onDownvote, isSaved = false }) {
  const [copied, setCopied] = React.useState(false);

  const handleCardClick = (e) => {
    // Don't navigate if clicking on action buttons or copy button
    if (e.target.closest('.prompt-action-btn') || e.target.closest('.prompt-card-copy-btn')) {
      return;
    }
    // Open in new tab using slug
    const slug = prompt.slug || generateSlug(prompt.title);
    window.open(`/prompts/${slug}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    const success = await copyToClipboard(prompt.prompt_text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (onSave) onSave(prompt.id);
  };

  const handleUpvote = (e) => {
    e.stopPropagation();
    if (onUpvote) onUpvote(prompt.id);
  };

  const handleDownvote = (e) => {
    e.stopPropagation();
    if (onDownvote) onDownvote(prompt.id);
  };

  const typeColor = getPromptTypeColor(prompt.prompt_type);
  const difficultyColor = getDifficultyColor(prompt.difficulty);

  // Get color gradient based on prompt type
  const getTypeGradient = (type) => {
    const colors = {
      'IMAGE': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      'VIDEO': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'IMAGE_EDIT': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'VIDEO_EDIT': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    };
    return colors[type] || 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)';
  };

  return (
    <div 
      className="prompt-card" 
      onClick={handleCardClick}
      style={{
        '--type-gradient': getTypeGradient(prompt.prompt_type)
      }}
    >
      {/* Image Container - Top */}
      {prompt.example_image_url && (
        <div className="prompt-card-image-container">
          <img 
            src={prompt.example_image_url} 
            alt={prompt.title}
            className="prompt-card-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="prompt-card-header">
        <h3 className="prompt-card-title">{prompt.title}</h3>
        <div className="prompt-card-meta">
          <span 
            className="prompt-type-badge" 
            style={{ backgroundColor: typeColor + '20', color: typeColor }}
          >
            {getPromptTypeIcon(prompt.prompt_type)} {prompt.prompt_type.replace('_', ' ')}
          </span>
          <span 
            className="prompt-difficulty-badge"
            style={{ backgroundColor: difficultyColor + '20', color: difficultyColor }}
          >
            {getDifficultyIcon(prompt.difficulty)} {prompt.difficulty}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="prompt-card-body">
        {prompt.description && (
          <p className="prompt-card-description">
            {truncateText(prompt.description, 80)}
          </p>
        )}
        
        <div className="prompt-card-text">
          <button 
            className="prompt-card-copy-btn" 
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy prompt"}
          >
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          {truncateText(prompt.prompt_text, 100)}
        </div>

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="prompt-card-tags">
            {prompt.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="prompt-tag">
                {tag}
              </span>
            ))}
            {prompt.tags.length > 3 && (
              <span className="prompt-tag">+{prompt.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="prompt-card-footer">
        <div className="prompt-stats">
          <div className="prompt-stat" title="Views">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{formatViews(prompt.views || 0)}</span>
          </div>
          
          <div className="prompt-stat" title="Score">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>{formatScore(prompt.upvotes || 0, prompt.downvotes || 0)}</span>
          </div>
        </div>

        <div className="prompt-actions">
          {/* Copy Button */}
          <button 
            className="prompt-action-btn" 
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy prompt"}
          >
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* Save Button */}
          {onSave && (
            <button 
              className={`prompt-action-btn ${isSaved ? 'active' : ''}`}
              onClick={handleSave}
              title={isSaved ? "Saved" : "Save to collection"}
            >
              <svg viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}

          {/* Upvote Button */}
          {onUpvote && (
            <button 
              className="prompt-action-btn"
              onClick={handleUpvote}
              title="Upvote"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}

          {/* Downvote Button */}
          {onDownvote && (
            <button 
              className="prompt-action-btn"
              onClick={handleDownvote}
              title="Downvote"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PromptCard;
