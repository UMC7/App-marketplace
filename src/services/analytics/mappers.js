// src/services/analytics/mappers.js

/**
 * Mappers puros (sin dependencias) para normalizar respuestas
 * de RPC/tablas a estructuras de UI seguras.
 * Todos son "defensive": aceptan null/shape inesperado.
 */

export function toOverview(row) {
  const r = row || {};
  return {
    views: Number(r.views ?? 0),
    unique_viewers: Number(r.unique_viewers ?? 0),
    contact_opens: Number(r.contact_opens ?? 0),
    chat_starts: Number(r.chat_starts ?? 0),
    cv_downloads: Number(r.cv_downloads ?? 0),
  };
}

export function toTrends(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((r) => ({
    date: String(r.date ?? r.bucket ?? '').slice(0, 10),
    views: Number(r.views ?? 0),
    unique_viewers: Number(r.unique_viewers ?? 0),
  }));
}

export function toReferrers(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((r) => ({
    source: String(r.source ?? r.referrer ?? 'Direct'),
    views: Number(r.views ?? 0),
    unique_viewers: Number(r.unique_viewers ?? 0),
    pct: Number(r.pct ?? r.percentage ?? 0),
  }));
}

export function toGeography(data) {
  const countries = Array.isArray(data?.countries) ? data.countries : [];
  const cities = Array.isArray(data?.cities) ? data.cities : [];
  return {
    countries: countries.map((r) => ({
      country: String(r.country ?? r.cc ?? ''),
      views: Number(r.views ?? 0),
    })),
    cities: cities.map((r) => ({
      city: String(r.city ?? ''),
      country: String(r.country ?? r.cc ?? ''),
      views: Number(r.views ?? 0),
    })),
  };
}

export function toDevices(data) {
  const devices = Array.isArray(data?.devices) ? data.devices : [];
  const browsers = Array.isArray(data?.browsers) ? data.browsers : [];
  return {
    devices: devices.map((r) => ({
      device: String(r.device ?? r.platform ?? ''),
      views: Number(r.views ?? 0),
    })),
    browsers: browsers.map((r) => ({
      browser: String(r.browser ?? ''),
      views: Number(r.views ?? 0),
    })),
  };
}

export function toFunnel(row) {
  const r = row || {};
  return {
    views: Number(r.views ?? r.profile_views ?? 0),
    profile_opens: Number(r.profile_opens ?? r.views ?? 0),
    contact_opens: Number(r.contact_opens ?? 0),
    chat_starts: Number(r.chat_starts ?? 0),
    cv_downloads: Number(r.cv_downloads ?? 0),
  };
}