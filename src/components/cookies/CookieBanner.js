// src/components/cookies/CookieBanner.js
import React, { useState, useEffect } from 'react';
import CookiePreferences from './CookiePreferences';
import { getConsent, saveConsent } from './cookiesConfig';
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
    saveConsent({
      necessary: true,
      preferences: true,
      statistics: true,
      marketing: true,
    });
    setShowBanner(false);
  };

  const handleConfigure = () => {
    setShowPreferences(true);
    setShowBanner(false);
  };

  const handlePreferencesClose = (shouldShowBannerAgain) => {
    setShowPreferences(false);
    if (shouldShowBannerAgain) {
      setShowBanner(true);
    }
  };

  return (
    <>
      {showBanner && !showPreferences && (
        <div className="cookie-banner">
          <p>
            We use cookies to enhance your experience and analyze traffic. By continuing, you accept our{' '}
            <a href="/legal" target="_blank" rel="noopener noreferrer" className="cookie-link">Terms of Use</a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="cookie-link">Privacy Policy</a>.
          </p>
          <div className="cookie-buttons">
            <button className="accept" onClick={handleAcceptAll}>Accept All</button>
            <button className="configure" onClick={handleConfigure}>Configure</button>
          </div>
        </div>
      )}

      {showPreferences && (
        <CookiePreferences
          onClose={() => handlePreferencesClose(true)}      // Cancel
          onSave={() => handlePreferencesClose(false)}      // Save
        />
      )}
    </>
  );
};

export default CookieBanner;
