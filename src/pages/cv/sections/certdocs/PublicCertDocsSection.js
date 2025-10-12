// src/pages/cv/sections/certdocs/PublicCertDocsSection.js
import React, { useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import supabase from '../../../../supabase';
import BasicDocsSummary from './BasicDocsSummary';

const BUCKET = 'cv-docs';

/* ------------------------------ Helpers ------------------------------ */
function inferExt(u = '') {
  const s = String(u).toLowerCase();
  if (s.includes('?')) return s.split('?')[0].split('.').pop() || '';
  return s.split('.').pop() || '';
}
function isPdf(u)  { return inferExt(u) === 'pdf'; }
function isVideo(u){ return /(?:mp4|webm|mov|m4v|avi|mkv)$/i.test(inferExt(u)); }
function isImage(u){ return /(?:png|jpe?g|gif|webp|bmp|tiff?)$/i.test(inferExt(u)); }

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(+date)) return '';
  const hasDay = /\d{4}-\d{2}-\d{2}/.test(String(d));
  const opts = hasDay
    ? { year: 'numeric', month: 'short', day: '2-digit' }
    : { year: 'numeric', month: 'short' };
  return date.toLocaleDateString(undefined, opts);
}

/** Normaliza el tipo para ordenar por prioridad */
function canonicalType(doc) {
  const t = (doc?.type || '').toString().toLowerCase();
  const title = (doc?.title || '').toString().toLowerCase();
  const has = (re) => re.test(t) || re.test(title);

  if (has(/passport/)) return 'passport';
  if (has(/visa|residen/)) return 'visa';
  if (has(/seamen|seaman[’']?s.*\bbook\b|discharge\s*book|seafarer/)) return 'seamanbook';
  if (has(/stcw|pssr|pbst|bst|crowd|fire\s*fighting|survival|proficiency|pdsd/)) return 'stcw';
  if (has(/eng\s*1/)) return 'eng1';
  if (has(/\bcoc\b|certificate of competency/)) return 'coc';
  if (has(/\bgoc\b|general operator/)) return 'goc';
  if (has(/yacht\s*master|yachtmaster/)) return 'yachtmaster';
  return 'other';
}
const ORDER = ['passport','visa','seamanbook','stcw','eng1','coc','goc','yachtmaster','other'];
function priorityOf(doc) {
  const key = canonicalType(doc);
  const idx = ORDER.indexOf(key);
  return idx === -1 ? ORDER.length : idx;
}

/** Quita transforms de Supabase (thumbs/resize) y conserva otros params (p.ej. token) */
function toOriginalSupabaseUrl(u) {
  if (!u) return u;
  try {
    const url = new URL(u);
    const isSupabaseRender = url.pathname.includes('/storage/v1/render/image/');
    const isSupabaseObject = url.pathname.includes('/storage/v1/object/');
    if (isSupabaseRender || isSupabaseObject) {
      if (isSupabaseRender) {
        url.pathname = url.pathname.replace('/render/image', '/object');
      }
      const drop = new Set(['width','height','resize','quality','format','fit','position']);
      const keep = [];
      url.searchParams.forEach((v,k) => { if (!drop.has(k)) keep.push([k,v]); });
      url.search = keep.length ? ('?' + keep.map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')) : '';
      return url.toString();
    }
    return u;
  } catch {
    return u;
  }
}

/* ------------------------------ Component ------------------------------ */
export default function PublicCertDocsSection({
  documents = [],
  title = 'CERTIFICATION & DOCUMENTS',
}) {
  // Modal viewer
  const [viewer, setViewer] = useState({ open: false, url: '', title: '' });

  // Ordenar por prioridad y luego por fechas (más próximos primero)
  const sorted = useMemo(() => {
    const list = Array.isArray(documents) ? [...documents] : [];
    return list.sort((a, b) => {
      const pa = priorityOf(a), pb = priorityOf(b);
      if (pa !== pb) return pa - pb;
      const ax = a.expires_on ? new Date(a.expires_on).getTime() : Infinity;
      const bx = b.expires_on ? new Date(b.expires_on).getTime() : Infinity;
      if (ax !== bx) return ax - bx;
      const ac = a.created_at ? +new Date(a.created_at) : 0;
      const bc = b.created_at ? +new Date(b.created_at) : 0;
      return bc - ac;
    });
  }, [documents]);

  // ---- Mostrar solo 5 ítems visibles y hacer scroll para el resto ----
  const needsScroll = sorted.length > 5;
  const listRef = useRef(null);
  const [maxListH, setMaxListH] = useState(null);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => {
      const items = el.querySelectorAll('.ppv-docItem');
      if (!items.length) { setMaxListH(null); return; }
      const first = items[0];
      const last  = items[Math.min(4, items.length - 1)];
      const h = (last.offsetTop + last.offsetHeight) - first.offsetTop; // alto de 5 ítems
      setMaxListH(needsScroll ? Math.max(0, h) : null);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    window.addEventListener('resize', measure);
    const id = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [needsScroll, sorted.length]);

  const openDoc = useCallback(async (doc) => {
    if (!doc) return;
    let url = '';
    const path = String(doc.file_url || '');
    if (!path) return;

    if (/^https?:\/\//i.test(path)) {
      url = toOriginalSupabaseUrl(path);
    } else if (path.startsWith(`${BUCKET}/`)) {
      const objectKey = path.replace(`${BUCKET}/`, '');
      try {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(objectKey, 3600);
        if (!error) url = data?.signedUrl || '';
      } catch { /* ignore */ }
    } else {
      try {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
        if (!error) url = data?.signedUrl || '';
      } catch { /* ignore */ }
    }

    if (!url) {
      window.open(path, '_blank', 'noopener,noreferrer');
      return;
    }
    url = toOriginalSupabaseUrl(url);
    setViewer({ open: true, url, title: doc.title || 'Document' });
  }, []);

  if (!sorted.length) return null;

  return (
    // ⬇️ Agregamos la clase de contenedor de tarjeta para igualarlo a otras secciones
    <section className="ppv-docs ppv-section" aria-label="Certification & Documents">
      <div className="ppv-docsInner">
        {/* Título */}
        <div className="ppv-sectionTitleWrap">
          <h2
            className="ppv-sectionTitle"
            style={{ color: '#0b1220', opacity: 1, mixBlendMode: 'normal', textShadow: 'none' }}
          >
            {title}
          </h2>
        </div>

        <BasicDocsSummary documents={sorted} />
        
        {/* Lista con scroll interno: solo 5 visibles a la vez */}
        <ul
          className="ppv-docList"
          role="list"
          ref={listRef}
          style={{
            marginTop: 6,
            maxHeight: maxListH != null ? `${maxListH}px` : undefined,
            overflowY: maxListH != null ? 'auto' : 'visible',
          }}
        >
          {sorted.map((doc) => {
            const expText = fmtDate(doc.expires_on) || '—';
            return (
              <li
                key={doc.id || doc.file_url || doc.title}
                className="ppv-docItem"
                role="listitem"
              >
                <span className="ppv-docBullet" aria-hidden="true">•</span>
                <span className="ppv-docTitle" title={doc.title || 'Untitled document'}>
                  {doc.title || 'Untitled document'}
                </span>
                <div className="ppv-docExp">
                  <span className="ppv-kvLabel">EXP. DATE</span>
                  <span className="ppv-kvValue">{expText}</span>
                </div>
                <button
                  className="ppv-docOpenBtn"
                  onClick={() => openDoc(doc)}
                  title="View scan"
                  aria-label={`View ${doc.title || 'document'}`}
                >
                  🔍
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* -------- Modal simple para vista del documento -------- */}
      {viewer.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="ppv-docModal"
          onClick={() => setViewer({ open: false, url: '', title: '' })}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 50,
          }}
        >
          <div
            className="ppv-docModalCard"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              width: 'min(920px, 96vw)',
              height: 'min(86vh, 920px)',
              borderRadius: 12,
              boxShadow: '0 12px 34px rgba(2,6,23,.4)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* X para cerrar */}
            <button
              onClick={() => setViewer({ open: false, url: '', title: '' })}
              aria-label="Close"
              title="Close"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,.12)',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,.08)',
                zIndex: 2
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>×</span>
            </button>

            <div
              className="ppv-docModalHead"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '10px 12px',
                borderBottom: '1px solid rgba(0,0,0,.12)',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={viewer.title}
              >
                {viewer.title}
              </div>
              <button
                className="ppv-docOpenBtn"
                onClick={() => setViewer({ open: false, url: '', title: '' })}
              >
                Close
              </button>
            </div>

            <div style={{ flex: 1, background: '#0b122006', display: 'flex' }}>
              {isPdf(viewer.url) ? (
                <iframe
                  title="Document"
                  src={viewer.url}
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              ) : isImage(viewer.url) && !isVideo(viewer.url) ? (
                <div
                  role="img"
                  aria-label="Document"
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url("${String(viewer.url).replace(/"/g, '\\"')}")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center center',
                    backgroundSize: 'contain',
                  }}
                />
              ) : (
                <div style={{ padding: 16 }}>
                  <p>
                    Preview not available.{` `}
                    <a href={viewer.url} target="_blank" rel="noreferrer">Open in new tab</a>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}