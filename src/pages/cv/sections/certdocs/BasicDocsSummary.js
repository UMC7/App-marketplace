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

export default function BasicDocsSummary({ documents = [], docFlags = {} }) {
  const items = useMemo(() => {
    // REGLA DE VISIBILIDAD para indicadores:
    // - Unlisted/Private/Public: todos cuentan como "tiene documento".
    // - El listado visible se filtra en PublicCertDocsSection.
    const docs = Array.isArray(documents) ? documents : [];

    const byType = (type) => docs.filter(d => canonicalType(d) === type);

    // Helper: OR entre doc/flag con expiración válida si aplica
    const flagTrue = (v) => v === true;

    // Passport (>6 months) — si hay documento adjunto, se marca OK.
    // El flag indica “tengo pasaporte”.
    const passport = byType('passport')[0];
    const passportOk = !!passport || flagTrue(docFlags?.passport6m);

    // Seaman's Book — ok si hay doc o flag
    const sb = byType('seamanbook')[0];
    const sbOk = (!!sb) || flagTrue(docFlags?.seamansBook);

    // STCW Basic Safety (A-VI/1) — ok si hay doc o flag
    const stcw = byType('stcw').find(d => /vi\/?1|basic\s*safety|bst/i.test(norm(d.title || d.type)));
    const stcwOk = (!!stcw) || flagTrue(docFlags?.stcwBasic);

    // ENG1 — ok si hay doc o flag
    const eng1 = byType('eng1')[0];
    const eng1Ok = ((!!eng1) || flagTrue(docFlags?.eng1));

    // Schengen Visa — ok si doc o flag
    const schengen = byType('visa').find(d => /schengen/i.test(norm(d.title || d.type)));
    const schengenOk = ((!!schengen) || flagTrue(docFlags?.schengenVisa));

    // US Visa — ok si doc o flag
    const usVisa = byType('visa').find(d =>
      /\b(us|b1\/?b2|b1|c1\/?d)\b/i.test(norm(d.title || d.type))
    );
    const usOk = ((!!usVisa) || flagTrue(docFlags?.usVisa));

    // === NUEVOS 3 ÍTEMS (segunda fila) ===
    // Driving License — ok si doc o flag
    const drivingDoc = docs.find(d => /driver|driving|licen[cs]e/i.test(norm(d.title || d.type)));
    const drivingOk = ((!!drivingDoc) || flagTrue(docFlags?.drivingLicense));

    // PDSD Course — ok si doc o flag
    const pdsdDoc = docs.find(d => /pdsd/i.test(norm(d.title || d.type)));
    const pdsdOk = (!!pdsdDoc) || flagTrue(docFlags?.pdsd);

    // COVID Vaccine — ok si doc o flag
    const covidDoc = docs.find(d => /covid|vaccin/i.test(norm(d.title || d.type)));
    const covidOk = (!!covidDoc) || flagTrue(docFlags?.covidVaccine);

    return [
      { label: 'Passport >6 months', ok: passportOk },
      { label: 'SCHENGEN Visa',      ok: schengenOk },
      { label: 'STCW Basic Safety',  ok: stcwOk },
      { label: "Seaman’s Book",      ok: sbOk },
      { label: 'ENG1',               ok: eng1Ok },
      { label: 'US VISA',            ok: usOk },
      // ⬇️ Fila adicional
      { label: 'Driving License',    ok: drivingOk },
      { label: 'PDSD Course',        ok: pdsdOk },
      { label: 'COVID Vaccine',      ok: covidOk },
    ];
  }, [documents, docFlags]);

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
