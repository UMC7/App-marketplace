// src/components/cv/candidate/sectionscomponents/experience/EmploymentStatus.js
import React, { useMemo } from 'react';

export default function EmploymentStatus({
  items,
  loading = false,
  label = 'Status',
  status: statusProp,
}) {
  const status = useMemo(() => {
    const picked = typeof statusProp === 'string' && statusProp.trim() ? statusProp.trim() : null;
    if (picked) return picked;

    if (loading || !Array.isArray(items) || items.length === 0) return null;

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
  }, [items, loading, statusProp]);

  if (status == null) return null;

  return (
    <>
      <strong>{label}:</strong>{' '}
      <span>{status}</span>
    </>
  );
}