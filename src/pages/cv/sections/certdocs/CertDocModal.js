// src/pages/cv/sections/certdocs/CertDocModal.js
import React, { useEffect, useMemo, useRef } from 'react';

function ext(url = '') {
  const s = String(url).split('?')[0].toLowerCase();
  const i = s.lastIndexOf('.');
  return i >= 0 ? s.slice(i + 1) : '';
}
function isPdf(url)   { return ext(url) === 'pdf'; }
function isImage(url) { return /(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(ext(url)); }
function isVideo(url) { return /(mp4|webm|mov|m4v|avi|mkv)$/i.test(ext(url)); }

export default function CertDocModal({ open, onClose, src, title = 'Document' }) {
  const cardRef = useRef(null);
  const prevFocus = useRef(null);

  // Close helpers
  const close = () => { if (typeof onClose === 'function') onClose(); };

  // Lock scroll + esc to close + basic focus management
  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') close();

      if (e.key === 'Tab') {
        // very small focus trap
        const root = cardRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll(
          'a[href],button:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    // focus the close button (or card) on open
    const btn = cardRef.current?.querySelector('button');
    (btn || cardRef.current)?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (prevFocus.current && prevFocus.current.focus) {
        prevFocus.current.focus({ preventScroll: true });
      }
    };
  }, [open]);

  const kind = useMemo(() => {
    if (isPdf(src)) return 'pdf';
    if (isImage(src)) return 'image';
    if (isVideo(src)) return 'other'; // not previewed here
    return 'other';
  }, [src]);

  if (!open) return null;

  const titleId = 'certdoc-modal-title';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="ppv-docModal"
      onClick={close}
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
        ref={cardRef}
        className="ppv-docModalCard"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        style={{
          background: '#fff',
          width: 'min(920px, 96vw)',
          height: 'min(86vh, 920px)',
          borderRadius: 12,
          boxShadow: '0 12px 34px rgba(2,6,23,.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        {/* Header */}
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
            id={titleId}
            style={{
              fontWeight: 700,
              fontSize: 14,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={title}
          >
            {title}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {src && (
              <a
                className="ppv-btn"
                href={src}
                target="_blank"
                rel="noreferrer"
              >
                Open in new tab
              </a>
            )}
            <button className="ppv-btn" onClick={close} aria-label="Close document viewer">
              Close
            </button>
          </div>
        </div>

        {/* Viewer */}
        <div style={{ flex: 1, position: 'relative', background: '#0b122006' }}>
          {kind === 'pdf' ? (
            <iframe title="Document" src={src} style={{ width: '100%', height: '100%', border: 0 }} />
          ) : kind === 'image' ? (
            <img
              alt="Document"
              src={src}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <div style={{ padding: 16 }}>
              <p>
                Preview not available for this file type.{' '}
                {src ? (
                  <a href={src} target="_blank" rel="noreferrer">
                    Open in new tab
                  </a>
                ) : (
                  'No source provided.'
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}