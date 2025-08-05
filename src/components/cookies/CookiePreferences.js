// src/components/cookies/CookiePreferences.js
import React, { useState, useEffect } from 'react';
import { cookieCategories, getConsent } from './cookiesConfig';
import './CookieBanner.css';

const CookiePreferences = ({ onSave, onCancel }) => {
  const [preferences, setPreferences] = useState({
    necessary: true,
    preferences: true,
    statistics: true,
    marketing: true,
  });

  useEffect(() => {
    const stored = getConsent();
    if (stored) {
      setPreferences(stored);
    }
  }, []);

  const handleToggle = (category) => {
    if (category === 'necessary') return;
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSaveClick = () => {
    onSave(preferences);
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
          <button className="cancel" onClick={onCancel}>Cancel</button>
          <button className="save" onClick={handleSaveClick}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferences;