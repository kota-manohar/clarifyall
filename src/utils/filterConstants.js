// Constants for Advanced Filters

export const FEATURE_TAGS = [
  { value: 'API', label: 'API Available', icon: '🔌' },
  { value: 'MOBILE_APP', label: 'Mobile App', icon: '📱' },
  { value: 'CHROME_EXT', label: 'Chrome Extension', icon: '🧩' },
  { value: 'FREE_TRIAL', label: 'Free Trial', icon: '🎁' },
  { value: 'NO_CC', label: 'No Credit Card', icon: '💳' },
  { value: 'OPEN_SOURCE', label: 'Open Source', icon: '🔓' },
  { value: 'OFFLINE', label: 'Offline Mode', icon: '📴' },
  { value: 'TEAM_COLLAB', label: 'Team Collaboration', icon: '👥' },
  { value: 'INTEGRATIONS', label: 'Integrations', icon: '🔗' },
  { value: 'CUSTOM_TRAINING', label: 'Custom Training', icon: '🎓' }
];

export const PLATFORMS = [
  { value: 'WEB', label: 'Web', icon: '🌐' },
  { value: 'DESKTOP', label: 'Desktop', icon: '💻' },
  { value: 'MOBILE', label: 'Mobile', icon: '📱' },
  { value: 'BROWSER_EXT', label: 'Browser Extension', icon: '🧩' }
];

export const SORT_OPTIONS = [
  { value: 'POPULAR', label: 'Most Popular', field: 'view_count', order: 'DESC' },
  { value: 'RECENT', label: 'Recently Added', field: 'created_at', order: 'DESC' },
  { value: 'RATING', label: 'Highest Rated', field: 'rating', order: 'DESC' },
  { value: 'NAME_ASC', label: 'Name (A-Z)', field: 'name', order: 'ASC' },
  { value: 'NAME_DESC', label: 'Name (Z-A)', field: 'name', order: 'DESC' }
];

export const SOCIAL_PLATFORMS = [
  { key: 'twitter', label: 'Twitter', icon: '𝕏', placeholder: '@username' },
  { key: 'discord', label: 'Discord', icon: '💬', placeholder: 'Invite link' },
  { key: 'github', label: 'GitHub', icon: '🐙', placeholder: 'username/repo' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'company/page' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', placeholder: 'channel' }
];
