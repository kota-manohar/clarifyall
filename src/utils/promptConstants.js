// Generate slug from title
export function generateSlug(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Prompt Types
export const PROMPT_TYPES = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  IMAGE_EDIT: 'IMAGE_EDIT',
  VIDEO_EDIT: 'VIDEO_EDIT'
};

export const PROMPT_TYPE_LABELS = {
  IMAGE: 'Image Generation',
  VIDEO: 'Video Generation',
  IMAGE_EDIT: 'Image Editing',
  VIDEO_EDIT: 'Video Editing'
};

export const PROMPT_TYPE_ICONS = {
  IMAGE: '🖼️',
  VIDEO: '🎬',
  IMAGE_EDIT: '✂️',
  VIDEO_EDIT: '🎞️'
};

export const PROMPT_TYPE_COLORS = {
  IMAGE: '#3b82f6',      // blue
  VIDEO: '#8b5cf6',      // purple
  IMAGE_EDIT: '#10b981', // green
  VIDEO_EDIT: '#f59e0b'  // amber
};

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED'
};

export const DIFFICULTY_LABELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
};

export const DIFFICULTY_ICONS = {
  BEGINNER: '⭐',
  INTERMEDIATE: '⭐⭐',
  ADVANCED: '⭐⭐⭐'
};

export const DIFFICULTY_COLORS = {
  BEGINNER: '#10b981',   // green
  INTERMEDIATE: '#f59e0b', // amber
  ADVANCED: '#ef4444'    // red
};

// Prompt Status
export const PROMPT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

export const PROMPT_STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

export const PROMPT_STATUS_COLORS = {
  PENDING: '#f59e0b',  // amber
  APPROVED: '#10b981', // green
  REJECTED: '#ef4444'  // red
};

// Sort Options
export const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'upvotes', label: 'Most Upvoted' }
];

// Popular AI Tools for Prompts
export const POPULAR_AI_TOOLS = [
  'ChatGPT',
  'Gemini',
  'Midjourney',
  'DALL-E',
  'Stable Diffusion',
  'Leonardo AI',
  'Runway',
  'Pika',
  'Sora',
  'Adobe Firefly',
  'Photoshop AI',
  'Canva AI',
  'CapCut',
  'Descript',
  'Claude',
  'Perplexity',
  'Copilot'
];

// Common Tags
export const COMMON_TAGS = [
  'portrait',
  'landscape',
  'product',
  'abstract',
  'realistic',
  'cinematic',
  'anime',
  'cartoon',
  '3d-render',
  'photography',
  'illustration',
  'logo',
  'character',
  'concept-art',
  'architecture',
  'nature',
  'food',
  'fashion',
  'marketing',
  'social-media'
];

// Aspect Ratios
export const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '16:9', label: 'Widescreen (16:9)' },
  { value: '9:16', label: 'Vertical (9:16)' },
  { value: '2:3', label: 'Portrait (2:3)' },
  { value: '3:2', label: 'Landscape (3:2)' },
  { value: '21:9', label: 'Ultrawide (21:9)' }
];

// Helper Functions
export const getPromptTypeLabel = (type) => {
  return PROMPT_TYPE_LABELS[type] || type;
};

export const getPromptTypeIcon = (type) => {
  return PROMPT_TYPE_ICONS[type] || '🎨';
};

export const getPromptTypeColor = (type) => {
  return PROMPT_TYPE_COLORS[type] || '#6b7280';
};

export const getDifficultyLabel = (difficulty) => {
  return DIFFICULTY_LABELS[difficulty] || difficulty;
};

export const getDifficultyIcon = (difficulty) => {
  return DIFFICULTY_ICONS[difficulty] || '⭐';
};

export const getDifficultyColor = (difficulty) => {
  return DIFFICULTY_COLORS[difficulty] || '#6b7280';
};

export const getStatusLabel = (status) => {
  return PROMPT_STATUS_LABELS[status] || status;
};

export const getStatusColor = (status) => {
  return PROMPT_STATUS_COLORS[status] || '#6b7280';
};

// Format prompt score
export const formatScore = (upvotes, downvotes) => {
  const score = upvotes - downvotes;
  if (score > 0) return `+${score}`;
  return score.toString();
};

// Format view count
export const formatViews = (views) => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

// Parse tags from string
export const parseTags = (tagsString) => {
  if (!tagsString) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
};

// Format tags for display
export const formatTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => tag.trim()).filter(tag => tag);
};
