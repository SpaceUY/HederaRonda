// Application constants
export const APP_NAME = 'RONDA Web3';
export const APP_DESCRIPTION = 'Decentralized Rotating Savings Platform';
export const APP_VERSION = '0.1.0';

// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
export const API_TIMEOUT = 10000; // 10 seconds

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'ronda-theme',
  USER_PREFERENCES: 'ronda-user-preferences',
  WALLET_CONNECTION: 'ronda-wallet-connection',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

// Validation constants
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// UI constants
export const UI = {
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 4000,
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Financial constants (for future use)
export const FINANCIAL = {
  MIN_CONTRIBUTION: 1, // Minimum contribution amount
  MAX_PARTICIPANTS: 50, // Maximum participants in a RONDA
  DEFAULT_CURRENCY: 'USD' as const,
  DECIMAL_PLACES: 2,
} as const;