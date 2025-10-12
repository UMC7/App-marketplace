// src/pages/cv/sections/certdocs/BasicDocsSummary.js
import React, { useMemo } from 'react';

// === Helpers (mismos criterios que usamos en la sección de docs) ===
function canonicalType(doc) {
  // Unificamos título+tipo, normalizamos comillas curvas y pasamos a minúsculas
  const text = `${doc?.type || ''} ${doc?.title || ''}`
    .toLowerCase()
    .replace(/[\u2019\u2018]/g, "'"); // ’ ‘ -> '

  const has = (re) => re.test(text);

  if (has(/\bpassport\b/)) return 'passport';
  if (has(/\bvisa\b|residen/)) return 'visa';

  // Acepta "Seaman’s/Seaman's ... Book", "Seafarer ... Book" y "Discharge Book"
  if (has(/\b(seaman'?s|seafarer)\b.*\bbook\b|\bdischarge\s*book\b/)) return 'seamanbook';

  // STCW / Basic Safety (más variantes)
  if (
    has(
      /\bstcw\b|a-?vi\/?1|\bbst\b|basic\s*safety|pssr|pbst|crowd|fire\s*fighting|survival|proficiency|pdsd/
    )
  )
    return 'stcw';

  if (has(/\beng\s*1\b|eng1/)) return 'eng1';
  if (has(/\bcoc\b|certificate of competency/)) return 'coc';
  if (has(/\bgoc\b|general operator/)) return 'goc';
  if (has(/yacht\s*master|yachtmaster/)) return 'yachtmaster';
  return 'other';
}
const norm = (v = '') => v.toString().toLowerCase();

function addMonths(date, months) {
  const d = new Date(date);
  if (isNaN(+d)) return null;
  const n = new Date(d);
  n.setMonth(d.getMonth() + months);
  return n;
}

function isFuture(date) {
  const d = new Date(date);
  if (isNaN(+d)) return false;
  const today = new Date();
  // Compare at day precision
  const dY = d.getFullYear(), dM = d.getMonth(), dD = d.getDate();
  const tY = today.getFullYear(), tM = today.getMonth(), tD = today.getDate();
  if (dY !== tY) return dY > tY;
  if (dM !== tM) return dM > tM;
  return dD >= tD;
}

// === UI bits ===
const OK_COLOR = '#16c5c1';   // mismo turquesa que las barras
const BAD_COLOR = '#ef4444';

function StatusBadge({ ok }) {
  const fill = ok ? OK_COLOR : BAD_COLOR;
  const icon = ok ? (
    // Check
    <path d="M9.5 13.2 6.7 10.4a1 1 0 0 0-1.4 1.4l3.2 3.2a1 1 0 0 0 1.4 0l6.7-6.7a1 1 0 1 0-1.4-1.4L9.5 13.2z" fill="#fff"/>
  ) : (
    // X
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

function ItemRow({ label, ok }) {
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
    }}>
      {/* Icono a la izquierda (como pediste) */}
      <StatusBadge ok={ok}/>
      <span style={{ fontSize: 14, color: '#0b1220' }}>{label}</span>
    </div>
  );
}

export default function BasicDocsSummary({ documents = [] }) {
  const items = useMemo(() => {
    const docs = Array.isArray(documents) ? documents : [];
    const byType = (type) => docs.filter(d => canonicalType(d) === type);

    // Passport (>6 months)
    const passport = byType('passport')[0];
    const passportOk = !!passport && passport.expires_on
      ? isFuture(addMonths(passport.expires_on, -6))
      : false; // si no hay fecha no podemos garantizar 6m

    // Seaman's Book (si existe; si trae expiración, que no esté vencido)
    const sb = byType('seamanbook')[0];
    const sbOk = !!sb && (!sb.expires_on || isFuture(sb.expires_on));

    // STCW Basic Safety (A-VI/1) — si existe (no suele caducar)
    const stcw = byType('stcw').find(d => /vi\/?1|basic\s*safety|bst/i.test(norm(d.title || d.type)));
    const stcwOk = !!stcw;

    // ENG1 (médico) — válido si no vencido
    const eng1 = byType('eng1')[0];
    const eng1Ok = !!eng1 && (!eng1.expires_on || isFuture(eng1.expires_on));

    // Schengen Visa — válido si existe y (si trae expiración) no vencido
    const schengen = byType('visa').find(d => /schengen/i.test(norm(d.title || d.type)));
    const schengenOk = !!schengen && (!schengen.expires_on || isFuture(schengen.expires_on));

    // US Visa (B1/B2 o C1/D) — válido si existe y no vencido si aplica
    const usVisa = byType('visa').find(d =>
      /\b(us|b1\/?b2|b1|c1\/?d)\b/i.test(norm(d.title || d.type))
    );
    const usOk = !!usVisa && (!usVisa.expires_on || isFuture(usVisa.expires_on));

    return [
      { label: 'Passport >6 months', ok: passportOk },
      { label: 'SCHENGEN Visa',      ok: schengenOk },
      { label: 'STCW Basic Safety',  ok: stcwOk },
      { label: "Seaman’s Book",      ok: sbOk },
      { label: 'ENG1',               ok: eng1Ok },
      { label: 'US VISA',            ok: usOk },
    ];
  }, [documents]);

  if (!items.length) return null;

  return (
    <div
      className="ppv-basicDocsSummary"
      role="group"
      aria-label="Basic documents quick status"
      style={{
        margin: '6px auto 12px',
        maxWidth: 720,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
        gap: 12,
      }}
    >
      {items.map((it, i) => (
        <ItemRow key={`${it.label}-${i}`} label={it.label} ok={it.ok} />
      ))}
    </div>
  );
}