// src/pages/cv/sections/experience/PublicExperienceSection.jsx
import React, { useMemo, useLayoutEffect, useRef } from 'react';

function pad2(n){ return String(n||'').padStart(2,'0'); }
function fmtYM(y,m){
  if(!y) return '';
  const d=new Date(`${y}-${pad2(m||1)}-01T00:00:00Z`);
  return d.toLocaleString(undefined,{year:'numeric',month:'short'});
}
function byRecency(a,b){
  if(a?.is_current && !b?.is_current) return -1;
  if(!a?.is_current && b?.is_current) return 1;
  const aEnd=new Date(`${a?.end_year||0}-${pad2(a?.end_month||1)}-01`);
  const bEnd=new Date(`${b?.end_year||0}-${pad2(b?.end_month||1)}-01`);
  if(+aEnd!==+bEnd) return +bEnd-+aEnd;
  const aStart=new Date(`${a?.start_year||0}-${pad2(a?.start_month||1)}-01`);
  const bStart=new Date(`${b?.start_year||0}-${pad2(b?.start_month||1)}-01`);
  return +bStart-+aStart;
}

// ---- KIND HELPERS (separan Yacht / Merchant / Shore) ----
const kindOf = (x) => String(x?.kind || x?.type || '').toLowerCase();
const isYacht = (x) => kindOf(x) === 'yacht';
const isMerchant = (x) => {
  const k = kindOf(x);
  return k === 'merchant' || k === 'commercial' || k === 'commercial_vessel' || k === 'merchant_commercial';
};
const isShore = (x) => !isYacht(x) && !isMerchant(x);

const joinArr = (v)=> Array.isArray(v) ? v.filter(Boolean).join(', ') : (v || '');
const str = (v)=> (v==null ? '' : String(v).trim());
const ex = (it)=> (it && typeof it.extras === 'object' && it.extras) ? it.extras : {};

// ===== Helpers para gráficas (en flujo, sin posicionamiento absoluto) =====
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

function sizeBucketMerchant(loa){
  const v = Number(loa);
  if (!isFinite(v) || v <= 0) return null;
  if (v < 50)  return '<50m';
  if (v < 100) return '50–100m';
  if (v < 150) return '100–150m';
  if (v < 200) return '150–200m';
  return '200m+';
}
const MERCHANT_SIZE_ORDER = ['<50m','50–100m','100–150m','150–200m','200m+'];

function formatEnginePower(extras){
  const val = extras?.power_value;
  const unit = String(extras?.power_unit || '').trim();
  if (val == null || val === '') return '';
  if (/^kw$/i.test(unit)) return `${val} kW`;
  if (/^hp$/i.test(unit)) return `${val} hp`;
  return String(val);
}

function loaToText(loa_m){
  if (loa_m && typeof loa_m === 'object') {
    const v = Number(loa_m.parsedValue ?? loa_m.source);
    if (Number.isFinite(v)) return String(v);
  }
  const n = Number(loa_m);
  if (Number.isFinite(n)) return String(n);
  const s = String(loa_m || '').trim();
  return s || '';
}

/* utilidades de empaquetado */
const isFilled = (it) => it && str(it.value) !== '';
const chunk = (arr, n) => {
  const out = [];
  for (let i=0;i<arr.length;i+=n) out.push(arr.slice(i, i+n));
  return out;
};

/** Calcula datos para las gráficas filtrando por `kind` ('yacht' o 'merchant').
 *  Nunca contabiliza registros 'shore'. */
