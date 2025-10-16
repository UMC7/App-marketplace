// src/pages/cv/sections/lifestylehabits/PublicLifestyleHabitsSection.jsx
import React, { useMemo } from 'react';
import './PublicLifestyleHabitsSection.css';

/* =========================
   ICONOS (SVG inline, OUTLINE)
========================= */

/** Smoking (cigarette-pack) */
const IconSmokingPack = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 82.29 122.88"
    className="ppv-lh-svg-big"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M64,9.26H77.4a4.87,4.87,0,0,1,3.46,1.43,4.93,4.93,0,0,1,1.43,3.47V118a5,5,0,0,1-4.93,4.93H4.93A5,5,0,0,1,0,118V14.16A4.93,4.93,0,0,1,4.93,9.24H50.5V5.78A5.8,5.8,0,0,1,56.28,0h1.91A5.8,5.8,0,0,1,64,5.78V9.26ZM41.14,75.62A14.27,14.27,0,1,1,26.87,89.89,14.27,14.27,0,0,1,41.14,75.62Zm0-6.71a21,21,0,1,1-14.83,6.14,20.94,20.94,0,0,1,14.83-6.14ZM54,77a18.19,18.19,0,1,0,5.33,12.87A18.15,18.15,0,0,0,54,77ZM64,35.67a10.45,10.45,0,0,1,1-.44,8.92,8.92,0,0,1,3.37-.66,9.2,9.2,0,0,1,2.28.3,7.68,7.68,0,0,1,1,.31l.79-3.25V19a3.34,3.34,0,0,0-.93-2.3,3,3,0,0,0-2.15-.94h-1.9a3.14,3.14,0,0,0-3.12,3.12,1.36,1.36,0,0,1-.26.79v16Zm6.93,2.12a6.84,6.84,0,0,0-1-.35,6.4,6.4,0,0,0-1.61-.2,6.32,6.32,0,0,0-2.39.46A6.91,6.91,0,0,0,64,38.88v6.88h5l2-8ZM64,14.17a5.74,5.74,0,0,1,3.38-1.1h1.9a5.64,5.64,0,0,1,4.06,1.76A6,6,0,0,1,75,19v5.66h4.72V14.16a2.31,2.31,0,0,0-2.32-2.34H64v2.35ZM75,31.78v.08a1.34,1.34,0,0,1-.18.67l-3.6,14.72A1.27,1.27,0,0,1,70,48.33H19.76a1.44,1.44,0,0,1-.37.05,1.42,1.42,0,0,1-.36-.05H13.76a1.3,1.3,0,0,1-1.24-.94L6.91,27.2H2.57V57.11H79.72V27.2h-3.6L75,31.78ZM50.5,38.69a6.75,6.75,0,0,0-1.7-1,6.44,6.44,0,0,0-4.78,0,6.87,6.87,0,0,0-1.68,1v7.09H50.5V38.69Zm-8.16-3.15c.23-.11.46-.22.7-.31a8.93,8.93,0,0,1,6.74,0,7.55,7.55,0,0,1,.72.32V19.1a1,1,0,0,1,0-.24,3.14,3.14,0,0,0-3.12-3.12h-1.9a3.14,3.14,0,0,0-3.12,3.12V35.54ZM41,15.17a4.48,4.48,0,0,1,.36-.4,5.82,5.82,0,0,1,4.09-1.7h1.9A5.74,5.74,0,0,1,50.5,14V11.8H4.93a2.36,2.36,0,0,0-1.67.7,2.33,2.33,0,0,0-.69,1.66V24.64H7.26V18.86A5.79,5.79,0,0,1,13,13.07h1.9A5.8,5.8,0,0,1,19,14.77a4.48,4.48,0,0,1,.36.4c.12-.14.24-.27.37-.4a5.82,5.82,0,0,1,4.09-1.7h1.9a5.82,5.82,0,0,1,4.09,1.7l.36.4.36-.4a5.82,5.82,0,0,1,4.09-1.7h1.91a5.79,5.79,0,0,1,4.08,1.7c.13.13.25.26.37.4ZM31.53,35.54c.23-.11.47-.22.71-.31a8.91,8.91,0,0,1,6.73,0c.24.09.47.2.7.31V18.86a3.12,3.12,0,0,0-3.11-3.12H34.65a3.14,3.14,0,0,0-3.12,3.12V35.54Zm8.14,3.13a6.87,6.87,0,0,0-1.68-1,6.41,6.41,0,0,0-4.77,0,6.93,6.93,0,0,0-1.69,1v7.09h8.14V38.67Zm-10.8,0a7.06,7.06,0,0,0-1.68-1,6.44,6.44,0,0,0-4.78,0,6.87,6.87,0,0,0-1.68,1v7.09h8.14V38.67Zm-8.14-3.13c.23-.11.46-.22.7-.31a8.91,8.91,0,0,1,6.73,0c.24.09.48.2.71.31V18.86a3.14,3.14,0,0,0-3.12-3.12h-1.9a3.11,3.11,0,0,0-2.2.91h0a3.07,3.07,0,0,0-.92,2.2V35.54Zm-9-.67.56-.13a8.92,8.92,0,0,1,5.1.49c.24.09.47.2.7.31V18.86a3.14,3.14,0,0,0-3.12-3.12H13a3.14,3.14,0,0,0-3.12,3.12V27.8a1.21,1.21,0,0,1-.07.43l1.85,6.64Zm6.36,3.81a6.48,6.48,0,0,0-1.68-1A6.32,6.32,0,0,0,14,37.24a6.08,6.08,0,0,0-1.22.12h0l-.35.08,2.32,8.32h3.33V38.68ZM53.17,22.46l.7-.31a9,9,0,0,1,6.73,0c.24.1.48.2.7.31V5.78a3.11,3.11,0,0,0-3.11-3.11H56.28a3.11,3.11,0,0,0-3.11,3.11V22.46ZM61.3,25.6a6.51,6.51,0,0,0-6.45-1,6.6,6.6,0,0,0-1.68,1V45.76H61.3V25.6ZM2.57,59.68V118a2.36,2.36,0,0,0,2.36,2.36H77.36A2.36,2.36,0,0,0,79.72,118V59.68Z"/>
  </svg>
);

/** Vaping (e-cigarette) */
const IconVapeECig = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 122.88 71.21"
    className="ppv-lh-svg-big"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M83.76,50h20.55c1.2,1.85,3.78,3.12,6.76,3.12s5.57-1.27,6.76-3.12h5V69.13h-5.22a9,9,0,0,0-13.17,0H83.76V50ZM3.87,43.4c0-1.11,0-2.11.1-3s.16-1.67.28-2.35c.9-5,5-5.47,9-6,4.74-.58,9.33-1.14,10.93-7.18a11,11,0,0,0-1.57-8.59h0a19.5,19.5,0,0,0-7-6.55l-1.64,4.05A15.62,15.62,0,0,1,19.52,19h0a6,6,0,0,1,1,4.59c-.85,3.21-4.22,3.63-7.7,4.05C7.52,28.25,2,28.93.55,37.11A28.13,28.13,0,0,0,.19,40c-.07,1-.11,2.17-.11,3.4ZM14,45.28c.37-6.35,7.72-6.2,14.85-6.06,8.58.17,16.9.34,17.34-9,.23-5.06-3.69-8-7.73-11-3-2.21-6.07-4.48-6.52-7.25-.13-.8.75-2.47,2.21-4.16a11.32,11.32,0,0,1,5.22-3.53L38.39,0a15.18,15.18,0,0,0-7.13,4.76c-2.33,2.69-3.63,6-3.28,8.11.75,4.65,4.56,7.46,8.26,10.2,3.07,2.27,6,4.46,5.92,7-.23,4.94-6.65,4.82-13.27,4.68-9-.18-18.3-.36-18.91,10.28l4,.28ZM62.71,55.59a4,4,0,1,1-4,4,4,4,0,0,1,4-4ZM8.77,47.94h5.61V71.21H8.77V47.94ZM0,47.94H5.61V71.21H0V47.94Zm16.83,0H76.88V49.7h5.19V69.44H76.88v1.77h-60V47.94Zm45.88,5A6.67,6.67,0,1,1,56,59.57a6.67,6.67,0,0,1,6.67-6.66Zm24.64.25h14.79V66H87.35V53.16Z"/>
  </svg>
);

