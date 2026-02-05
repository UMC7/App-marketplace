// src/components/cookies/cookiesConfig.js

// Key to store consent in localStorage
const CONSENT_KEY = 'cookieConsent';
const THEME_KEY = 'userTheme'; // 🔹 Clave para almacenar el tema

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

// 🔹 Obtener tema guardado
// Si hay preferencia guardada, la usa. Si no, usa el esquema del sistema (en app) o prefers-color-scheme.
export const getThemePreference = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && (window.__ydw_system_color_scheme === 'dark' || window.__ydw_system_color_scheme === 'light')) {
      return window.__ydw_system_color_scheme;
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch (error) {
    console.error('Error reading theme preference:', error);
    return 'light';
  }
};

// 🔹 Guardar tema seleccionado
export const saveThemePreference = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error('Error saving theme preference:', error);
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