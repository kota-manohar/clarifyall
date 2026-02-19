// API Configuration
// Using PHP API at clarifyall.com

const API_CONFIG = {
  // Development - PHP API
  development: {
    PHP_API_URL: 'https://clarifyall.com/php-api',
    BASE_DOMAIN: 'https://clarifyall.com',
    LOGOS_URL: 'https://clarifyall.com/logos'
  },
  
  // Production - PHP API
  production: {
    PHP_API_URL: 'https://clarifyall.com/php-api',
    BASE_DOMAIN: 'https://clarifyall.com',
    LOGOS_URL: 'https://clarifyall.com/logos'
  }
};

// Automatically detect environment
const ENV = process.env.NODE_ENV || 'development';

// Export the current environment configuration
export const PHP_API_URL = API_CONFIG[ENV].PHP_API_URL;
export const BASE_DOMAIN = API_CONFIG[ENV].BASE_DOMAIN;
export const LOGOS_URL = API_CONFIG[ENV].LOGOS_URL;

// Helper function to build full API endpoint
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${PHP_API_URL}/${cleanEndpoint}`;
};

// Helper function to get full logo URL
export const getLogoUrl = (logoPath) => {
  if (!logoPath) return null;
  
  // If it's already a full URL, return as is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  
  // If it's a data URL, return as is
  if (logoPath.startsWith('data:')) {
    return logoPath;
  }
  
  // If it starts with /logos/, convert to full URL
  if (logoPath.startsWith('/logos/')) {
    return `${LOGOS_URL}${logoPath.substring(6)}`; // Remove /logos/ and add full URL
  }
  
  // If it's just a filename, assume it's in logos directory
  if (!logoPath.startsWith('/')) {
    return `${LOGOS_URL}/${logoPath}`;
  }
  
  // Default: prepend base domain
  return `${BASE_DOMAIN}${logoPath}`;
};

export default {
  PHP_API_URL,
  BASE_DOMAIN,
  LOGOS_URL,
  buildApiUrl,
  getLogoUrl