/** Alcohol (cocktail/drink glass) */
const IconAlcoholCocktail = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 117 122.88"
    className="ppv-lh-svg-big"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M94.8,15.36c-1.18-0.34-1.86-1.56-1.53-2.74c0.34-1.18,1.56-1.86,2.74-1.53c3.15,0.9,5.79,2.39,7.82,4.59 c2.03,2.22,3.39,5.1,3.94,8.79c0.18,1.21-0.66,2.34-1.88,2.52c-1.21,0.18-2.34-0.66-2.52-1.88c-0.41-2.76-1.38-4.87-2.81-6.43 C99.13,17.12,97.17,16.04,94.8,15.36L94.8,15.36z M37.87,67.17L0.61,28.09c-0.84-0.89-0.81-2.29,0.08-3.13 c0.43-0.41,0.98-0.61,1.53-0.61v-0.01h14.53L2.27,9.86c-0.87-0.87-0.87-2.27,0-3.14c0.87-0.87,2.27-0.87,3.14,0l17.62,17.62h42.2 c0.46-6.48,3.24-12.31,7.52-16.64C77.44,2.94,83.92,0,91.08,0c7.16,0,13.64,2.94,18.34,7.7C114.1,12.45,117,19,117,26.23 c0,7.23-2.9,13.78-7.58,18.53c-4.7,4.76-11.18,7.7-18.34,7.7c-3.19,0-6.25-0.59-9.09-1.66c-2.33-0.88-4.51-2.1-6.48-3.6L56,67.18 v38.38l14.94,13.45c0.91,0.82,0.98,2.22,0.16,3.13c-0.44,0.49-1.04,0.73-1.65,0.73v0H24.77c-1.23,0-2.22-0.99-2.22-2.22 c0-0.7,0.32-1.32,0.82-1.73l14.5-13.36V67.17L37.87,67.17z M69.68,24.34h22.88c1.23,0,2.22,0.99,2.22,2.22 c0,0.66-0.29,1.26-0.75,1.67L78.64,44c1.5,1.08,3.15,1.98,4.92,2.65c2.33,0.88,4.87,1.37,7.52,1.37c5.93,0,11.3-2.43,15.18-6.36 c3.89-3.94,6.3-9.39,6.3-15.42c0-6.03-2.41-11.48-6.3-15.42c-3.88-3.93-9.25-6.36-15.18-6.36c-5.93,0-11.3,2.43-15.18,6.36 C72.42,14.33,70.13,19.06,69.68,24.34L69.68,24.34z M7.4,28.78l6.82,7.15c0.14-0.03,0.29-0.05,0.45-0.05h64.77 c0.28,0,0.54,0.05,0.79,0.14l7.08-7.25H7.4L7.4,28.78z M18.41,40.33l23.18,24.31c0.45,0.41,0.73,0.99,0.73,1.65v40.26h0 c0,0.6-0.24,1.2-0.72,1.63l-11.14,10.26h33.22l-11.29-10.16c-0.5-0.41-0.83-1.03-0.83-1.73V66.28h0.01c0-0.56,0.21-1.11,0.63-1.55 l23.83-24.41H18.41L18.41,40.33z"/>
  </svg>
);

