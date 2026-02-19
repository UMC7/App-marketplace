// src/pages/cv/sections/media/PublicMediaGallerySection.jsx
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './PublicMediaGallerySection.css';

function inferType(u = '', explicit) {
  if (explicit) return explicit;
  const s = String(u).toLowerCase();
  return /\.(mp4|webm|mov|m4v|avi|mkv)$/.test(s) ? 'video' : 'image';
}
function isHeicUrl(u = '') {
  const s = String(u).toLowerCase();
  const clean = s.split('?')[0].split('#')[0];
  return clean.endsWith('.heic') || clean.endsWith('.heif');
}
function getThumbUrl(u = '') { return u; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function Lightbox({ open, item, onClose }) {
  const isVideo = item?.type === 'video';

  useEffect(() => {
    if (!open) return;

    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
    }

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    (
      <div className="pmg-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
        <div className="pmg-lightbox-inner" onClick={(e)=>e.stopPropagation()}>
          <button className="pmg-lightbox-close" onClick={onClose} aria-label="Close">✕</button>
          {isVideo ? (
            <video
              className="pmg-lightbox-media"
              src={item.url}
              controls
              playsInline
              controlsList="nodownload"
            />
          ) : (
            <img className="pmg-lightbox-media" src={item.url} alt="" />
          )}
        </div>
      </div>
    ),
    document.body
  );
}

export default function PublicMediaGallerySection({
  title = 'MEDIA',
  gallery = [],
  maxItems = 14,
  emptyText = 'No media uploaded yet.',
}) {
  const items = useMemo(() => {
    const src = Array.isArray(gallery) ? gallery : [];
    const mapped = src
      .map((g) => {
        if (!g) return null;
        if (typeof g === 'string') return { url: g, type: inferType(g) };
        const url = g.url || g.file_url || g.publicUrl || '';
        if (!url) return null;
        return { ...g, url, type: inferType(url, g.type) };
      })
      .filter(Boolean);
    return mapped.slice(0, maxItems);
  }, [gallery, maxItems]);

  const [active, setActive] = useState(Math.min(Math.floor(items.length/2), Math.max(0, items.length-1)));
  const trackRef = useRef(null);
  const [thumbs, setThumbs] = useState({});

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') setActive((i)=>clamp(i-1,0,items.length-1));
      if (e.key === 'ArrowRight') setActive((i)=>clamp(i+1,0,items.length-1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length]);

  useEffect(() => {
    let alive = true;
    const newThumbs = {};
    const urlsToRevoke = [];

    const run = async () => {
      const heicItems = items.filter((it) => it?.type === 'image' && isHeicUrl(it.url));
      if (!heicItems.length) {
        setThumbs({});
        return;
      }

      try {
        const mod = await import('heic2any');
        const heic2any = mod?.default || mod;

        await Promise.all(
          heicItems.map(async (it) => {
            try {
              const res = await fetch(it.url);
              const blob = await res.blob();
              const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.9 });
              const outBlob = Array.isArray(converted) ? converted[0] : converted;
              const objectUrl = URL.createObjectURL(outBlob);
              newThumbs[it.url] = objectUrl;
              urlsToRevoke.push(objectUrl);
            } catch {
              newThumbs[it.url] = '';
            }
          })
        );
      } catch {
        heicItems.forEach((it) => {
          newThumbs[it.url] = '';
        });
      }

      if (alive) {
        setThumbs(newThumbs);
      } else {
        urlsToRevoke.forEach((u) => URL.revokeObjectURL(u));
      }
    };

    run();

    return () => {
      alive = false;
      Object.values(thumbs || {}).forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, [items]);

  const [lbOpen, setLbOpen] = useState(false);
  const [lbItem, setLbItem] = useState(null);
  const openLb = useCallback((it)=>{ setLbItem(it); setLbOpen(true); },[]);
  const closeLb = useCallback(()=>{ setLbOpen(false); setLbItem(null); },[]);

  const titleStyle = {
    color: '#0b1220',
    opacity: 1,
    mixBlendMode: 'normal',
    textShadow: 'none',
  };

  if (!items.length) {
    return (
      <section className="pmg-section" aria-label="Media">
        <div className="pmg-head">
          <h3 className="pmg-title" style={titleStyle}>{title}</h3>
        </div>
        <div className="pmg-empty">{emptyText}</div>
      </section>
    );
  }

  return (
    <section className="pmg-section" aria-label="Media">
      <div className="pmg-head">
        <h3 className="pmg-title" style={titleStyle}>{title}</h3>
      </div>

      <div className="pmg-coverflow" role="listbox" aria-label="Media carousel">
        <button
          className="pmg-nav pmg-prev"
          onClick={() => setActive((i)=>clamp(i-1,0,items.length-1))}
          aria-label="Previous"
        >‹</button>

        <div className="pmg-track" ref={trackRef}>
          {items.map((it, i) => {
            const offset = i - active;
            const abs = Math.abs(offset);
            const rotateY = clamp(offset * 22, -66, 66);
            const translateZ = 280 - abs * 60;
            const translateX = offset * 140;
            const scale = abs === 0 ? 1.0 : 0.92 - abs * 0.04;

            const style = {
              transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
              zIndex: 1000 - abs,
              opacity: 1 - abs * 0.12,
            };

            const isVideo = it.type === 'video';

            return (
              <button
                key={i}
                className={`pmg-card ${abs===0 ? 'is-active' : ''}`}
                style={style}
                onClick={() => openLb(it)}
                role="option"
                aria-selected={abs===0}
                title={isVideo ? 'Play video' : 'View photo'}
              >
                {isVideo && <span className="pmg-badgeVideo">▶</span>}
                {isVideo ? (
                  <video src={it.url} preload="metadata" muted playsInline />
                ) : (
                  <img
                    src={thumbs[it.url] || getThumbUrl(it.url)}
                    loading="lazy"
                    alt=""
                    draggable="false"
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          className="pmg-nav pmg-next"
          onClick={() => setActive((i)=>clamp(i+1,0,items.length-1))}
          aria-label="Next"
        >›</button>
      </div>

      <div className="pmg-dots" role="tablist" aria-label="Slides">
        {items.map((_, i)=>(
          <button
            key={i}
            className={`pmg-dot ${i===active?'is-on':''}`}
            onClick={()=>setActive(i)}
            aria-label={`Go to item ${i+1}`}
            aria-selected={i===active}
            role="tab"
          />
        ))}
      </div>

      <Lightbox open={lbOpen} item={lbItem} onClose={closeLb} />
    </section>
  );
}
