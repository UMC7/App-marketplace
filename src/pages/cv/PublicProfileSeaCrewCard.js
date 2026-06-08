import React, { useMemo, useState } from 'react';
import Slider from 'react-slick';
import '../../styles/SeaCrewList.css';

function inferMediaType(item) {
  if (!item) return 'image';
  if (typeof item === 'object' && typeof item.type === 'string' && item.type.trim()) {
    return item.type.trim().toLowerCase() === 'video' ? 'video' : 'image';
  }
  const source = typeof item === 'string'
    ? item
    : item?.url || item?.path || item?.name || '';
  return /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(String(source || '')) ? 'video' : 'image';
}

function formatYachtExperience(totalMonths) {
  if (!Number.isFinite(totalMonths) || totalMonths <= 0) return 'Green';
  const years = totalMonths / 12;
  if (years < 1) return `${Math.round(totalMonths)} months`;
  const rounded = Math.round(years * 10) / 10;
  return `${rounded.toFixed(1)} years`;
}

function getProfileImageSources(profile) {
  const items = [];
  const seen = new Set();
  const add = (value) => {
    if (!value) return;
    const normalized = typeof value === 'string' ? value.trim() : value;
    const key = typeof normalized === 'string' ? normalized : JSON.stringify(normalized);
    if (!key || seen.has(key)) return;
    seen.add(key);
    items.push(normalized);
  };

  add(profile?.photo_url);
  add(profile?.avatar_url);
  if (Array.isArray(profile?.gallery)) {
    profile.gallery.forEach((item) => {
      if (inferMediaType(item) !== 'image') return;
      add(item);
    });
  }
  return items
    .map((item) => {
      if (typeof item === 'string') return item;
      return item?.url || item?.path || '';
    })
    .filter(Boolean);
}

function getEmploymentStatus(profile) {
  const status = profile?.prefs_skills_lite?.status || profile?.prefs_skills?.status || profile?.employmentStatus;
  if (status && typeof status === 'string' && status.trim()) return status.trim();
  return '—';
}

function getRank(profile) {
  return (
    profile?.prefs_skills_lite?.rank ||
    profile?.prefs_skills?.rank ||
    profile?.primary_role ||
    profile?.rank ||
    profile?.primary_department ||
    '—'
  );
}

function getAvailability(profile) {
  return profile?.prefs_skills_lite?.availability || profile?.prefs_skills?.availability || profile?.availability || '—';
}

const sliderSettings = {
  dots: true,
  arrows: false,
  infinite: true,
  speed: 400,
  autoplay: true,
  autoplaySpeed: 2500,
  pauseOnHover: true,
  slidesToShow: 1,
  slidesToScroll: 1,
  adaptiveHeight: false,
};

export default function PublicProfileSeaCrewCard({ profile }) {
  const [expanded, setExpanded] = useState(false);
  const [coverAvailable, setCoverAvailable] = useState(true);
  const [failedExpandedSources, setFailedExpandedSources] = useState([]);

  const imageSources = useMemo(() => getProfileImageSources(profile), [profile]);
  const cover = coverAvailable ? imageSources[0] || null : null;
  const expandedImages = imageSources.filter((src) => !failedExpandedSources.includes(src));
  const displayName = profile?.userNickname || profile?.displayName || 'Candidate';
  const experienceLabel = formatYachtExperience(Number(profile?.yachtingMonths));
  const statusLabel = getEmploymentStatus(profile);
  const availabilityLabel = getAvailability(profile);
  const cityLabel = String(profile?.city || profile?.city_port || '').trim();
  const countryLabel = String(profile?.country || '').trim();
  const rankLabel = getRank(profile);

  return (
    <article
      className={`seacrew-card ${expanded ? 'expanded' : 'collapsed'}`}
      onClick={() => setExpanded((prev) => !prev)}
    >
      <div className="seacrew-card-media">
        {expanded ? (
          expandedImages.length > 0 ? (
            <div className="seacrew-card-slider" onClick={(e) => e.stopPropagation()}>
              <Slider key={`${displayName}-${expandedImages.join('|')}`} {...sliderSettings}>
                {expandedImages.map((src, index) => (
                  <div key={`${src}-${index}`} className="seacrew-image-wrap seacrew-slide-frame">
                    <div
                      className="seacrew-media-blur"
                      aria-hidden="true"
                      style={{ backgroundImage: `url("${src}")` }}
                    />
                    <img
                      src={src}
                      alt={`${displayName} media ${index + 1}`}
                      className="seacrew-image seacrew-image-expanded"
                      onError={() => {
                        setFailedExpandedSources((prev) => (prev.includes(src) ? prev : [...prev, src]));
                        if (cover === src) setCoverAvailable(false);
                      }}
                    />
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            <div className="seacrew-card-image-placeholder">No image</div>
          )
        ) : (
          cover ? (
            <div className="seacrew-image-wrap">
              <div
                aria-hidden="true"
                className="seacrew-media-blur"
                style={{ backgroundImage: `url("${cover}")` }}
              />
              <img
                src={cover}
                alt={`${displayName} profile`}
                className="seacrew-image seacrew-image-collapsed"
                onError={() => setCoverAvailable(false)}
              />
            </div>
          ) : (
            <div className="seacrew-card-image-placeholder">No image</div>
          )
        )}
      </div>

      <div className="seacrew-card-body">
        <h3 className="seacrew-card-name">{displayName}</h3>
        <p className="seacrew-card-title">{rankLabel}</p>
        {expanded && (
          <div className="seacrew-card-details">
            <p className="seacrew-card-detailRow">
              <span className="seacrew-card-detailEmoji" aria-hidden="true">🏙️</span>
              <span className="seacrew-card-detailLabel">City</span>
              <span className="seacrew-card-detailValue">{cityLabel || '—'}</span>
            </p>
            <p className="seacrew-card-detailRow">
              <span className="seacrew-card-detailEmoji" aria-hidden="true">📍</span>
              <span className="seacrew-card-detailLabel">Country</span>
              <span className="seacrew-card-detailValue">{countryLabel || '—'}</span>
            </p>
            <p className="seacrew-card-detailRow">
              <span className="seacrew-card-detailEmoji" aria-hidden="true">🧭</span>
              <span className="seacrew-card-detailLabel">Status</span>
              <span className="seacrew-card-detailValue">{statusLabel}</span>
            </p>
            <p className="seacrew-card-detailRow">
              <span className="seacrew-card-detailEmoji" aria-hidden="true">⏳</span>
              <span className="seacrew-card-detailLabel">Availability</span>
              <span className="seacrew-card-detailValue">{availabilityLabel}</span>
            </p>
            <p className="seacrew-card-detailRow">
              <span className="seacrew-card-detailEmoji" aria-hidden="true">⚓</span>
              <span className="seacrew-card-detailLabel">Experience</span>
              <span className="seacrew-card-detailValue">{experienceLabel}</span>
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
