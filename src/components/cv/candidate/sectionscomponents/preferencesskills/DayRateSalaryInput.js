// src/components/cv/candidate/sectionscomponents/preferencesskills/DayRateSalaryInput.jsx
import React from 'react';
import { CURRENCIES } from './catalogs';

// Hook local para móvil (≤640px). No afecta desktop.
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  );
  React.useEffect(() => {
    const mql = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)') : null;
    const handler = (e) => setIsMobile(!!e.matches);
    mql?.addEventListener?.('change', handler);
    setIsMobile(mql ? mql.matches : false);
    return () => mql?.removeEventListener?.('change', handler);
  }, []);
  return isMobile;
}

export default function DayRateSalaryInput({
  // Compat: aceptamos el shape antiguo y el nuevo
  value = {
    currency: 'USD',
    dayRate: '',
    monthlySalary: '',
    dayRateMin: '',
    dayRateMax: '',
    salaryMin: '',
    salaryMax: '',
  },
  onChange,
}) {
  const isMobile = useIsMobile();

  // Normalizamos (y conservamos claves antiguas para no romper nada al guardar)
  const v = {
    currency: value?.currency ?? 'USD',

    // NUEVO
    dayRate: value?.dayRate ?? value?.dayRateMin ?? '',
    monthlySalary:
      value?.monthlySalary ?? value?.salaryMonthly ?? value?.salaryMin ?? '',

    // LEGACY (no se muestran, pero los preservamos)
    dayRateMin: value?.dayRateMin ?? '',
    dayRateMax: value?.dayRateMax ?? '',
    salaryMin: value?.salaryMin ?? '',
    salaryMax: value?.salaryMax ?? '',
  };

  const patch = (key, val) => {
    let next = { ...v };

    if (key === 'dayRate') {
      next.dayRate = val;
      // Back-compat: reflejamos en la clave antigua mínima
      next.dayRateMin = val;
    } else if (key === 'monthlySalary') {
      next.monthlySalary = val;
      // Back-compat: reflejamos en las claves antiguas mínimas
      next.salaryMin = val;
      next.salaryMonthly = val;
    } else if (key === 'currency') {
      next.currency = val;
    } else {
      next[key] = val;
    }

    onChange?.(next);
  };

  return (
    <div>
      <label className="cp-label">Compensation expectations</label>

      {/* En desktop mantenemos 2 columnas (70px / resto). En móvil apilamos vertical. */}
      <div
        className="cp-row"
        style={{
          display: 'grid',
          gap: isMobile ? 10 : 12,
          gridTemplateColumns: isMobile ? '1fr' : '70px 1fr',
          alignItems: 'start',
        }}
      >
        {/* Moneda (lista acotada) con label para igualar alto visual con sus vecinos */}
        <div>
          <div className="cp-label" style={{ marginTop: 0 }}>Currency</div>
          <select
            className="cp-input"
            value={v.currency}
            onChange={(e) => patch('currency', e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Dos campos simples: sin "max", y sueldo mensual en lugar de anual */}
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          }}
        >
          <div>
            <div className="cp-label" style={{ marginTop: 0 }}>Day rate</div>
            <input
              className="cp-input"
              inputMode="numeric"
              placeholder="Per day"
              value={v.dayRate}
              onChange={(e) => patch('dayRate', e.target.value)}
            />
          </div>

          <div>
            <div className="cp-label" style={{ marginTop: 0 }}>Monthly salary</div>
            <input
              className="cp-input"
              inputMode="numeric"
              placeholder="Per month"
              value={v.monthlySalary}
              onChange={(e) => patch('monthlySalary', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}