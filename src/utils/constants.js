// Helper function to build upload URL for images (local assets)
export const buildUploadUrl = (path) => {
  if (!path) return '/logos/default.png';
  // If path already includes full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // For local development, return the path as is (assuming public folder structure)
  return path;
};

export const PRICING_MODELS = [
  { value: 'FREE', label: 'Free' },
  { value: 'FREEMIUM', label: 'Freemium' },
  { value: 'FREE_TRIAL', label: 'Free Trial' },
  { value: 'OPEN_SOURCE', label: 'Open Source' },
  { value: 'PAID', label: 'Paid' }
];

export const PRICING_MODEL_VALUES = {
  FREE: 'FREE',
  FREEMIUM: 'FREEMIUM',
  FREE_TRIAL: 'FREE_TRIAL',
  OPEN_SOURCE: 'OPEN_SOURCE',
  PAID: 'PAID'
};

export const PRICING_LABELS = {
  FREE: 'Free',
  FREEMIUM: 'Freemium',
  FREE_TRIAL: 'Free Trial',
  OPEN_SOURCE: 'Open Source',
  PAID: 'Paid'
};

export const PRICING_DESCRIPTIONS = {
  FREE: '100% free to use',
  FREEMIUM: 'Offers a permanent free plan with optional paid upgrades',
  FREE_TRIAL: 'Requires a credit card or has a time limit (e.g., 7 days)',
  OPEN_SOURCE: 'Open source software - source code is publicly available',
  PAID: 'No free plan or trial available'
};

// App Configuration
export const APP_NAME = 'ClarifyAll';
export const APP_DESCRIPTION = 'Discover and explore the best tools for your needs';
export const APP_VERSION = '1.0.0';
