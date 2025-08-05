import React, { useState, useEffect } from 'react';
import { cookieCategories, getConsent, saveConsent } from './cookiesConfig';
import './CookieBanner.css';

const CookiePreferences = ({ onClose }) => {
  const [preferences, setPreferences] = useState({
    necessary: true,
    preferences: false,
    statistics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = getConsent();
    if (stored) {
      setPreferences(stored);
    }
  }, []);

  const handleToggle = (category) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSave = () => {
    saveConsent(preferences);
    onClose();
  };

  return (
    <div className="cookie-overlay">
      <div className="cookie-preferences">
        <div className="cookie-preferences-content">
          <h3>Cookie Preferences</h3>
          <ul>
            {Object.entries(cookieCategories).map(([key, info]) => (
              <li key={key}>
                <label>
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    onChange={() => handleToggle(key)}
                    disabled={key === 'necessary'}
                  />
                  <strong>{info.name}</strong> – {info.description}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="cookie-preferences-buttons">
          <button className="save" onClick={handleSave}>Save</button>
          <button className="cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferences;