// src/pages/cv/sections/references/PublicReferencesSection.js
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect, useCallback } from 'react';
import supabase from '../../../../supabase';
import CertDocModal from '../certdocs/CertDocModal';
import { listReferencesByProfile } from '../../../../components/cv/candidate/sectionscomponents/references';

const BUCKET = 'cv-docs';

function fmt(s) {
  const t = String(s || '').trim();
  return t || '—';
}
function mailtoLink(e) {
  const t = String(e || '').trim();
  return t ? `mailto:${t}` : null;
}

// Igual que en CertDocs: limpiar transform params de Supabase si los hubiera
function toOriginalSupabaseUrl(u) {
  if (!u) return u;
  try {
    const url = new URL(u);
    const isRender = url.pathname.includes('/storage/v1/render/image/');
    const isObject = url.pathname.includes('/storage/v1/object/');
    if (isRender || isObject) {
      if (isRender) url.pathname = url.pathname.replace('/render/image', '/object');
      const drop = new Set(['width', 'height', 'resize', 'quality', 'format', 'fit', 'position']);
      const keep = [];
      url.searchParams.forEach((v, k) => { if (!drop.has(k)) keep.push([k, v]); });
      url.search = keep.length
        ? ('?' + keep.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'))
        : '';
      return url.toString();
    }
    return u;
  } catch {
    return u;
  }
}

export default function PublicReferencesSection({
  references = [],
  profileId,
  title = 'REFERENCES',
}) {
  // Datos via prop o carga interna
  const provided = useMemo(
    () => (Array.isArray(references) ? references.filter(Boolean) : []),
    [references]
  );
  const providedLen = provided.length;

  const [fetched, setFetched] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (providedLen > 0 || !profileId) { if (!cancelled) setFetched([]); return; }
      setLoading(true);
      try {
        const rows = await listReferencesByProfile(profileId);
        if (!cancelled) setFetched(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setFetched([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, providedLen]);

  // Lista final y normalización de campos (nombres distintos en DB)
  const list = useMemo(() => {
    const src = providedLen > 0 ? provided : fetched;
    return (src || []).map((r) => ({
      id: r.id,
      name: r.name || 'Reference',
      vessel_company: r.vessel_company || r.organization || r.company || '',
      role: r.role || r.position || '',
      email: r.email || r.contact_email || '',
      phone: r.phone || r.contact_phone || '',
      // 🔑 usamos el path real guardado en storage
      attachment_path: r.attachment_path || null,
      title: r.attachment_name || r.title || r.name || 'Reference document',
    }));
  }, [provided, fetched, providedLen]);

  // Scroll interno (máx. 3 ítems)
  const listRef = useRef(null);
  const [maxListH, setMaxListH] = useState(null);
  const needsScroll = list.length > 3;

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => {
      const items = el.querySelectorAll('.ppv-docItem');
      if (!items.length) { setMaxListH(null); return; }
      const first = items[0];
      const last  = items[Math.min(2, items.length - 1)];
      const h = (last.offsetTop + last.offsetHeight) - first.offsetTop;
      setMaxListH(needsScroll ? Math.max(0, h) : null);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach(c => ro.observe(c));
    window.addEventListener('resize', measure);
    const id = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [needsScroll, list.length]);

  // ===== Modal (mismo flujo que en CertDocs) =====
  const [viewer, setViewer] = useState({ open: false, url: '', title: '' });

  const openAttachment = useCallback(async (refItem) => {
    const path = String(refItem?.attachment_path || '');
    if (!path) return;

    let url = '';
    try {
      // Firmamos el objeto del bucket con Supabase
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 3600);
      if (!error) url = data?.signedUrl || '';
    } catch {
      /* ignore */
    }

    if (!url) return; // no forzamos abrir nueva pestaña si no hay URL válida
    url = toOriginalSupabaseUrl(url);
    setViewer({ open: true, url, title: refItem?.title || refItem?.name || 'Document' });
  }, []);

  return (
    // ⬅️ ahora también tiene la clase de tarjeta/contendor
    <section id="ppv-refs" className="ppv-docs ppv-section" aria-label="References">
      <div className="ppv-docsInner">
        <div className="ppv-sectionTitleWrap">
          <h2
            className="ppv-sectionTitle"
            style={{ color: '#0b1220', opacity: 1, mixBlendMode: 'normal', textShadow: 'none' }}
          >
            {title}
          </h2>
        </div>

        {loading && list.length === 0 ? (
          <div
            className="ppv-card"
            style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', fontSize: 14 }}
          >
            Loading…
          </div>
        ) : list.length === 0 ? (
          <div
            className="ppv-card"
            style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', fontSize: 14 }}
          >
            No references added yet.
          </div>
        ) : (
          <ul
            className="ppv-docList"
            role="list"
            ref={listRef}
            style={{
              marginTop: 6,
              maxWidth: 900,
              marginInline: 'auto',
              maxHeight: maxListH != null ? `${maxListH}px` : undefined,
              overflowY: maxListH != null ? 'auto' : 'visible',
            }}
          >
            {list.map((r) => {
              const hasAttachment = !!r.attachment_path;
              const mailto = mailtoLink(r.email);
              return (
                <li
                  key={r.id || r.name}
                  className="ppv-docItem"
                  role="listitem"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    border: '1px solid rgba(0,0,0,.08)',
                    borderRadius: 12,
                    background: '#fff',
                    marginBottom: 10,
                  }}
                >
                  <span className="ppv-docBullet" aria-hidden="true" style={{ paddingLeft: 6 }}>•</span>

                  <div style={{ minWidth: 0 }}>
                    <div
                      className="ppv-docTitle"
                      title={r.name}
                      style={{ fontWeight: 700, marginBottom: 6 }}
                    >
                      {r.name}
                    </div>

                    {/* 4 columnas: label arriba / valor abajo */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))',
                        gap: 10,
                        alignItems: 'start',
                      }}
                    >
                      <div>
                        <div style={lbl}>Vessel / Company</div>
                        <div style={val}>{fmt(r.vessel_company)}</div>
                      </div>
                      <div>
                        <div style={lbl}>Role</div>
                        <div style={val}>{fmt(r.role)}</div>
                      </div>
                      <div>
                        <div style={lbl}>Email</div>
                        <div style={val}>{mailto ? <a href={mailto}>{r.email}</a> : fmt(r.email)}</div>
                      </div>
                      <div>
                        <div style={lbl}>Phone</div>
                        <div style={val}>{fmt(r.phone)}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    className="ppv-docOpenBtn"
                    title={hasAttachment ? 'Open attached document' : 'No attachment'}
                    aria-label={hasAttachment ? `Open attachment of ${r.name}` : 'No attachment'}
                    onClick={() => hasAttachment && openAttachment(r)}
                    disabled={!hasAttachment}
                    style={{
                      borderRadius: 10,
                      padding: '6px 8px',
                      border: '1px solid rgba(0,0,0,.18)',
                      background: '#f3f4f6',
                      cursor: hasAttachment ? 'pointer' : 'not-allowed',
                      opacity: hasAttachment ? 1 : .6,
                    }}
                  >
                    🔍
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal EXACTO al de CertDocs */}
      <CertDocModal
        open={viewer.open}
        onClose={() => setViewer({ open: false, url: '', title: '' })}
        src={viewer.url}
        title={viewer.title}
      />
    </section>
  );
}

const lbl = {
  fontSize: 12,
  letterSpacing: '.12em',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: '#334155',
  marginBottom: 2,
  textAlign: 'left',
};
const val = { fontSize: 14 };