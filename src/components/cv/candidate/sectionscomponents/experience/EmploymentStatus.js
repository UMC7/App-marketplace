// src/components/cv/candidate/sectionscomponents/experience/EmploymentStatus.js
import React, { useMemo } from 'react';

export default function EmploymentStatus({ items, loading = false, label = 'Status' }) {
  const status = useMemo(() => {
    if (loading || !Array.isArray(items) || items.length === 0) return null;

    // Tomamos la experiencia más reciente por (start_year, start_month) desc.
    const latest = [...items]
      .filter(Boolean)
      .sort((a, b) => {
        const ay = Number(a.start_year) || 0;
        const by = Number(b.start_year) || 0;
        if (ay !== by) return by - ay;
        const am = Number(a.start_month) || 0;
        const bm = Number(b.start_month) || 0;
        return bm - am;
      })[0];

    if (!latest) return 'Unemployed';
    return latest.is_current ? 'Employed' : 'Unemployed';
  }, [items, loading]);

  if (status == null) return null;

  // Render "bare" (sin contenedor). El contenedor y estilos (cp-summary) se aplican desde el padre
  // para que Status, Yachting Experience y Longevity tengan exactamente el mismo wrapper/tamaño.
  return (
    <>
      <strong>{label}:</strong>{' '}
      <span>{status}</span>
    </>
  );
}