// src/components/cv/candidate/ProfileProgress.js
import React, { useMemo } from 'react';

export default function ProfileProgress({ sections = {} }) {
  // Admite:
  // - boolean / string / truthy -> 0 o 1
  // - number -> 0..1 (o 0..100 como %)
  // - array[boolean] -> promedio de true
  // - array[{done:boolean}] -> promedio de done
  // - object {count,total} | {done,total} | {progress} | {value} (+ opcional weight)
  // - object con varias llaves booleanas -> promedio de booleans
  const percent = useMemo(() => {
    const entries = Object.entries(sections);
    if (!entries.length) return 0;

    const acc = entries.reduce(
      (accum, [, v]) => {
        const { ratio, weight } = toRatioAndWeight(v);
        accum.weightSum += weight;
        accum.scoreSum += ratio * weight;
        return accum;
      },
      { scoreSum: 0, weightSum: 0 }
    );

    if (acc.weightSum <= 0) return 0;
    return Math.round((acc.scoreSum / acc.weightSum) * 100);
  }, [sections]);

  return (
    <div style={{ margin: '8px 0 12px' }}>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
        Profile completeness: <strong>{percent}%</strong>
      </div>
      <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999 }}>
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: '#68ada8',
            borderRadius: 999,
            transition: 'width .25s ease',
          }}
        />
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function toRatioAndWeight(v) {
  // Peso por defecto 1; objetos pueden sobreescribir con .weight (>0)
  let weight = 1;
  let ratio = 0;

  // number: 0..1 o 0..100
  if (typeof v === 'number' && Number.isFinite(v)) {
    ratio = normalizeNumberToRatio(v);
    return { ratio, weight };
  }

  // array
  if (Array.isArray(v)) {
    if (!v.length) return { ratio: 0, weight };
    // Todos booleanos -> promedio
    if (v.every((x) => typeof x === 'boolean')) {
      const t = v.filter(Boolean).length;
      ratio = t / v.length;
      return { ratio: clamp01(ratio), weight };
    }
    // Todos con {done:boolean} -> promedio de done
    if (v.every((x) => x && typeof x === 'object' && 'done' in x)) {
      const t = v.filter((x) => !!x.done).length;
      ratio = t / v.length;
      return { ratio: clamp01(ratio), weight };
    }
    // Compat: lista “no vacía” cuenta como completo
    return { ratio: 1, weight };
  }

  // string
  if (typeof v === 'string') {
    return { ratio: v.trim() ? 1 : 0, weight };
  }

  // object
  if (v && typeof v === 'object') {
    // peso opcional
    if (Number.isFinite(v.weight) && v.weight > 0) {
      weight = v.weight;
    }

    // {progress} o {value}: admite 0..1 o 0..100
    if (Number.isFinite(v.progress)) {
      ratio = normalizeNumberToRatio(v.progress);
      return { ratio, weight };
    }
    if (Number.isFinite(v.value)) {
      ratio = normalizeNumberToRatio(v.value);
      return { ratio, weight };
    }

    // {count,total} | {done,total}
    if (Number.isFinite(v.count) && Number.isFinite(v.total) && v.total > 0) {
      ratio = v.count / v.total;
      return { ratio: clamp01(ratio), weight };
    }
    if (Number.isFinite(v.done) && Number.isFinite(v.total) && v.total > 0) {
      ratio = v.done / v.total;
      return { ratio: clamp01(ratio), weight };
    }

    // Si trae varias llaves booleanas, promediar booleans
    const bools = Object.values(v).filter((x) => typeof x === 'boolean');
    if (bools.length) {
      ratio = bools.filter(Boolean).length / bools.length;
      return { ratio: clamp01(ratio), weight };
    }

    // Compat: objeto truthy cuenta como completo
    return { ratio: 1, weight };
  }

  // boolean u otros truthy/falsy
  return { ratio: v ? 1 : 0, weight };
}

function normalizeNumberToRatio(n) {
  // Si es 0..1 lo usamos directo; si es 1..100 lo interpretamos como %
  if (n <= 1) return clamp01(n);
  if (n <= 100) return clamp01(n / 100);
  return 1;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}