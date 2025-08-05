// src/utils/analytics.js
import { getConsent } from '../components/cookies/cookiesConfig';

export function initAnalytics() {
  const consent = getConsent();

  if (consent?.statistics) {
    // Evitar cargar el script más de una vez
    if (document.getElementById('ga-script')) return;

    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-VB0VZJFD5Q';
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-VB0VZJFD5Q');
  }
}