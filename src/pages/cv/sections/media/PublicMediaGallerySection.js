// src/pages/cv/sections/media/PublicMediaGallerySection.jsx
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import './PublicMediaGallerySection.css';

function inferType(u = '', explicit) {
  if (explicit) return explicit;
  const s = String(u).toLowerCase();
  return /\.(mp4|webm|mov|m4v|avi|mkv)$/.test(s) ? 'video' : 'image';
}
function getThumbUrl(u = '') { return u; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function Lightbox({ open, item, onClose }) {
  if (!open) return null;
  const isVideo = item?.type === 'video';
  return (
    <div className="pmg-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="pmg-lightbox-inner" onClick={(e)=>e.stopPropagation()}>
        <button className="pmg-lightbox-close" onClick={onClose} aria-label="Close">✕</button>
        {isVideo ? (
          <video className="pmg-lightbox-media" src={item.url} controls playsInline controlsList="nodownload" />
        ) : (
          <img className="pmg-lightbox-media" src={item.url} alt="" />
        )}
      </div>
    </div>
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

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') setActive((i)=>clamp(i-1,0,items.length-1));
      if (e.key === 'ArrowRight') setActive((i)=>clamp(i+1,0,items.length-1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length]);

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
                <img src={getThumbUrl(it.url)} loading="lazy" alt="" draggable="false" />
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