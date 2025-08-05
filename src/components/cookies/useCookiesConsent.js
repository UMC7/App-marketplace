// src/components/cookies/useCookiesConsent.js
import { useState, useEffect } from 'react';
import { getConsent } from './cookiesConfig';

export const useCookiesConsent = () => {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    const storedConsent = getConsent();
    setConsent(storedConsent);
  }, []);

  // Función para verificar si una categoría está aceptada
  const hasConsent = (category) => {
    if (!consent) return false;
    return consent[category] === true;
  };

  return { consent, hasConsent };
};