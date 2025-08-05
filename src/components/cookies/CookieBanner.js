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
      marketing: true
    });
    setShowBanner(false);
  };

  const handleReject = () => {
    saveConsent({
      necessary: true,
      preferences: false,
      statistics: false,
      marketing: false
    });
    setShowBanner(false);
  };

  const handleConfigure = () => {
    setShowPreferences(true);
  };

  const handleClosePreferences = () => {
    setShowPreferences(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {showBanner && !showPreferences && (
        <div className="cookie-banner">
          <p>
            We use cookies to enhance your browsing experience, serve personalized ads or content, 
            and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
          </p>
          <div className="cookie-buttons">
            <button className="accept" onClick={handleAcceptAll}>Accept All</button>
            <button className="reject" onClick={handleReject}>Reject</button>
            <button className="configure" onClick={handleConfigure}>Configure</button>
          </div>
        </div>
      )}

      {showPreferences && (
        <CookiePreferences onClose={handleClosePreferences} />
      )}
    </>
  );
};

export default CookieBanner;