/** Fitness (girl exercise/workout pose) */
const IconFitnessPose = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 65.61 122.88"
    className="ppv-lh-svg-big"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M44.3,19.33l-4.91,3.27l0.72,6.17c0.18-0.4,0.38-0.77,0.61-1.13c1.06-1.65,2.65-2.83,4.72-3.58 c0.06-0.02,0.12-0.04,0.19-0.05l0,0l8.36-1.21c1.36-0.2,1.6-0.24,1.58-0.43c-0.03-0.2-0.08-0.46-0.15-0.77 c-0.06-0.27-0.12-0.57-0.19-0.92c-0.33,0.08-0.65,0.15-0.98,0.2c-0.68,0.11-1.34,0.15-2,0.12c-0.71-0.03-1.4-0.14-2.09-0.32 c-0.64-0.17-1.27-0.4-1.89-0.7L44.3,19.33L44.3,19.33z M16.92,87.34l-8.09,1.17l4.69,32.4l2.59-0.37l3.17-5.27 c0.03-0.05,0.05-0.09,0.09-0.13c1.27-1.58,2.03-2.93,2.14-3.99c0.08-0.82-0.34-1.48-1.39-1.95c-0.07-0.03-0.14-0.07-0.21-0.12 l-1.7-1.27l0,0c-0.2-0.15-0.34-0.38-0.37-0.65C17.15,100.14,16.95,93.91,16.92,87.34L16.92,87.34z M1.95,40.92l13.93-2.02 c0.01-0.17,0.07-0.33,0.18-0.48c1.7-2.31,3.59-4.4,5.68-6.27c2.09-1.86,4.39-3.5,6.91-4.91l0,0c0.14-0.08,0.3-0.12,0.47-0.12 c0.51,0.01,0.92,0.43,0.91,0.94l-0.23,10.27l1.93-0.28l0,0c0.03-0.01,0.05-0.01,0.08-0.01l7.39-1.07L37.53,22.7 c-0.02-0.04-0.03-0.09-0.04-0.13c-0.23-0.88-0.82-1.6-1.58-2.07c-0.49-0.31-1.04-0.51-1.61-0.61c-0.57-0.09-1.16-0.08-1.72,0.07 l0,0l0,0c-0.84,0.22-1.62,0.74-2.18,1.6c-0.03,0.05-0.06,0.1-0.1,0.14c-0.32,0.4-0.91,0.46-1.3,0.14c-1.5-1.22-2.66-2.63-3.5-4.23 c-0.76-1.47-1.25-3.09-1.47-4.85l-5.17-0.93c-1.88-0.04-3.44,0.35-4.67,1.19c-1.24,0.85-2.18,2.18-2.8,4l0,0 c-0.01,0.02-0.02,0.05-0.03,0.07l-3.74,8.5l0,0l-0.01,0.01c-0.7,1.53-1.5,2.94-2.3,4.34C3.33,33.44,1.42,36.79,1.95,40.92 L1.95,40.92z M44.12,17.43c2.41-1.76,5.56-3.99,5.87-3.7c2.69,2.5,5.99-2.16,3.94-4.74l4.11-2.9C57.73,5.69,57.3,5.32,56.73,5 c-0.67-0.37-1.53-0.68-2.64-0.89l0,0c-0.11-0.02-0.23-0.07-0.33-0.13l-2.53-1.64c-0.13-0.07-0.24-0.17-0.32-0.3 c-0.02,0.01-0.04,0.02-0.07,0.03c-0.09,0.04-0.17,0.08-0.26,0.14l0,0c-0.06,0.04-0.12,0.06-0.18,0.09 c-2.39,0.83-3.78,0.25-4.75-0.15c-0.39-0.16-0.56-0.23-1.06,1.4l-1.1,3.58l0,0c-0.01,0.03-0.02,0.06-0.03,0.09 c-0.17,0.39-0.43,0.74-0.79,1.04c-0.32,0.26-0.71,0.49-1.18,0.67l-7.19,3.61c-0.02,0.01-0.04,0.02-0.06,0.03 c-1.42,0.74-2.96,1.08-4.58,1.1c-1.18,0.01-2.41-0.15-3.67-0.45c0.22,1.27,0.61,2.45,1.18,3.53c0.58,1.11,1.34,2.12,2.3,3.02 c0.76-0.83,1.68-1.35,2.66-1.61l0,0c0.82-0.21,1.67-0.24,2.49-0.11c0.82,0.13,1.61,0.43,2.3,0.87c0.75,0.47,1.39,1.11,1.85,1.88 l4.83-3.22l0,0C43.73,17.48,43.92,17.43,44.12,17.43L44.12,17.43z M39.4,38.78l-6.48,0.94l5.23,28.96l12.12,1.54l-0.02-0.12 c-0.67-4.87-0.76-5.49-7.05-5.76c-0.47,0.01-0.88-0.34-0.93-0.82L39.4,38.78L39.4,38.78z M40.79,34.7l3.23,27.84 c7.1,0.35,7.23,1.3,8.07,7.32c0.05,0.37,0.1,0.76,0.19,1.31c0.07,0.51-0.28,0.98-0.79,1.05c-0.11,0.02-0.21,0.01-0.31-0.01 l-13.93-1.77c-0.42-0.05-0.74-0.38-0.8-0.78L31.1,40.03l-2.12,0.31c-0.51,0.07-0.98-0.28-1.05-0.79c-0.01-0.07-0.01-0.14-0.01-0.21 l0.22-9.64c-1.85,1.14-3.57,2.42-5.17,3.85c-1.8,1.6-3.44,3.37-4.92,5.31c6.5,6.16,4.9,11.7,2.95,18.43 c-1,3.46-2.09,7.25-2.12,11.59c-0.01,2.66-0.04,5.17-0.06,7.58c-0.1,10.88-0.18,19.64,0.82,30.1l1.29,0.96 c1.84,0.85,2.57,2.14,2.41,3.79c-0.14,1.43-1.03,3.1-2.5,4.93l-3.38,5.62c-0.15,0.25-0.4,0.4-0.66,0.44v0l-3.94,0.57 c-0.51,0.07-0.98-0.28-1.05-0.79L6.98,88.6L0.18,41.67l0-0.01c-0.83-4.97,1.3-8.71,3.53-12.62c0.78-1.36,1.56-2.74,2.22-4.18l0,0 l3.72-8.46c0.76-2.2,1.93-3.83,3.5-4.91c1.57-1.08,3.52-1.58,5.83-1.51c0.06,0,0.11,0.01,0.17,0.02l5.99,1.08 c0.04,0.01,0.07,0.02,0.11,0.03l0,0c1.54,0.48,3.01,0.74,4.39,0.73c1.33-0.02,2.58-0.29,3.74-0.9c0.03-0.01,0.06-0.03,0.08-0.04 l7.24-3.64c0.03-0.02,0.06-0.03,0.09-0.04l0,0c0.29-0.11,0.52-0.24,0.69-0.37c0.12-0.1,0.2-0.2,0.26-0.31L42.82,3 c1.1-3.56,1.86-3.25,3.54-2.56c0.69,0.28,1.68,0.69,3.35,0.14c0.14-0.08,0.27-0.15,0.39-0.2c0.03-0.01,0.06-0.02,0.09-0.03 c0.48-0.2,0.89-0.22,1.24-0.14c0.44,0.1,0.74,0.35,0.95,0.67l2.24,1.45c1.23,0.25,2.22,0.61,3.02,1.06c0.88,0.49,1.52,1.09,2,1.76 l0,0l0,0c1.18,1.68,1.95,3.51,2.19,5.43c0.21,1.66,0.01,3.38-0.65,5.12l3.22,5.12l0,0l0,0c0.97,1.56,1.37,3.26,1.15,4.88 c-0.21,1.59-1,3.09-2.39,4.3c-2.12,1.84-4.07,2.1-6.45,2.41c-0.29,0.04-0.59,0.08-1.05,0.14L40.79,34.7L40.79,34.7z"/>
  </svg>
);

