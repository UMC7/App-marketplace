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

  return (
    <>
      {showBanner && !showPreferences && (
        <div className="cookie-banner">
          <p>
            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
          </p>
          <div className="cookie-buttons">
            <button className="accept" onClick={handleAcceptAll}>Accept All</button>
            <button className="configure" onClick={handleConfigure}>Configure</button>
          </div>
        </div>
      )}

      {showPreferences && (
        <CookiePreferences
          onClose={() => setShowPreferences(false)}
          onShowBanner={() => setShowBanner(true)}
        />
      )}
    </>
  );
};

export default CookieBanner;