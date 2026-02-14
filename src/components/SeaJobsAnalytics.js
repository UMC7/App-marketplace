// src/components/SeaJobsAnalytics.js
import React, { useMemo, useState, useEffect } from 'react';
import { getOfferDepartment } from '../utils/offerDepartment';

const TIME_ZONE = 'Europe/Madrid';
const LOCALE = 'en-US';

// Country/region name -> ISO alpha-2 or null for regions
const COUNTRY_ISO = {
  Spain: 'ES', France: 'FR', Italy: 'IT', Monaco: 'MC', Malta: 'MT', Portugal: 'PT',
  Greece: 'GR', Croatia: 'HR', Cyprus: 'CY', Turkey: 'TR', Albania: 'AL', Bulgaria: 'BG',
  Romania: 'RO', Slovenia: 'SI', Montenegro: 'ME',
  'United Kingdom': 'GB', 'United Kingdom (UK)': 'GB', Ireland: 'IE', Germany: 'DE',
  Netherlands: 'NL', Belgium: 'BE', Denmark: 'DK', Norway: 'NO', Sweden: 'SE',
  Finland: 'FI', Poland: 'PL', Estonia: 'EE', Latvia: 'LV', Lithuania: 'LT',
  'United States': 'US', 'US Flag': 'US', USA: 'US', Canada: 'CA', Mexico: 'MX',
  Bermuda: 'BM', 'Bermuda (UK)': 'BM',
  Bahamas: 'BS', Jamaica: 'JM', Cuba: 'CU', 'Dominican Republic': 'DO',
  'Antigua and Barbuda': 'AG', Aruba: 'AW', Barbados: 'BB', Bonaire: 'BQ',
  'Cayman Islands (UK)': 'KY', Curacao: 'CW', Dominica: 'DM', Grenada: 'GD',
  'Saint Lucia': 'LC', 'Saint Maarten': 'SX', 'Saint Vincent and the Grenadines': 'VC',
  'Trinidad and Tobago': 'TT', Anguilla: 'AI', 'Saint Kitts and Nevis': 'KN',
  'Saint BarthÃ©lemy': 'BL', 'BVI (UK)': 'VG',
  Argentina: 'AR', Brazil: 'BR', Chile: 'CL', Colombia: 'CO', Ecuador: 'EC',
  Peru: 'PE', Uruguay: 'UY', Venezuela: 'VE', Paraguay: 'PY',
  Belize: 'BZ', 'Costa Rica': 'CR', 'El Salvador': 'SV', Guatemala: 'GT',
  Honduras: 'HN', Nicaragua: 'NI', Panama: 'PA',
  'United Arab Emirates': 'AE', 'UAE': 'AE', Qatar: 'QA', Kuwait: 'KW',
  'Saudi Arabia': 'SA',
  Australia: 'AU', 'New Zealand': 'NZ', Fiji: 'FJ', Singapore: 'SG',
  Thailand: 'TH', Japan: 'JP', China: 'CN', Malaysia: 'MY', Indonesia: 'ID',
  Philippines: 'PH', India: 'IN', Israel: 'IL', 'South Korea': 'KR', Vietnam: 'VN',
};

// RegiÃ³n -> emoji reconocible (caracterÃ­stico de esa regiÃ³n)
const REGION_ICON = {
  Mediterranean: 'â›µ',
  Caribbean: 'ðŸï¸',
  'North and Baltic Seas': 'âš“',
  'North America': 'ðŸ—½',
  'South America': 'ðŸŒŽ',
  'Central America': 'ðŸŒ´',
  'Persian Gulf': 'ðŸ›¢ï¸',
  Asia: 'ðŸŒ',
  Oceania: 'ðŸ¦˜',
  'Western Europe': 'ðŸ›ï¸',
  'Eastern Europe': 'â›ª',
  Pacific: 'ðŸŒ…',
  'Red Sea': 'ðŸ ',
  'Indian Ocean': 'ðŸŒŠ',
  'North Sea': 'ðŸŒ¬ï¸',
  Baltic: 'ðŸ§­',
};

const DEPARTMENT_ICON = {
  Deck: '⚓',
  Engine: '⚙️',
  Galley: '👨‍🍳',
  Interior: '✨',
  Others: '🛟',
};


