// src/components/cv/candidate/sectionscomponents/preferencesskills/OnboardPreferences.jsx
import React, { useEffect, useMemo, useState } from 'react';

const DEFAULTS = {
  // Claves existentes (conservadas por back-compat)
  non_smoker: false,
  couples_ok: false,
  pets_kids_friendly: false,
  visible_tattoos_ok: false,
  guest_facing_ok: false,
  alcohol_free_ok: false,

  // --- NUEVOS (opt-in) ---
  // Personality vibe
  cheerful: false,
  reserved: false,
  energetic: false,
  discreet: false,

  // Work style
  team_player: false,
  independent: false,
  detail_oriented: false,
  fast_paced: false,

  // Lifestyle / habits aboard
  early_bird: false,
  night_owl: false,
  fitness_oriented: false,
  party_friendly: false,
  quiet_hours_important: false,
  enjoys_events: false,
};

const normalize = (v) => ({ ...DEFAULTS, ...(v && typeof v === 'object' ? v : {}) });

// Hook local para saber si es móvil (≤640px). No afecta desktop.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  );
  useEffect(() => {
    const mql = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)') : null;
    const handler = (e) => setIsMobile(!!e.matches);
    mql?.addEventListener?.('change', handler);
    setIsMobile(mql ? mql.matches : false);
    return () => mql?.removeEventListener?.('change', handler);
  }, []);
  return isMobile;
}

export default function OnboardPreferences({ value, onChange }) {
  const isMobile = useIsMobile();

  // Estado local SIEMPRE se usa para renderizar
  const [state, setState] = useState(() => normalize(value));

  // Sincroniza si el padre cambia "value"
  useEffect(() => {
    const next = normalize(value);
    if (JSON.stringify(next) !== JSON.stringify(state)) {
      setState(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const patch = (k, val) => {
    const next = { ...state, [k]: val };
    setState(next);           // actualiza UI inmediato
    onChange?.(next);         // notifica al padre si lo desea
  };

  // Listas
  // Sustituimos las 6 opciones base por las nuevas (mantenemos las claves por compatibilidad)
  const BASE_PREFS = useMemo(
    () => [
      ['non_smoker', 'Smoke/vape-free policy'],
      ['alcohol_free_ok', 'Alcohol-free (“dry boat”)'],
      ['visible_tattoos_ok', 'Quiet / low-party environment'],
      ['couples_ok', 'International crew environment'],
      ['guest_facing_ok', 'Large-crew environment'],
      ['pets_kids_friendly', 'Permanent homeport'],
    ],
    []
  );

  const PERSONALITY = useMemo(
    () => [
      ['cheerful', 'Cheerful / positive'],
      ['reserved', 'Calm / reserved'],
      ['energetic', 'Energetic / outgoing'],
      ['discreet', 'Discreet / private'],
    ],
    []
  );

  const WORK_STYLE = useMemo(
    () => [
      ['team_player', 'Team player'],
      ['independent', 'Independent worker'],
      ['detail_oriented', 'Detail-oriented'],
      ['fast_paced', 'Fast-paced / can hustle'],
    ],
    []
  );

  const LIFESTYLE = useMemo(
    () => [
      ['early_bird', 'Early bird'],
      ['night_owl', 'Night owl'],
      ['fitness_oriented', 'Fitness-oriented'],
      ['party_friendly', 'Party-friendly'],
      ['quiet_hours_important', 'Quiet hours important'],
      ['enjoys_events', 'Enjoys events/charters vibe'],
    ],
    []
  );

  // Sección (mismo estilo que el resto: títulos con .cp-label)
  const Section = ({ title, items }) => (
    <>
      {title && (
        <div className="cp-label" style={{ marginTop: 8, marginBottom: 6 }}>
          {title}
        </div>
      )}
      <div
        className="cp-grid"
        style={{
          display: 'grid',
          gap: isMobile ? 10 : 12,
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
          alignItems: 'start',
        }}
      >
        {items.map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={!!state[key]}
              onChange={(e) => patch(key, e.target.checked)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </>
  );

  return (
    <div>
      <div className="cp-label" style={{ marginBottom: 6 }}>
        Onboard preferences
      </div>

      <Section items={BASE_PREFS} />
      <Section title="Personality vibe" items={PERSONALITY} />
      <Section title="Work style" items={WORK_STYLE} />
      <Section title="Lifestyle / habits aboard" items={LIFESTYLE} />
    </div>
  );
}