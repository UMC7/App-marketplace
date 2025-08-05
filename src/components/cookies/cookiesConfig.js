// src/components/cookies/cookiesConfig.js

// Key to store consent in localStorage
const CONSENT_KEY = 'cookieConsent';

// Get stored consent
export const getConsent = () => {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
};

// Save consent
export const saveConsent = (consent) => {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch (error) {
    console.error('Error saving cookie consent:', error);
  }
};

// Cookie categories (can be customized)
export const cookieCategories = {
  necessary: {
    name: 'Necessary',
    description: 'Required for the basic functioning of the website.',
  },
  preferences: {
    name: 'Preferences',
    description: 'Remember your choices and personalize your experience.',
  },
  statistics: {
    name: 'Statistics',
    description: 'Help us understand how visitors interact with the site.',
  },
  marketing: {
    name: 'Marketing',
    description: 'Used to display relevant advertising.',
  },
};