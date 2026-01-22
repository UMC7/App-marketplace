// src/components/cv/analytics/GeographyBreakdown.js
import React, { useEffect, useMemo, useState } from 'react';
import { formatInt } from '../../../utils/analytics/formatters';

const REGION_CODES = [
  'AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ','BS','BH','BD','BB',
  'BY','BE','BZ','BJ','BM','BT','BO','BQ','BA','BW','BV','BR','IO','BN','BG','BF','BI','CV','KH','CM',
  'CA','KY','CF','TD','CL','CN','CX','CC','CO','KM','CG','CD','CK','CR','CI','HR','CU','CW','CY','CZ',
  'DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FK','FO','FJ','FI','FR','GF','PF','TF',
  'GA','GM','GE','DE','GH','GI','GR','GL','GD','GP','GU','GT','GG','GN','GW','GY','HT','HM','VA','HN',
  'HK','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP','KR',
  'KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY','MV','ML','MT','MH','MQ',
  'MR','MU','YT','MX','FM','MD','MC','MN','ME','MS','MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI',
  'NE','NG','NU','NF','MK','MP','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR',
  'QA','RE','RO','RU','RW','BL','SH','KN','LC','MF','PM','VC','WS','SM','ST','SA','SN','RS','SC','SL',
  'SG','SX','SK','SI','SB','SO','ZA','GS','SS','ES','LK','SD','SR','SJ','SE','CH','SY','TW','TJ','TZ',
  'TH','TL','TG','TK','TO','TT','TN','TR','TM','TC','TV','UG','UA','AE','GB','US','UM','UY','UZ','VU',
  'VE','VN','VG','VI','WF','EH','YE','ZM','ZW','XK',
];

const REGION_NAMES = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
})();

const SPECIAL_NAME_TO_CODE = {
  unitedstates: 'US',
  unitedstatesofamerica: 'US',
  usa: 'US',
  uk: 'GB',
  unitedkingdom: 'GB',
  russia: 'RU',
  russianfederation: 'RU',
  southkorea: 'KR',
  northkorea: 'KP',
  czechrepublic: 'CZ',
  czechia: 'CZ',
  vietnam: 'VN',
  laos: 'LA',
  iran: 'IR',
  syria: 'SY',
  tanzania: 'TZ',
  bolivia: 'BO',
  venezuela: 'VE',
  moldova: 'MD',
  micronesia: 'FM',
  palestine: 'PS',
  kosovo: 'XK',
  ivorycoast: 'CI',
  cotedivoire: 'CI',
};

function normalizeCountryName(name) {
  if (!name) return '';
  try {
    return name
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');
  } catch {
    return String(name).toLowerCase().replace(/[^a-z]/g, '');
  }
}

const NAME_TO_CODE = (() => {
  const map = new Map();
  if (!REGION_NAMES) return map;
  REGION_CODES.forEach((code) => {
    const name = REGION_NAMES.of(code);
    if (!name) return;
    const key = normalizeCountryName(name);
    if (key && !map.has(key)) {
      map.set(key, code);
    }
  });
  return map;
})();

function countryNameToFlag(name) {
  if (!name || String(name).toLowerCase() === 'unknown') return '';
  const key = normalizeCountryName(name);
  const code = SPECIAL_NAME_TO_CODE[key] || NAME_TO_CODE.get(key);
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  const A = 0x1f1e6;
  const chars = [...upper].map((c) => A + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...chars);
}

export default function GeographyBreakdown({
  data = { countries: [], cities: [] },
  loading = false,
  titleCountries = 'Top countries',
  titleCities = 'Top cities',
  limit = 10,
}) {
  const countries = useMemo(() => {
    const arr = Array.isArray(data?.countries) ? data.countries : [];
    return arr.slice(0, Math.max(1, limit));
  }, [data?.countries, limit]);

  const cities = useMemo(() => {
    const arr = Array.isArray(data?.cities) ? data.cities : [];
    return arr.slice(0, Math.max(1, limit));
  }, [data?.cities, limit]);

  // ===== Solo móviles (≤540px) sin tocar desktop =====
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 540px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  return (
    <section
      aria-label="Geography"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}
    >
      <Card title={titleCountries} loading={loading}>
        <GeoTable
          isMobile={isMobile}
          headers={['Country', 'Views']}
          rows={countries.map((c) => {
            const name = c.country || 'Unknown';
            const flag = countryNameToFlag(name);
            return [flag ? `${flag} ${name}` : name, formatInt(c.views || 0)];
          })}
          emptyLabel="No country data."
        />
      </Card>

      <Card title={titleCities} loading={loading}>
        <GeoTable
          isMobile={isMobile}
          headers={['City', 'Country', 'Views']}
          rows={cities.map((c) => [
            c.city || 'Unknown',
            countryNameToFlag(c.country || '') || 'Unknown',
            formatInt(c.views || 0),
          ])}
          emptyLabel="No city data."
        />
      </Card>
    </section>
  );
}