/* =========================
   Meter (barras + icono)
========================= */
function Meter({ label, value, options = [], icon, iconColor }) {
  const idx = useMemo(() => {
    const v = (value || '').toString().trim();
    const i = options.findIndex((o) => o.toLowerCase() === v.toLowerCase());
    return i >= 0 ? i : -1;
  }, [value, options]);

  return (
    <div className="ppv-lh-meter">
      <div className="ppv-lh-head">{label}</div>

      <div className="ppv-lh-row">
        <div className="ppv-lh-barsV" aria-hidden="true">
          <span className={`vbar vbar-1 ${idx >= 1 ? 'active' : ''}`} />
          <span className={`vbar vbar-2 ${idx >= 2 ? 'active' : ''}`} />
          <span className={`vbar vbar-3 ${idx >= 3 ? 'active' : ''}`} />
        </div>

        {/* Color aplicado sólo al icono */}
        <div className="ppv-lh-iconBig" style={{ color: iconColor }}>
          {icon}
        </div>
      </div>

      <div className="ppv-lh-value">{value || '—'}</div>
    </div>
  );
}

/* ====== badge “tipo BasicDocsSummary” ====== */
const OK_COLOR = '#16c5c1';
const BAD_COLOR = '#ef4444';

function StatusBadge({ ok }) {
  const fill = ok ? OK_COLOR : BAD_COLOR;
  const icon = ok ? (
    <path d="M9.5 13.2 6.7 10.4a1 1 0 0 0-1.4 1.4l3.2 3.2a1 1 0 0 0 1.4 0l6.7-6.7a1 1 0 1 0-1.4-1.4L9.5 13.2z" fill="#fff"/>
  ) : (
    <path d="M8.6 8.6a1 1 0 0 0-1.4 1.4L9.6 12l-2.4 2.4a1 1 0 1 0 1.4 1.4L11 13.4l2.4 2.4a1 1 0 0 0 1.4-1.4L12.4 12l2.4-2.4a1 1 0 1 0-1.4-1.4L11 10.6 8.6 8.6z" fill="#fff"/>
  );
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: 32,
        height: 32,
        borderRadius: 10,
        background: 'rgba(22,197,193,.18)',
        flex: '0 0 auto',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" role="img" aria-label={ok ? 'ok' : 'not ok'}>
        <circle cx="11" cy="11" r="10" fill={fill}/>
        {icon}
      </svg>
    </span>
  );
}

