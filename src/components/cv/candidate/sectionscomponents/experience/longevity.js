// src/components/cv/candidate/sectionscomponents/experience/longevity.js

/** Lista de meses para formato corto */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Devuelve un número de meses entre dos fechas (YYYY, M) **incluyendo** ambos extremos.
 * Si la fecha final es anterior a la inicial, retorna 0.
 */
export function monthsBetweenInclusive(sYear, sMonth, eYear, eMonth) {
  const sy = Number(sYear), sm = Number(sMonth);
  const ey = Number(eYear), em = Number(eMonth);

  if (!Number.isFinite(sy) || !Number.isFinite(sm)) return 0;
  if (!Number.isFinite(ey) || !Number.isFinite(em)) return 0;

  const start = sy * 12 + (sm - 1);
  const end   = ey * 12 + (em - 1);
  if (end < start) return 0;

  // +1 para contar el mes de inicio
  return (end - start) + 1;
}

/**
 * Formatea un total de meses a etiqueta legible (igual criterio que usamos en Experience):
 * - < 1 → "0 months"
 * - 1..23 → "N months"
 * - >= 24 → "X.Y years" (un decimal)
 */
export function formatMonthsHuman(totalMonths) {
  const m = Number(totalMonths || 0);
  if (!Number.isFinite(m) || m <= 0) return '0 months';
  if (m < 24) return `${m} month${m === 1 ? '' : 's'}`;
  const years = m / 12;
  const rounded = Math.round(years * 10) / 10;
  return `${rounded.toFixed(1)} years`;
}

/**
 * Calcula la longevidad (meses) de una sola fila de experiencia.
 * Usa la fecha actual para los ítems con is_current = true.
 */
export function tenureMonthsForItem(row) {
  if (!row) return 0;
  const sy = row.start_year;
  const sm = row.start_month;

  // end: si es current usamos hoy
  let ey = row.end_year;
  let em = row.end_month;

  if (row.is_current) {
    const now = new Date();
    ey = now.getFullYear();
    em = now.getMonth() + 1; // 1..12
  }

  return monthsBetweenInclusive(sy, sm, ey, em);
}

/* =========================
   Helpers para “fusionar”
   ========================= */

/** Convierte (y,m) a índice absoluto de mes (enteros crecientes) */
function monthIndex(y, m) {
  const yy = Number(y);
  const mm = Number(m);
  if (!Number.isFinite(yy) || !Number.isFinite(mm)) return null;
  return yy * 12 + (mm - 1);
}

/** Normaliza nombre de yate/empleador para agrupar */
function normalizeVesselName(row) {
  const raw = (row?.vessel_name || row?.vessel_or_employer || '').trim().toLowerCase();
  // compactar espacios y quitar algunos signos comunes
  return raw.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
}

/**
 * Dado un arreglo de intervalos {sIdx, eIdx}, devuelve intervalos fusionados
 * donde dos intervalos se unen si se solapan o si el siguiente empieza
 * **inmediatamente después** del anterior (continuidad sin huecos).
 */
function mergeContinuousIntervals(ranges) {
  if (!Array.isArray(ranges) || ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.sIdx - b.sIdx);

  const merged = [];
  let cur = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const nxt = sorted[i];
    // Continuo si nxt.sIdx <= cur.eIdx + 1 (mismo mes/solapado/inmediatamente siguiente)
    if (nxt.sIdx <= cur.eIdx + 1) {
      cur.eIdx = Math.max(cur.eIdx, nxt.eIdx);
    } else {
      merged.push(cur);
      cur = { ...nxt };
    }
  }
  merged.push(cur);
  return merged;
}

/* =======================================================================
 * Filtra y calcula la longevidad promedio de una lista de items de yates.
 * Reglas:
 *  - Solo cuenta kind === 'yacht' (a menos que opts.onlyYacht === false)
 *  - Registros del **mismo yate** con periodos **continuos o solapados**
 *    se consideran **un solo empleo** (ascensos, etc.).
 *  - El promedio es: (suma de meses de cada empleo fusionado) / (número de empleos).
 * ======================================================================= */
export function computeLongevityAvg(items, opts = {}) {
  const onlyYacht = opts.onlyYacht !== false; // por defecto true
  const list = Array.isArray(items) ? items : [];

  // 1) Filtrado básico + transformar a intervalos
  const intervalsByVessel = new Map();
  const now = new Date();
  const nowY = now.getFullYear();
  const nowM = now.getMonth() + 1;

  for (const r of list) {
    if (!r) continue;
    if (onlyYacht && String(r.kind || r.type || '').toLowerCase() !== 'yacht') continue;

    const sy = Number(r.start_year);
    const sm = Number(r.start_month);
    if (!Number.isFinite(sy) || !Number.isFinite(sm) || sm < 1 || sm > 12) continue;

    const ey = r.is_current ? nowY : Number(r.end_year);
    const em = r.is_current ? nowM : Number(r.end_month);

    const sIdx = monthIndex(sy, sm);
    const eIdx = monthIndex(ey, em);
    if (sIdx == null || eIdx == null) continue;
    if (eIdx < sIdx) continue;

    const key = normalizeVesselName(r);
    if (!key) continue;

    const arr = intervalsByVessel.get(key) || [];
    arr.push({ sIdx, eIdx });
    intervalsByVessel.set(key, arr);
  }

  if (intervalsByVessel.size === 0) {
    return { avgMonths: 0, avgLabel: '0 months', usedCount: 0 };
  }

  // 2) Fusionar por yate y sumar meses de cada empleo fusionado
  let totalMonths = 0;
  let employments = 0;

  for (const [, ranges] of intervalsByVessel) {
    const merged = mergeContinuousIntervals(ranges);
    for (const seg of merged) {
      const months = (seg.eIdx - seg.sIdx) + 1; // inclusivo
      if (months > 0) {
        totalMonths += months;
        employments += 1; // cada segmento fusionado cuenta como 1 empleo
      }
    }
  }

  if (employments === 0) {
    return { avgMonths: 0, avgLabel: '0 months', usedCount: 0 };
  }

  // 3) Promedio
  const avg = Math.round((totalMonths / employments) * 10) / 10; // 1 decimal
  return {
    avgMonths: avg,
    // Mostramos etiqueta legible redondeando a meses enteros para la conversión a años
    avgLabel: formatMonthsHuman(Math.round(avg)),
    usedCount: employments,
  };
}

/**
 * Formato auxiliar de un rango YM a "Mon YYYY — Mon YYYY/Present".
 * (Opcional: por si luego quieres mostrar por-item la longevidad).
 */
export function formatRangeLabel(row) {
  const sy = Number(row?.start_year);
  const sm = Number(row?.start_month);
  const ey = row?.is_current ? null : Number(row?.end_year);
  const em = row?.is_current ? null : Number(row?.end_month);

  const mm = (m) => (Number.isFinite(m) && m >= 1 && m <= 12 ? MONTHS[m - 1] : '');

  const start =
    Number.isFinite(sy) && Number.isFinite(sm) ? `${mm(sm)} ${sy}` :
    Number.isFinite(sy) ? String(sy) :
    '';

  let end = '';
  if (row?.is_current) {
    end = 'Present';
  } else if (Number.isFinite(ey) && Number.isFinite(em)) {
    end = `${mm(em)} ${ey}`;
  } else if (Number.isFinite(ey)) {
    end = String(ey);
  }

  return start && end ? `${start} — ${end}` : start || end || '';
}

export default computeLongevityAvg;