/* ---------- Partials ---------- */

function Card({ title, loading, children }) {
  return (
    <div
      style={{
        border: '1px solid var(--ana-card-bd)',
        borderRadius: 12,
        background: 'var(--ana-card-bg)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'var(--ana-head-bg)',
          borderBottom: '1px solid var(--ana-line)',
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--ana-text)' }}>{title}</div>
        {loading && <small style={{ color: 'var(--ana-muted)' }}>Loading…</small>}
      </header>
      <div style={{ overflowX: 'auto' }}>{children}</div>
    </div>
  );
}

function GeoTable({ headers = [], rows = [], emptyLabel = 'No data.', isMobile = false }) {
  // cityMode cuando hay 3 columnas: [City, Country, Views]
  const isCityMode = headers.length === 3;

  return (
    <table
      role="table"
      style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        minWidth: isMobile ? 'auto' : 420,
      }}
    >
      <thead>
        <tr
          role="row"
          style={{
            background: 'var(--ana-head-bg)',
            borderBottom: '1px solid var(--ana-line)',
          }}
        >
          {isMobile && isCityMode ? (
            // En móvil para ciudades: encabezados compactos City / Views (Country irá debajo de City)
            <>
              <Th label="City" align="left" compact />
              <Th label="Views" align="right" compact />
            </>
          ) : (
            headers.map((h) => (
              <Th
                key={h}
                label={h}
                align={String(h).toLowerCase() === 'views' ? 'right' : 'left'}
                compact={isMobile}
              />
            ))
          )}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr role="row">
            <Td
              role="cell"
              colSpan={isMobile && isCityMode ? 2 : headers.length}
              align="center"
              compact={isMobile}
            >
              <span style={{ fontSize: 12, color: 'var(--ana-muted)' }}>{emptyLabel}</span>
            </Td>
          </tr>
        ) : (
          rows.map((r, i) => (
            <tr
              key={i}
              role="row"
              style={{
                borderBottom: '1px solid var(--ana-line-soft)',
              }}
            >
              {isMobile && isCityMode ? (
                <>
                  {/* Primera celda apilada: City + Country en línea secundaria */}
                  <Td align="left" compact>
                    <div style={{ display: 'grid', gap: 2 }}>
                      <div style={{ color: 'var(--ana-text)' }}>{r[0]}</div>
                      <small style={{ color: 'var(--ana-muted)' }}>{r[1]}</small>
                    </div>
                  </Td>
                  {/* Segunda celda: Views a la derecha */}
                  <Td align="right" compact>
                    {r[2]}
                  </Td>
                </>
              ) : (
                r.map((cell, j) => (
                  <Td
                    key={`${i}-${j}`}
                    role="cell"
                    align={j === r.length - 1 ? 'right' : 'left'}
                    compact={isMobile}
                  >
                    {cell}
                  </Td>
                ))
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function Th({ label, align = 'left', compact = false }) {
  return (
    <th
      role="columnheader"
      style={{
        textAlign: align,
        padding: compact ? '8px 10px' : '10px 12px',
        fontSize: compact ? 11 : 12,
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        fontWeight: 700,
        color: 'var(--ana-muted)',
      }}
    >
      {label}
    </th>
  );
}

function Td({ children, align = 'left', colSpan, compact = false }) {
  return (
    <td
      role="cell"
      colSpan={colSpan}
      style={{
        textAlign: align,
        padding: compact ? '8px 10px' : '10px 12px',
        fontSize: compact ? 13 : 14,
        color: 'var(--ana-text)',
      }}
    >
      {children}
    </td>
  );
}