function getFlagEmoji(iso) {
  if (!iso || iso.length !== 2) return '';
  const codePoints = [...iso.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getLocationIcon(name) {
  const key = String(name || '').trim();
  if (REGION_ICON[key]) return REGION_ICON[key];
  const iso = COUNTRY_ISO[key];
  if (iso) return getFlagEmoji(iso);
  return 'ðŸ“';
}


// Department mapping is centralized in utils/offerDepartment.js

function isActiveOffer(offer) {
  const s = String(offer?.status || '').toLowerCase();
  return s === 'active';
}

function parseTimestamp(value) {
  if (!value) return null;
  const raw = String(value);
  if (/[zZ]|[+-]\d\d:\d\d$/.test(raw)) return new Date(raw);
  return new Date(`${raw}Z`);
}

function getTzParts(date, timeZone = TIME_ZONE) {
  const fmt = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

function getLocalDateUTC(date, timeZone = TIME_ZONE) {
  const p = getTzParts(date, timeZone);
  return new Date(Date.UTC(p.year, p.month - 1, p.day));
}

function useSeaJobsStats(offers) {
  return useMemo(() => {
    if (!offers || !Array.isArray(offers)) {
      return { totalActive: 0, last7DaysCount: 0, topCountries: [], topRanks: [], prevCountryRanks: new Map() };
    }
    const now = new Date();
    const todayLocal = getLocalDateUTC(now);
    const last7Start = new Date(todayLocal.getTime() - 6 * 86400000);
    const prev7Start = new Date(todayLocal.getTime() - 13 * 86400000);

    const activeOffers = offers.filter(isActiveOffer);
    const totalActive = activeOffers.length;

    const countryCounts = new Map();
    const prevCountryCounts = new Map();
    const rankCounts = new Map();
    const prevRankCounts = new Map();
    const rankDepartmentCounts = new Map();
    let last7DaysCount = 0;

    for (const offer of activeOffers) {
      const created = parseTimestamp(offer.created_at);
      if (created) {
        const localDate = getLocalDateUTC(created);
        const country = String(offer.country || '').trim() || 'Unknown';
        const title = String(offer.title || '').trim() || 'Other';
        const department = getOfferDepartment(offer);

        if (localDate >= last7Start && localDate <= todayLocal) {
          last7DaysCount += 1;
          if (country !== 'Unknown') countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
          if (title !== 'Other') {
            rankCounts.set(title, (rankCounts.get(title) || 0) + 1);
            if (!rankDepartmentCounts.has(title)) rankDepartmentCounts.set(title, new Map());
            const deptMap = rankDepartmentCounts.get(title);
            deptMap.set(department, (deptMap.get(department) || 0) + 1);
          }
        } else if (localDate >= prev7Start && localDate < last7Start) {
          if (country !== 'Unknown') prevCountryCounts.set(country, (prevCountryCounts.get(country) || 0) + 1);
          if (title !== 'Other') prevRankCounts.set(title, (prevRankCounts.get(title) || 0) + 1);
        }
      }
    }

    const topCountries = Array.from(countryCounts.entries())
      .filter(([name]) => name && name !== 'Unknown' && COUNTRY_ISO[name])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const prevCountryRankList = Array.from(prevCountryCounts.entries())
      .filter(([name]) => name && name !== 'Unknown' && COUNTRY_ISO[name])
      .sort((a, b) => b[1] - a[1]);
    const prevCountryRanks = new Map(prevCountryRankList.map(([name], i) => [name, i + 1]));

    const topRanks = Array.from(rankCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const prevRankList = Array.from(prevRankCounts.entries())
      .sort((a, b) => b[1] - a[1]);
    const prevRankPositions = new Map(prevRankList.map(([name], i) => [name, i + 1]));

    const topRanksWithDept = topRanks.map(([name, count]) => {
      const deptMap = rankDepartmentCounts.get(name);
      let topDept = 'Others';
      if (deptMap) {
        let best = -1;
        for (const [deptName, deptCount] of deptMap.entries()) {
          if (deptCount > best) {
            best = deptCount;
            topDept = deptName;
          }
        }
      }
      const prevRank = prevRankPositions.has(name) ? prevRankPositions.get(name) : null;
      return { name, count, department: topDept, prevRank };
    });

    return { totalActive, last7DaysCount, topCountries, topRanks: topRanksWithDept, prevCountryRanks };
  }, [offers]);
}

const CAROUSEL_INTERVAL_MS = 5000;

export default function SeaJobsAnalytics({ offers, isMobile }) {
  const stats = useSeaJobsStats(offers);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReduced) return;
    const id = setInterval(() => {
      setCarouselIndex((i) => {
        if (i >= 4) {
          setNoTransition(true);
          return 0;
        }
        return i + 1;
      });
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isMobile]);

  useEffect(() => {
    if (!noTransition) return;
    const t = setTimeout(() => {
      setNoTransition(false);
      setCarouselIndex((i) => (i === 0 ? 1 : i));
    }, 50);
    return () => clearTimeout(t);
  }, [noTransition]);

  const card1 = (
    <div key="active" className="seajobs-analytics-card">
      <div className="seajobs-analytics-value">{stats.totalActive}</div>
      <div className="seajobs-analytics-label">Active jobs</div>
    </div>
  );
  const card2 = (
    <div key="last7" className="seajobs-analytics-card">
      <div className="seajobs-analytics-value">{stats.last7DaysCount}</div>
      <div className="seajobs-analytics-label">Posted last 7 days</div>
    </div>
  );
  const card3 = (
    <div key="countries" className="seajobs-analytics-card seajobs-analytics-card-list">
      <div className="seajobs-analytics-label">Top countries (7 days)</div>
      <div className="seajobs-analytics-rows">
        {stats.topCountries.length ? (
          stats.topCountries.map(([name, count], idx) => {
            const currRank = idx + 1;
            const prevRank = stats.prevCountryRanks?.get(name);
            const rankChange = prevRank != null ? prevRank - currRank : null;
            const hasChange = rankChange != null;
            const rankChangeClass = hasChange
              ? rankChange > 0
                ? 'seajobs-analytics-rank-up'
                : rankChange < 0
                  ? 'seajobs-analytics-rank-down'
                  : 'seajobs-analytics-rank-same'
              : '';
            return (
              <div key={name} className="seajobs-analytics-row">
                <span className="seajobs-analytics-icon" aria-hidden>
                  {hasChange && (
                    <span
                      className={`seajobs-analytics-rank-change ${rankChangeClass}`}
                      title={
                        rankChange === 0
                          ? 'Sin cambio'
                          : rankChange > 0
                            ? `Subio ${rankChange} puesto${rankChange > 1 ? 's' : ''}`
                            : `Bajo ${-rankChange} puesto${rankChange < -1 ? 's' : ''}`
                      }
                    >
                        {rankChange === 0
                          ? '\u2192'
                          : rankChange > 0
                            ? `\u2191${rankChange}`
                            : `\u2193${Math.abs(rankChange)}`}
                    </span>
                  )}
                  {getLocationIcon(name)}
                </span>
                <span className="seajobs-analytics-row-label">{name}</span>
                <span className="seajobs-analytics-row-value">{count}</span>
              </div>
            );
          })
        ) : (
          <div className="seajobs-analytics-empty">No data yet</div>
        )}
      </div>
    </div>
  );
  const card4 = (
    <div key="ranks" className="seajobs-analytics-card seajobs-analytics-card-list">
      <div className="seajobs-analytics-label">Top Ranks (7 days)</div>
      <div className="seajobs-analytics-rows">
        {stats.topRanks.length ? (
          stats.topRanks.map((rank, idx) => {
            const currRank = idx + 1;
            const prevRank = rank.prevRank;
            const rankChange = prevRank != null ? prevRank - currRank : null;
            const hasChange = rankChange != null;
            const rankChangeClass = hasChange
              ? rankChange > 0
                ? 'seajobs-analytics-rank-up'
                : rankChange < 0
                  ? 'seajobs-analytics-rank-down'
                  : 'seajobs-analytics-rank-same'
              : '';
            return (
              <div key={rank.name} className="seajobs-analytics-row">
                <span className="seajobs-analytics-icon" aria-hidden>
                  {hasChange && (
                    <span
                      className={`seajobs-analytics-rank-change ${rankChangeClass}`}
                      title={
                        rankChange === 0
                          ? 'Sin cambio'
                          : rankChange > 0
                            ? `Subio ${rankChange} puesto${rankChange > 1 ? 's' : ''}`
                            : `Bajo ${-rankChange} puesto${rankChange < -1 ? 's' : ''}`
                      }
                    >
                      {rankChange === 0
                        ? '\u2192'
                        : rankChange > 0
                          ? `\u2191${rankChange}`
                          : `\u2193${Math.abs(rankChange)}`}
                    </span>
                  )}
                  {DEPARTMENT_ICON[rank.department] || '🛟'}
                </span>
                <span className="seajobs-analytics-row-label">{rank.name}</span>
                <span className="seajobs-analytics-row-value">{rank.count}</span>
              </div>
            );
          })
        ) : (
          <div className="seajobs-analytics-empty">No data yet</div>
        )}
      </div>
    </div>
  );

  const cards = [card1, card2, card3, card4];
  const infiniteCards = [...cards, card1];

  if (isMobile) {
    return (
      <div className="seajobs-analytics-wrap seajobs-analytics-carousel">
        <div className="seajobs-analytics-carousel-viewport">
          <div
            className={`seajobs-analytics-carousel-track ${noTransition ? 'seajobs-analytics-carousel-no-transition' : ''}`}
            style={{ transform: `translateX(-${carouselIndex * 20}%)` }}
          >
            {infiniteCards.map((card, i) => (
              <div key={i} className="seajobs-analytics-carousel-slide">
                {card}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seajobs-analytics-wrap">
      {cards}
    </div>
  );
}