function computeCharts(experiences = [], kind = 'yacht') {
  const k = String(kind || '').toLowerCase();
  const sizeMap = new Map();
  const rankMap = new Map();

  for (const x of experiences || []) {
    const xKind = String(x?.kind || x?.type || '').toLowerCase();
    if (xKind !== k) continue; // separa Yachts vs Merchant; excluye Shore
    const m = monthsBetween(x?.start_year, x?.start_month, x?.end_year, x?.end_month, !!x?.is_current);
    if (m <= 0) continue;

    const bucket = (k === 'merchant'
      ? sizeBucketMerchant(x?.loa_m || x?.length_m || x?.length || x?.loa || x?.loaM)
      : sizeBucket(x?.loa_m || x?.length_m || x?.length || x?.loa || x?.loaM)
    );
    if (bucket) sizeMap.set(bucket, (sizeMap.get(bucket) || 0) + m);

    const rank = (x?.role_other || x?.role || '').trim() || 'Unspecified';
    rankMap.set(rank, (rankMap.get(rank) || 0) + m);
  }

  const ORDER = (k === 'merchant') ? MERCHANT_SIZE_ORDER : SIZE_ORDER;
  const sizeData = Array.from(sizeMap.entries())
    .sort((a,b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]))
    .map(([label, m]) => ({ label, years: toYears(m) }));

  const rankData = Array.from(rankMap.entries())
    .sort((a,b) => b[1] - a[1])
    .map(([label, m]) => ({ label, years: toYears(m) }));

  const maxYears1 = Math.max(0, ...sizeData.map(d => d.years));
  const maxYears2 = Math.max(0, ...rankData.map(d => d.years));
  return { sizeData, rankData, maxYears1, maxYears2 };
}

