// src/components/cookies/CookieBanner.js
import React, { useState, useEffect } from 'react';
import CookiePreferences from './CookiePreferences';
import { getConsent, saveConsent } from './cookiesConfig';
import { initAnalytics } from '../../utils/analytics';
import './CookieBanner.css';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const newConsent = {
      necessary: true,
      preferences: true,
      statistics: true,
      marketing: true,
    };
    saveConsent(newConsent);
    if (newConsent.statistics) {
      initAnalytics();
    }
    setShowBanner(false);
  };

  const handleConfigure = () => {
    setShowPreferences(true);
    setShowBanner(false);
  };

  const handlePreferencesSave = (newConsent) => {
    saveConsent(newConsent);
    if (newConsent.statistics) {
      initAnalytics();
    }
    setShowPreferences(false);
    setShowBanner(false);
  };

  const handlePreferencesCancel = () => {
    setShowPreferences(false);
    setShowBanner(true); // vuelve a mostrar el banner inicial
  };

  return (
    <>
      {showBanner && !showPreferences && (
        <div className="cookie-banner">
          <p>
            We use cookies to enhance your experience. You can accept all or configure your preferences.
          </p>
          <div className="cookie-buttons">
            <button className="accept" onClick={handleAcceptAll}>Accept All</button>
            <button className="configure" onClick={handleConfigure}>Configure</button>
          </div>
        </div>
      )}

      {showPreferences && (
        <CookiePreferences
          onSave={handlePreferencesSave}
          onCancel={handlePreferencesCancel}
        />
      )}
    </>
  );
};

export default CookieBanner;