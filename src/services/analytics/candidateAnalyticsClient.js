// src/services/analytics/candidateAnalyticsClient.js
import supabase from '../../supabase';

/**
 * Cliente de analíticas para el CV del candidato.
 * Nota: todas las funciones son "fault-tolerant". Si la RPC/tablas aún no existen,
 * devuelven estructuras vacías/seguras para evitar errores en la UI.
 */

function toIsoDate(d) {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10); // YYYY-MM-DD
}

function safeData(res, fallback) {
  if (!res || typeof res !== 'object') return fallback;
  const { data, error } = res;
  if (error) return fallback;
  return (data ?? fallback) || fallback;
}

/**
 * Overview (totales del periodo)
 * Retorna: { views, unique_viewers, contact_opens, chat_starts, cv_downloads }
 */
export async function fetchOverview({ handle, userId, from, to } = {}) {
  const params = {
    handle_in: handle || null,
    user_id_in: userId || null,
    date_from: toIsoDate(from),
    date_to: toIsoDate(to),
  };

  try {
    const res = await supabase.rpc('rpc_cv_analytics_overview', params);
    const row =
      safeData(res, null) ||
      null;

    return {
      views: Number(row?.views ?? 0),
      unique_viewers: Number(row?.unique_viewers ?? 0),
      contact_opens: Number(row?.contact_opens ?? 0),
      chat_starts: Number(row?.chat_starts ?? 0),
      cv_downloads: Number(row?.cv_downloads ?? 0),
    };
  } catch {
    return {
      views: 0,
      unique_viewers: 0,
      contact_opens: 0,
      chat_starts: 0,
      cv_downloads: 0,
    };
  }
}

/**
 * Tendencias por día/semana.
 * Retorna: Array<{ date:'YYYY-MM-DD', views:number, unique_viewers:number }>
 */
export async function fetchTrends({ handle, userId, from, to, bucket = 'day' } = {}) {
  const params = {
    handle_in: handle || null,
    user_id_in: userId || null,
    date_from: toIsoDate(from),
    date_to: toIsoDate(to),
    bucket_in: bucket, // 'day' | 'week' | 'month'
  };

  try {
    const res = await supabase.rpc('rpc_cv_analytics_trends', params);
    const list = safeData(res, []);
    return (Array.isArray(list) ? list : []).map((r) => ({
      date: String(r.date || r.bucket || '').slice(0, 10),
      views: Number(r.views ?? 0),
      unique_viewers: Number(r.unique_viewers ?? 0),
    }));
  } catch {
    return [];
  }
}

/**
 * Orígenes / Referers.
 * Retorna: Array<{ source:string, views:number, unique_viewers:number, pct:number }>
 */
export async function fetchReferrers({ handle, userId, from, to, limit = 10 } = {}) {
  const params = {
    handle_in: handle || null,
    user_id_in: userId || null,
    date_from: toIsoDate(from),
    date_to: toIsoDate(to),
    limit_in: limit,
  };

  try {
    const res = await supabase.rpc('rpc_cv_analytics_referrers', params);
    const list = safeData(res, []);
    return (Array.isArray(list) ? list : []).map((r) => ({
      source: String(r.source ?? r.referrer ?? 'Direct'),
      views: Number(r.views ?? 0),
      unique_viewers: Number(r.unique_viewers ?? 0),
      pct: Number(r.pct ?? r.percentage ?? 0),
    }));
  } catch {
    return [];
  }
}

/**
 * Geografía (país/ciudad).
 * Retorna: { countries: Array<{ country:string, views:number }>, cities: Array<{ city:string, country?:string, views:number }> }
 */
export async function fetchGeography({ handle, userId, from, to, limit = 10 } = {}) {
  const base = { countries: [], cities: [] };
  const params = {
    handle_in: handle || null,
    user_id_in: userId || null,
    date_from: toIsoDate(from),
    date_to: toIsoDate(to),
    limit_in: limit,
  };

  try {
    const res = await supabase.rpc('rpc_cv_analytics_geography', params);
    const data = safeData(res, base) || base;

    const countries = Array.isArray(data.countries) ? data.countries : [];
    const cities = Array.isArray(data.cities) ? data.cities : [];

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
  } catch {
    return base;
  }
}

/**
 * Dispositivos/Navegadores.
 * Retorna: { devices: Array<{ device:string, views:number }>, browsers: Array<{ browser:string, views:number }> }
 */
export async function fetchDevices({ handle, userId, from, to } = {}) {
  const base = { devices: [], browsers: [] };
  const params = {
    handle_in: handle || null,
    user_id_in: userId || null,
    date_from: toIsoDate(from),
    date_to: toIsoDate(to),
  };

  try {
    const res = await supabase.rpc('rpc_cv_analytics_devices', params);
    const data = safeData(res, base) || base;

    return {
      devices: (Array.isArray(data.devices) ? data.devices : []).map((r) => ({
        device: String(r.device ?? r.platform ?? ''),
        views: Number(r.views ?? 0),
      })),
      browsers: (Array.isArray(data.browsers) ? data.browsers : []).map((r) => ({
        browser: String(r.browser ?? ''),
        views: Number(r.views ?? 0),
      })),
    };
  } catch {
    return base;
  }
}

/**
 * Funnel de acciones.
 * Retorna: { views, profile_opens, contact_opens, chat_starts, cv_downloads }
 */
export async function fetchFunnel({ handle, userId, from, to } = {}) {
  const params = {
    handle_in: handle || null,
    user_id_in: userId || null,
    date_from: toIsoDate(from),
    date_to: toIsoDate(to),
  };

  try {
    const res = await supabase.rpc('rpc_cv_analytics_funnel', params);
    const row = safeData(res, null) || null;

    return {
      views: Number(row?.views ?? row?.profile_views ?? 0),
      profile_opens: Number(row?.profile_opens ?? row?.views ?? 0),
      contact_opens: Number(row?.contact_opens ?? 0),
      chat_starts: Number(row?.chat_starts ?? 0),
      cv_downloads: Number(row?.cv_downloads ?? 0),
    };
  } catch {
    return {
      views: 0,
      profile_opens: 0,
      contact_opens: 0,
      chat_starts: 0,
      cv_downloads: 0,
    };
  }
}

const candidateAnalyticsClient = {
  fetchOverview,
  fetchTrends,
  fetchReferrers,
  fetchGeography,
  fetchDevices,
  fetchFunnel,
};

export default candidateAnalyticsClient;