// src/pages/cv/sections/experience/PublicExperienceCharts.jsx
import React, { useMemo, useLayoutEffect, useState } from 'react';
import './experience.css';

function pad2(n){ return String(n||'').padStart(2,'0'); }
function monthsBetween(sY,sM,eY,eM,isCurrent){
  const start = new Date(`${sY||0}-${pad2(sM||1)}-01T00:00:00Z`);
  let end;
  if (isCurrent) {
    const now = new Date();
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  } else {
    end = new Date(`${eY||sY||0}-${pad2(eM||sM||1)}-01T00:00:00Z`);
  }
  let months = (end.getUTCFullYear() - start.getUTCFullYear())*12 + (end.getUTCMonth() - start.getUTCMonth()) + 1;
  if (!isFinite(months) || months < 0) months = 0;
  return months;
}
const toYears = (m) => Math.round((m/12)*10)/10;

function sizeBucket(loa){
  const v = Number(loa);
  if (!isFinite(v) || v <= 0) return null;
  if (v < 30) return '<30m';
  if (v < 40) return '30–39m';
  if (v < 50) return '40–49m';
  if (v < 60) return '50–59m';
  if (v < 70) return '60–69m';
  return '70m+';
}
const SIZE_ORDER = ['<30m','30–39m','40–49m','50–59m','60–69m','70m+'];

export default function PublicExperienceCharts({ experiences = [] }) {
  const [coords, setCoords] = useState({ top: null, maxH: null });

  useLayoutEffect(() => {
    const measure = () => {
      const page = document.querySelector('.ppv-a4Page');
      const meta = document.querySelector('.ppv-a4Meta');
      if (!page || !meta) return;

      const pageRect = page.getBoundingClientRect();
      const metaRect = meta.getBoundingClientRect();
      const pageH = pageRect.height || 0;

      const top = Math.max(0, Math.round(metaRect.bottom - pageRect.top + 8));
      const halfLimit = Math.round(pageH * 0.5) - 8;
      const maxH = Math.max(0, halfLimit - top);

      setCoords({ top, maxH });
    };
    measure();
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    const page = document.querySelector('.ppv-a4Page');
    const meta = document.querySelector('.ppv-a4Meta');
    if (page) ro.observe(page);
    if (meta) ro.observe(meta);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, [experiences]);

  const { sizeData, rankData, maxYears1, maxYears2 } = useMemo(() => {
    const sizeMap = new Map();
    const rankMap = new Map();

    for (const x of experiences || []) {
      if ((x?.kind || x?.type) === 'shore') continue;
      const m = monthsBetween(x?.start_year, x?.start_month, x?.end_year, x?.end_month, !!x?.is_current);
      if (m <= 0) continue;

      const bucket = sizeBucket(x?.loa_m || x?.length_m || x?.length || x?.loa || x?.loaM);
      if (bucket) sizeMap.set(bucket, (sizeMap.get(bucket) || 0) + m);

      const rank = (x?.role_other || x?.role || '').trim() || 'Unspecified';
      rankMap.set(rank, (rankMap.get(rank) || 0) + m);
    }

    const sizeData = Array.from(sizeMap.entries())
      .sort((a,b) => SIZE_ORDER.indexOf(a[0]) - SIZE_ORDER.indexOf(b[0]))
      .map(([label, m]) => ({ label, years: toYears(m) }));

    const rankData = Array.from(rankMap.entries())
      .sort((a,b) => b[1] - a[1])
      .map(([label, m]) => ({ label, years: toYears(m) }));

    const maxYears1 = Math.max(0, ...sizeData.map(d => d.years));
    const maxYears2 = Math.max(0, ...rankData.map(d => d.years));
    return { sizeData, rankData, maxYears1, maxYears2 };
  }, [experiences]);

  const containerStyle = {
    position: 'absolute',
    top: coords.top != null ? `${coords.top}px` : 'calc(50% / 2.4)',
    left: 0,
    right: '33.333%',
    padding: 12,
    zIndex: 1,
    maxHeight: coords.maxH != null ? `${coords.maxH}px` : undefined,
    overflowY: coords.maxH != null ? 'auto' : 'visible',
  };

  return (
    <section className="xp-chartsRow" aria-label="Experience overview charts" style={containerStyle}>
      {/* Sizes vs Years */}
      <div className="xp-chartCard" aria-label="Sizes vs years">
        <div className="xp-chartTitle">Sizes vs Years</div>
        {sizeData.length ? (
          <ul className="xp-bars">
            {sizeData.map(d => {
              const pct = maxYears1 ? (d.years / maxYears1) * 100 : 0;
              const valText = `${d.years.toFixed(1)}y`;
              return (
                <li className="xp-bar" key={d.label}>
                  <span className="xp-barLabel">{d.label}</span>
                  <div
                    className="xp-barTrack"
                    role="img"
                    aria-label={`${d.label}: ${valText}`}
                    style={{ ['--fill']: `${pct}%` }}
                  >
                    <div className="xp-barFill" style={{ width: 'var(--fill)' }} />
                    {/* Valor al final de la barra, fuera del área coloreada */}
                    <span
                      className="xp-barVal"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: 'min(var(--fill), calc(100% - 28px))',
                        transform: 'translate(6px, -50%)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {valText}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="xp-empty">— No yacht sizes recorded —</div>
        )}
      </div>

      {/* Ranks vs Years */}
      <div className="xp-chartCard" aria-label="Ranks vs years">
        <div className="xp-chartTitle">Ranks vs Years</div>
        {rankData.length ? (
          <ul className="xp-bars">
            {rankData.map(d => {
              const pct = maxYears2 ? (d.years / maxYears2) * 100 : 0;
              const valText = `${d.years.toFixed(1)}y`;
              return (
                <li className="xp-bar" key={d.label}>
                  <span className="xp-barLabel">{d.label}</span>
                  <div
                    className="xp-barTrack"
                    role="img"
                    aria-label={`${d.label}: ${valText}`}
                    style={{ ['--fill']: `${pct}%` }}
                  >
                    <div className="xp-barFill" style={{ width: 'var(--fill)' }} />
                    {/* Valor al final de la barra, fuera del área coloreada */}
                    <span
                      className="xp-barVal"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: 'min(var(--fill), calc(100% - 28px))',
                        transform: 'translate(6px, -50%)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {valText}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="xp-empty">— No ranks recorded —</div>
        )}
      </div>
    </section>
  );
}