function SmallItemCard({ label, ok }) {
  // card de 232 x 46 aprox como los de CERTIFICATION & DOCUMENTS
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 10px',
      background: '#fff',
      border: '1px solid rgba(0,0,0,.08)',
      borderRadius: 12,
      boxShadow: '0 1px 3px rgba(2,6,23,.06)',
      width: 232,
      height: 46,
    }}>
      <StatusBadge ok={ok}/>
      <span style={{ fontSize: 14, color: '#0b1220', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function Pill({ children }) {
  return <span className="ppv-lh-pill">{children}</span>;
}

/* =========================
   Componente principal
========================= */
export default function PublicLifestyleHabitsSection({ profile }) {
  // Fuente: columna lifestyle_habits (o fallback a prefs_skills.lifestyleHabits)
  const lh = useMemo(() => {
    const src =
      profile?.lifestyle_habits ||
      profile?.prefs_skills?.lifestyleHabits ||
      {};
    return {
      smoking: src.smoking || '',
      vaping: src.vaping || '',
      alcohol: src.alcohol || '',
      fitness: src.fitness || '',
      tattoosVisible: src.tattoosVisible || '',          // "Yes"/"No"/""
      dietaryAllergies: Array.isArray(src.dietaryAllergies)
        ? src.dietaryAllergies
        : [],
    };
  }, [profile]);

  const ICON_COLOR = '#ff0080'; // color solicitado

  // Estado OK/NO OK para badges:
  // - Visible tattoos => "No" es NEGATIVO (ok=false), "Yes" es POSITIVO (ok=true)
  const tattoosOk = String(lh.tattoosVisible).trim().toLowerCase() === 'yes';
  // - Dietary allergies => positivo si hay respuestas (chips)
  const allergiesOk = lh.dietaryAllergies.length > 0;

  const hasTattoosAnswer = String(lh.tattoosVisible || '').trim().length > 0;

  return (
    <section className="ppv-section">
      <div className="ppv-sectionTitle">LIFESTYLE &amp; HABITS</div>

      {/* ====== 4 medidores ====== */}
      <div className="ppv-lh-grid">
        <Meter
          label="Smoking habits"
          value={lh.smoking}
          options={['Non-smoker', '< 3 cigarettes per day', '3–10 cigarettes per day', '> 10 cigarettes per day']}
          icon={<IconSmokingPack />}
          iconColor={ICON_COLOR}
        />
        <Meter
          label="Vaping"
          value={lh.vaping}
          options={['None', '< 1 puff per hour', '1–3 puffs per hour', '> 3 puffs per hour']}
          icon={<IconVapeECig />}
          iconColor={ICON_COLOR}
        />
        <Meter
          label="Alcohol consumption"
          value={lh.alcohol}
          options={['None', '≤ 1 unit per day', '≤ 3 units per day', '> 3 units per day']}
          icon={<IconAlcoholCocktail />}
          iconColor={ICON_COLOR}
        />
        <Meter
          label="Fitness / sport activity"
          value={lh.fitness}
          options={['None', '< 2 days per week', '2–4 days per week', '≥ 5 days per week']}
          icon={<IconFitnessPose />}
          iconColor={ICON_COLOR}
        />
      </div>

      {/* ====== Fila de 2 cards ====== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '232px 232px',
          justifyContent: 'center',
          gap: 22,
          marginTop: 8,
        }}
      >
        <SmallItemCard label="Visible tattoos" ok={tattoosOk} />
        <SmallItemCard label="Dietary allergies" ok={allergiesOk} />
      </div>

      {/* ====== Fila de respuestas (debajo de cada card) ======
           - izquierda: Visible tattoos (pill con Yes/No)
           - derecha: Dietary allergies (chips múltiples)
      */}
      {(hasTattoosAnswer || lh.dietaryAllergies.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '232px 232px',
            justifyContent: 'center',
            gap: 22,
            marginTop: 8,
          }}
        >
          {/* Respuesta de Visible tattoos */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {hasTattoosAnswer && (
              <div className="ppv-lh-chips">
                <Pill>{lh.tattoosVisible}</Pill>
              </div>
            )}
          </div>

          {/* Respuestas de Dietary allergies */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {lh.dietaryAllergies.length > 0 && (
              <div className="ppv-lh-chips">
                {lh.dietaryAllergies.map((a) => (
                  <Pill key={a}>{a}</Pill>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}