export default function PublicExperienceSection({ experiences=[] }){
  const list = useMemo(()=> (Array.isArray(experiences)?[...experiences]:[]).sort(byRecency), [experiences]);

  // ===== Datos para gráficos: separados por Yachts y Merchant (sin Shore) =====
  const yachtCharts = useMemo(() => computeCharts(experiences, 'yacht'), [experiences]);
  const merchantCharts = useMemo(() => computeCharts(experiences, 'merchant'), [experiences]);

  const hasYachtCharts = (yachtCharts.sizeData?.length || yachtCharts.rankData?.length) > 0;
  const hasMerchantCharts = (merchantCharts.sizeData?.length || merchantCharts.rankData?.length) > 0;

  if(!list.length && !hasYachtCharts && !hasMerchantCharts) return null;

  return (
    <section className="ppv-xp" aria-label="Experience">
      <div className="ppv-xpInner">

        {/* ===== TÍTULO ===== */}
        {(hasYachtCharts || hasMerchantCharts || list.length) > 0 && (
          <div className="ppv-sectionTitleWrap">
            <h2 className="ppv-sectionTitle">EXPERIENCE</h2>
          </div>
        )}

        {/* ===== Gráficas YACHTS ===== */}
        {hasYachtCharts && (
          <div className="xp-chartsRow" aria-label="Experience overview charts (Yachts)">
            {/* Sizes vs Years (Yachts) */}
            <div className="xp-chartCard" aria-label="Sizes vs years (Yachts)">
              <div className="xp-chartTitle">Sizes vs Years (Yachts)</div>
              {yachtCharts.sizeData.length ? (
                <ul className="xp-bars">
                  {yachtCharts.sizeData.map(d => {
                    const pct = yachtCharts.maxYears1 ? (d.years / yachtCharts.maxYears1) * 100 : 0;
                    const valText = `${d.years.toFixed(1)}y`;
                    return (
                      <li className="xp-bar" key={d.label}>
                        <span className="xp-barLabel">{d.label}</span>
                        <div className="xp-barTrack" role="img" aria-label={`${d.label}: ${valText}`}>
                          <div className="xp-barFill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="xp-barVal">{valText}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="xp-empty">— No yacht sizes recorded —</div>
              )}
            </div>

            {/* Ranks vs Years (Yachts) */}
            <div className="xp-chartCard" aria-label="Ranks vs years (Yachts)">
              <div className="xp-chartTitle">Ranks vs Years (Yachts)</div>
              {yachtCharts.rankData.length ? (
                <ul className="xp-bars">
                  {yachtCharts.rankData.map(d => {
                    const pct = yachtCharts.maxYears2 ? (d.years / yachtCharts.maxYears2) * 100 : 0;
                    const valText = `${d.years.toFixed(1)}y`;
                    return (
                      <li className="xp-bar" key={d.label}>
                        <span className="xp-barLabel">{d.label}</span>
                        <div className="xp-barTrack" role="img" aria-label={`${d.label}: ${valText}`}>
                          <div className="xp-barFill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="xp-barVal">{valText}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="xp-empty">— No ranks recorded —</div>
              )}
            </div>
          </div>
        )}

        {/* ===== Gráficas MERCHANT ===== */}
        {hasMerchantCharts && (
          <div className="xp-chartsRow" aria-label="Experience overview charts (Merchant)">
            {/* Sizes vs Years (Merchant) */}
            <div className="xp-chartCard" aria-label="Sizes vs years (Merchant)">
              <div className="xp-chartTitle">Sizes vs Years (Merchant)</div>
              {merchantCharts.sizeData.length ? (
                <ul className="xp-bars">
                  {merchantCharts.sizeData.map(d => {
                    const pct = merchantCharts.maxYears1 ? (d.years / merchantCharts.maxYears1) * 100 : 0;
                    const valText = `${d.years.toFixed(1)}y`;
                    return (
                      <li className="xp-bar" key={d.label}>
                        <span className="xp-barLabel">{d.label}</span>
                        <div className="xp-barTrack" role="img" aria-label={`${d.label}: ${valText}`}>
                          <div className="xp-barFill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="xp-barVal">{valText}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="xp-empty">— No yacht sizes recorded —</div>
              )}
            </div>

            {/* Ranks vs Years (Merchant) */}
            <div className="xp-chartCard" aria-label="Ranks vs years (Merchant)">
              <div className="xp-chartTitle">Ranks vs Years (Merchant)</div>
              {merchantCharts.rankData.length ? (
                <ul className="xp-bars">
                  {merchantCharts.rankData.map(d => {
                    const pct = merchantCharts.maxYears2 ? (d.years / merchantCharts.maxYears2) * 100 : 0;
                    const valText = `${d.years.toFixed(1)}y`;
                    return (
                      <li className="xp-bar" key={d.label}>
                        <span className="xp-barLabel">{d.label}</span>
                        <div className="xp-barTrack" role="img" aria-label={`${d.label}: ${valText}`}>
                          <div className="xp-barFill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="xp-barVal">{valText}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="xp-empty">— No ranks recorded —</div>
              )}
            </div>
          </div>
        )}

        {/* ===== Lista de experiencia ===== */}
        {list.length > 0 && (
          <div className="ppv-xpList" role="list">
            {list.map(it=>(
              <ExperienceCard
                key={it.id || `${it.vessel_name||it.employer||'xp'}-${it.start_year}-${it.start_month}`}
                item={it}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ExperienceCard({ item }){
  const shore = isShore(item);
  const merchant = isMerchant(item);
  const [open,setOpen]=React.useState(false);

  // Longitud (texto “NN m”) para reutilizar en header/fila
  const lengthText = useMemo(() => {
    const lenStr = loaToText(item?.loa_m || item?.length_m || item?.length);
    return lenStr ? `${lenStr} m` : '';
  }, [item]);

  // Encabezado
  const headLeft = useMemo(()=>{
    if(merchant){
      const name = item?.vessel_name || item?.vessel || item?.name || '—';
      const rank = item?.role || item?.rank || null;
      const type = item?.vessel_type || null;
      return [name, rank, type].filter(Boolean).join(' • ');
    }
    if(shore){
      const employer = item?.vessel_name || item?.vessel_or_employer || '—';
      const industry = ex(item)?.industry || null;
      const role     = item?.role || null;
      return [employer, industry, role].filter(Boolean).join(' • ');
    }
    const name = item?.vessel_name || item?.vessel || item?.name || '—';
    const role = item?.role || null;               // mostramos el cargo aquí
    const type = item?.vessel_type || null;
    return [name, role, type].filter(Boolean).join(' • ');
  },[item, shore, merchant]);

  // Fechas
  const startDate = fmtYM(item?.start_year, item?.start_month);
  const endDate   = item?.is_current ? 'Present' : fmtYM(item?.end_year, item?.end_month);

  // ======= YACHT (onboard) =======
  const row2_onboard = [
    { label: 'Length',     value: lengthText },
    { label: 'Start date', value: startDate },
    { label: 'End date',   value: endDate },
    { label: 'Use',        value: item?.mode || '' },
  ];
  const itineraryVal = str(joinArr(item?.regions));
  const brandVal = item?.yacht_brand === 'Other'
    ? (item?.yacht_brand_other || 'Other')
    : (item?.yacht_brand || '');
  const row3_onboard = [
    { label: 'Itinerary',   value: itineraryVal },
    { label: 'Brand',       value: brandVal },
    { label: 'Model',       value: item?.yacht_model || '' },
    { label: 'Management',  value: item?.management_name || '' },
  ];
  const extras = ex(item);
  const row4_onboard = [
    { label: 'Gross tonnage',   value: item?.gt ?? '' },
    { label: 'Propulsion type', value: extras?.propulsion || '' },
    { label: 'Engine brand',    value: extras?.engine_make || '' },
    { label: 'Engine power',    value: formatEnginePower(extras) },
  ];
  const row5_onboard = [
    { label: 'Terms',           value: extras?.contract || '' },
    { label: 'Crew size',       value: extras?.crew_bucket || '' },
    { label: 'Ocean crossings', value: extras?.crossings || '' },
    { label: 'Yard periods',    value: extras?.yard_period || '' },
  ];

  // ======= MERCHANT (Commercial Vessels) — layout solicitado =======
  const row_merchant_ordered = [
    { label: 'Start date',  value: startDate },
    { label: 'End date',    value: endDate },
    { label: 'Length',      value: lengthText },
    { label: 'GT',          value: item?.gt ?? '' },
    { label: 'Engine power',value: formatEnginePower(extras) },
    { label: 'Terms',       value: item?.terms || extras?.contract || '' },
    { label: 'Regions',     value: str(joinArr(item?.regions)) },
  ].filter(isFilled);

  // Merchant: 2 filas (hasta 8 ítems) colapsadas; resto expandido.
  const merchantCollapsed8 = row_merchant_ordered.slice(0, 8);
  const merchantRestOnOpen = row_merchant_ordered.slice(8);
  const collapsedRowsMerchant = chunk(merchantCollapsed8, 4);
  const expandedRowsMerchant  = chunk(merchantRestOnOpen, 4);

  const remarksText =
    str(item?.remarks || item?.notes || extras?.remarks || '');

  // ======= SHORE =======
  const row2_shore = [
    { label: 'Location',   value: ex(item)?.location_country || '' },
    { label: 'Start date', value: startDate },
    { label: 'End date',   value: endDate },
    { label: 'Contract',   value: ex(item)?.contract || '' },
  ];
  const row3_shore = [
    { label: 'Industry',   value: ex(item)?.industry || '' },
    { label: 'Role/Rank',  value: item?.role || '' },
  ];

  // ======= EMPAQUETADO GLOBAL SIN HUECOS =======
  // ONBOARD:
  const allOnboard = [...row2_onboard, ...row3_onboard, ...row4_onboard, ...row5_onboard].filter(isFilled);
  const collapsed8 = allOnboard.slice(0, 8);           // 2 filas x 4
  const restOnOpen = allOnboard.slice(8);
  const collapsedRowsOnboard = chunk(collapsed8, 4);   // filas de 4
  const expandedRowsOnboard  = chunk(restOnOpen, 4);   // filas de 4

  // SHORE: primera fila 4 cols; resto en filas de 2 cols, todo sin huecos
  const allShore = [...row2_shore, ...row3_shore].filter(isFilled);
  const shoreFirst4 = allShore.slice(0, 4);
  const shoreRest   = allShore.slice(4);
  const collapsedRowsShore = [
    ...(shoreFirst4.length ? [{ items: shoreFirst4, cols: 4 }] : []),
    ...chunk(shoreRest, 2).map(items => ({ items, cols: 2 })),
  ];

  return (
    <article className="ppv-xpCard" role="listitem">
      <header className="ppv-xpCardHead">
        <div className="ppv-xpHeadTitle">{headLeft}</div>
        <button
          className="ppv-xpToggle"
          onClick={()=>setOpen(v=>!v)}
          aria-expanded={open}
          aria-controls={`xp-body-${item.id}`}
        >
          {open ? 'Hide details' : 'Show details'}
        </button>
      </header>

      {/* COLAPSADO */}
      {merchant ? (
        <>
          {collapsedRowsMerchant.map((row, idx) => (
            <KvRow key={`mer-c-${idx}`} items={row} cols={4}/>
          ))}
        </>
      ) : !shore ? (
        <>
          {collapsedRowsOnboard.map((row, idx) => (
            <KvRow key={`onb-c-${idx}`} items={row} cols={4}/>
          ))}
        </>
      ) : (
        <>
          {collapsedRowsShore.map((r, idx) => (
            <KvRow key={`sho-${idx}`} items={r.items} cols={r.cols}/>
          ))}
        </>
      )}

      {/* EXPANDIDO */}
      <div id={`xp-body-${item.id}`} className={`ppv-xpBody ${open ? 'open' : 'closed'}`}>
        {merchant ? (
          <>
            {expandedRowsMerchant.map((row, idx) => (
              <KvRow key={`mer-e-${idx}`} items={row} cols={4}/>
            ))}
            {remarksText && (
              <KvRow
                items={[{ label: 'Remarks', value: remarksText }]}
                cols={1}
              />
            )}
          </>
        ) : !shore ? (
          <>
            {expandedRowsOnboard.map((row, idx) => (
              <KvRow key={`onb-e-${idx}`} items={row} cols={4}/>
            ))}
            {remarksText && (
              <KvRow
                items={[{ label: 'Remarks', value: remarksText }]}
                cols={1}
              />
            )}
          </>
        ) : (
          <>
            {/* Para shore: solo mostramos Remarks si hay texto */}
            {remarksText && (
              <KvRow
                items={[{ label: 'Remarks', value: remarksText }]}
                cols={1}
              />
            )}
          </>
        )}
      </div>
    </article>
  );
}

/** Dibuja puntos separadores centrados ENTRE cada par de columnas de la fila,
 *  pero usando el ancho real del CONTENIDO (label+value) de cada item,
 *  no el ancho fijo de la celda. */
function KvRow({ items=[], cols=2 }){
  const visible = (Array.isArray(items) ? items : []).filter(isFilled);
  const computedCols = Math.min(cols, Math.max(visible.length, 1)); // 1..cols
  const rowRef = useRef(null);
  const [dots, setDots] = React.useState([]);

  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const getContentBounds = (itemEl) => {
      const lab = itemEl.querySelector('.ppv-kvLabel');
      const val = itemEl.querySelector('.ppv-kvValue');
      const labR = lab ? lab.getBoundingClientRect() : null;
      const valR = val ? val.getBoundingClientRect() : null;

      if (labR && valR) {
        return {
          left:  Math.min(labR.left,  valR.left),
          right: Math.max(labR.right, valR.right),
        };
      }
      const r = itemEl.getBoundingClientRect();
      return { left: r.left, right: r.right };
    };

    const compute = () => {
      const children = Array.from(el.querySelectorAll(':scope > .ppv-kvItem'));
      if (children.length < 2) { setDots([]); return; }
      const rowRect = el.getBoundingClientRect();
      const xs = [];
      for (let i = 0; i < children.length - 1; i++) {
        const aB = getContentBounds(children[i]);
        const bB = getContentBounds(children[i + 1]);
        const mid = (aB.right + bB.left) / 2;
        xs.push(mid - rowRect.left);
      }
      setDots(xs);
    };

    const raf = requestAnimationFrame(compute);

    const ro = new ResizeObserver(() => requestAnimationFrame(compute));
    ro.observe(el);
    Array.from(el.children).forEach(ch => ro.observe(ch));

    const onResize = () => compute();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [visible.length]);

  if(!visible.length) return null;

  return (
    <div className="ppv-kvRow" data-cols={computedCols} ref={rowRef}>
      {visible.map((it,i)=>(
        <div key={i} className="ppv-kvItem">
          <span className="ppv-kvLabel">{it.label}</span>
          <span className="ppv-kvValue">{it.value}</span>
        </div>
      ))}
      {/* puntos centrados entre el contenido real de cada par */}
      {dots.map((x, i) => (
        <span
          key={`dot-${i}`}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            lineHeight: 1,
            fontSize: 16,
            opacity: 0.6,
            color: 'currentColor',
            userSelect: 'none',
          }}
        >
          •
        </span>
      ))}
    </div>
  );
}