// src/components/cv/analytics/TrafficTrendsChart.js
import React, { useMemo } from 'react';
import { formatDateShort, formatInt } from '../../../utils/analytics/formatters';

export default function TrafficTrendsChart({
  data = [],
  loading = false,
  title = 'Traffic trends',
  bucket = 'day',
}) {
  const safe = Array.isArray(data) ? data : [];

  const { pointsViews, pointsUnique, xTicks, maxY } = useMemo(() => {
    const arr = safe.map((d) => ({
      date: d?.date ? String(d.date) : '',
      views: Number(d?.views || 0),
      unique: Number(d?.unique_viewers || 0),
    }));

    const maxVal = Math.max(10, ...arr.map((d) => d.views), ...arr.map((d) => d.unique));
    const ticks = arr.map((d, i) => ({ i, date: d.date }));

    // dimensiones internas
    const W = 640;
    const H = 220;
    const P = { t: 14, r: 12, b: 28, l: 36 };
    const innerW = W - P.l - P.r;
    const innerH = H - P.t - P.b;

    // escalas lineales simples
    const x = (i, n) => (n <= 1 ? 0 : (i / (n - 1)) * innerW);
    const y = (v) => innerH - (v / maxVal) * innerH;

    const toPath = (arrValues, key) => {
      if (!arrValues.length) return '';
      return arrValues
        .map((d, i, a) => {
          const px = P.l + x(i, a.length);
          const py = P.t + y(d[key]);
          return `${i === 0 ? 'M' : 'L'}${px},${py}`;
        })
        .join(' ');
    };

    const pathViews = toPath(arr, 'views');
    const pathUnique = toPath(arr, 'unique');

    return {
      pointsViews: pathViews,
      pointsUnique: pathUnique,
      xTicks: ticks,
      maxY: maxVal,
    };
  }, [safe]);

  // Reutilizamos mismas dimensiones para ejes y labels
  const W = 640;
  const H = 220;
  const P = { t: 14, r: 12, b: 28, l: 36 };
  const innerW = W - P.l - P.r;
  const innerH = H - P.t - P.b;

  const n = safe.length || 1;
  const xPos = (i) => P.l + (n <= 1 ? 0 : (i / (n - 1)) * innerW);

  return (
    <section
      aria-label={title}
      style={{
        border: '1px solid var(--ana-card-bd)',
        borderRadius: 12,
        background: 'var(--ana-card-bg)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--ana-text)' }}>{title}</div>
        <small style={{ opacity: 0.7, fontVariantNumeric: 'tabular-nums', color: 'var(--ana-muted)' }}>
          {bucket === 'week' ? 'Weekly' : bucket === 'month' ? 'Monthly' : 'Daily'}
        </small>
      </header>

      <div style={{ padding: '6px 10px 12px' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart of views and unique viewers">
          {/* fondo */}
          <rect x="0" y="0" width={W} height={H} fill="var(--ana-card-bg)" rx="10" ry="10" />

          {/* grid horizontal (4 líneas) */}
          {[0, 1, 2, 3].map((g) => {
            const y = P.t + (innerH / 3) * g;
            return <line key={g} x1={P.l} y1={y} x2={W - P.r} y2={y} stroke="var(--ana-line)" strokeWidth="1" />;
          })}

          {/* Paths */}
          {/* Unique viewers (línea discontinua) */}
          <path d={pointsUnique} fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 4" />

          {/* Views (línea sólida) */}
          <path d={pointsViews} fill="none" stroke="#10b981" strokeWidth="2.5" />

          {/* Eje X labels (máx 8 labels para no saturar) */}
          {xTicks
            .filter((_, i) => {
              const maxLabels = 8;
              const step = Math.ceil(n / maxLabels);
              return i % step === 0 || i === n - 1;
            })
            .map((t, i) => (
              <text
                key={`${t.date}-${i}`}
                x={xPos(t.i)}
                y={H - 6}
                textAnchor="middle"
                fontSize="10"
                fill="var(--ana-muted)"
              >
                {formatDateShort(t.date)}
              </text>
            ))}

          {/* Eje Y (máximo y etiqueta) */}
          <text x={6} y={P.t + 8} fontSize="10" fill="var(--ana-muted)">
            {formatInt(maxY)}
          </text>
          <text x={6} y={P.t + innerH} fontSize="10" fill="var(--ana-muted)">
            0
          </text>
        </svg>

        {/* Leyenda simple */}
        <div style={{ display: 'flex', gap: 16, paddingTop: 6 }}>
          <LegendItem color="#10b981" label="Views" />
          <LegendItem color="#60a5fa" label="Unique viewers" dashed />
        </div>

        {loading && (
          <div style={{ fontSize: 12, opacity: 0.7, paddingTop: 6, color: 'var(--ana-muted)' }}>
            Loading…
          </div>
        )}
        {!loading && safe.length === 0 && (
          <div style={{ fontSize: 12, opacity: 0.7, paddingTop: 6, color: 'var(--ana-muted)' }}>
            No data for the selected range.
          </div>
        )}
      </div>
    </section>
  );
}

function LegendItem({ color, label, dashed = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <svg width="24" height="8" aria-hidden="true">
        <line
          x1="0"
          y1="4"
          x2="24"
          y2="4"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={dashed ? '4 4' : '0'}
        />
      </svg>
      <span style={{ fontSize: 12, color: 'var(--ana-muted)' }}>{label}</span>
    </div>
  );
}