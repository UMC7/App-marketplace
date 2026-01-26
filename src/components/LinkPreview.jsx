import React, { useState, useEffect } from 'react';
import { getLinkPreview } from 'link-preview-js';
import './link-preview.css';

export function LinkPreview({ url }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const data = await getLinkPreview(url, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        setPreview(data);
        setError(false);
      } catch (err) {
        console.warn(`Could not load preview for ${url}:`, err);
        setError(true);
        // Mostrar fallback simple
        setPreview({
          url,
          title: new URL(url).hostname,
          description: 'Click to open link',
          image: null,
        });
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchPreview();
    }
  }, [url]);

  if (loading) {
    return (
      <div className="link-preview-loading">
        <div className="link-preview-spinner"></div>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  const { title, description, image, url: linkUrl } = preview;
  const displayUrl = new URL(linkUrl || url).hostname;

  return (
    <a
      href={linkUrl || url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-preview-card"
    >
      {image && (
        <div className="link-preview-image">
          <img src={image} alt={title} onError={(e) => (e.target.style.display = 'none')} />
        </div>
      )}
      <div className="link-preview-content">
        <div className="link-preview-title">{title || 'Link'}</div>
        {description && <div className="link-preview-description">{description}</div>}
        <div className="link-preview-domain">{displayUrl}</div>
      </div>
    </a>
  );
}

/**
 * Función utilitaria para detectar URLs en texto
 */
export function extractUrls(text) {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches)]; // Remover duplicados
}

/**
 * Función para renderizar texto con URLs convertidas a previews
 */
export function renderTextWithPreviews(text) {
  const urls = extractUrls(text);

  if (urls.length === 0) {
    return null; // Sin URLs, dejar que renderMessageText lo maneje
  }

  // Dividir el texto en partes (URL y no-URL)
  let lastIndex = 0;
  const elements = [];

  // Regex para encontrar URLs
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  let match;
  const matches = [];

  // Colectar todas las coincidencias
  while ((match = urlRegex.exec(text)) !== null) {
    matches.push(match);
  }

  // Procesar el texto
  if (matches.length === 0) {
    return null;
  }

  // Si hay URLs, renderizar normalmente pero después agregar previews
  return urls.map((url, idx) => <LinkPreview key={`preview-${idx}`} url={url} />);
}
