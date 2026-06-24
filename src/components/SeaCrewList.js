import React, { useEffect, useMemo, useRef, useState } from 'react';
import supabase from '../supabase';
import Slider from 'react-slick';
import LoadingSpinner from './LoadingSpinner';
import { isInNativeApp, postShareToNative } from '../utils/nativeShare';
import '../styles/SeaCrewList.css';

const STORAGE_BUCKET = 'cv-docs';

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

async function resolveMediaItem(item) {
  const signCvDocPath = async (rawPath) => {
    const cleanPath = String(rawPath || '').trim().replace(/^cv-docs\//, '');
    if (!cleanPath) return null;
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(cleanPath, 3600);
    return error ? null : data?.signedUrl || null;
  };

  if (!item) return null;
  if (typeof item === 'string') {
    const value = item.trim();
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/')) return value;
    return await signCvDocPath(value);
  }

  const sourceUrl = typeof item?.url === 'string' ? item.url.trim() : '';
  if (sourceUrl) {
    if (/^https?:\/\//i.test(sourceUrl)) return sourceUrl;
    if (sourceUrl.startsWith('/')) return sourceUrl;
    return await signCvDocPath(sourceUrl);
  }
  const sourcePath = typeof item?.path === 'string' ? item.path.trim() : '';
  if (sourcePath) {
    if (sourcePath.startsWith('/')) return sourcePath;
    return await signCvDocPath(sourcePath);
  }
  return null;
}

function getMediaCacheKey(item) {
  if (!item) return '';
  if (typeof item === 'string') return item.trim();
  return String(item?.url || item?.path || item?.name || '').trim();
}

function getProfileImageSources(profile) {
  const items = [];
  const seen = new Set();
  const add = (value) => {
    if (value == null) return;
    const key = typeof value === 'string' ? value : JSON.stringify(value);
    if (seen.has(key)) return;
    seen.add(key);
    items.push(value);
  };
  add(profile.photo_url);
  add(profile.avatar_url);
  if (Array.isArray(profile.gallery)) {
    profile.gallery.forEach((item) => {
      if (inferMediaType(item) !== 'image') return;
      add(item);
    });
  }
  return items;
}

function formatYachtExperience(totalMonths) {
  if (!Number.isFinite(totalMonths) || totalMonths <= 0) return 'Green';
  const years = totalMonths / 12;
  if (years < 1) return `${Math.round(totalMonths)} months`;
  const rounded = Math.round(years * 10) / 10;
  return `${rounded.toFixed(1)} years`;
}

function computeExperienceMonths(experiences) {
  if (!Array.isArray(experiences) || experiences.length === 0) return null;
  const now = new Date();
  let total = 0;
  experiences.forEach((exp) => {
    const sy = Number(exp.start_year);
    const sm = Number(exp.start_month) || 1;
    if (!Number.isFinite(sy)) return;
    const ey = exp.is_current ? now.getFullYear() : Number(exp.end_year) || sy;
    const em = exp.is_current ? now.getMonth() + 1 : Number(exp.end_month) || sm;
    const months = (ey - sy) * 12 + (em - sm) + 1;
    if (months > 0) total += months;
  });
  return total > 0 ? total : null;
}

function getEmploymentStatus(profile) {
  const status = profile?.prefs_skills_lite?.status || profile?.prefs_skills?.status || profile?.employmentStatus;
  if (status && typeof status === 'string' && status.trim()) return status.trim();
  const experiences = profile?.profile_experiences;
  if (Array.isArray(experiences) && experiences.some((e) => e?.is_current)) return 'Employed';
  return 'Unemployed';
}

function getRank(profile) {
  return (
    profile?.prefs_skills_lite?.rank || profile?.prefs_skills?.rank || profile?.primary_role || profile?.rank || profile?.primary_department || '—'
  );
}

function getAvailability(profile) {
  return profile?.prefs_skills_lite?.availability || profile?.prefs_skills?.availability || '—';
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

const shareBarStyle = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginTop: 8,
};

const roundShareBtnStyle = {
  width: 44,
  height: 44,
  borderRadius: '9999px',
  border: '1px solid rgba(0,0,0,0.1)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#fff',
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,.06)',
};

const whatsAppShareBtnStyle = {
  ...roundShareBtnStyle,
  background: '#25D366',
  border: 'none',
};

const shareIconImgStyle = { width: 22, height: 22, display: 'block' };
const shareIconStyle = { fontSize: 22, color: '#111' };

export default function SeaCrewList({ profiles, loading, currentUserId, onRequestChat }) {
  const [expandedId, setExpandedId] = useState(null);
  const [markedProfiles, setMarkedProfiles] = useState(() => {
    if (!currentUserId) return [];
    try {
      const stored = localStorage.getItem(`markedSeaCrewProfiles_user_${currentUserId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error parsing marked SeaCrew profiles from localStorage', error);
      return [];
    }
  });
  const [resolvedCoverImages, setResolvedCoverImages] = useState({});
  const [resolvedExpandedImages, setResolvedExpandedImages] = useState({});
  const [visibleProfileIds, setVisibleProfileIds] = useState({});
  const items = useMemo(() => (Array.isArray(profiles) ? profiles : []), [profiles]);
  const cardRefs = useRef(new Map());
  const mediaUrlCacheRef = useRef(new Map());
  const supportsWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const showNativeShare = supportsWebShare || isInNativeApp();

  const getShareUrl = (profile) => {
    if (typeof window === 'undefined') return '';
    if (profile?.public_qr_id) {
      return `${window.location.origin}/cv/qr/${encodeURIComponent(profile.public_qr_id)}`;
    }
    if (profile?.handle) {
      return `${window.location.origin}/cv/${encodeURIComponent(profile.handle)}`;
    }
    return '';
  };

  const getShareData = (profile) => {
    const rank = getRank(profile);
    const displayName = profile?.userNickname || 'Candidate';
    const locationText = [profile?.city || profile?.city_port, profile?.country].filter(Boolean).join(' - ');
    return {
      title: `${displayName} · SeaCrew`,
      text: `${displayName}${rank ? ` · ${rank}` : ''}${locationText ? ` · ${locationText}` : ''}`,
      url: getShareUrl(profile),
    };
  };

  const handleCopyLink = async (profile) => {
    const shareUrl = getShareUrl(profile);
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      alert('Link copied!');
    }
  };

  const handleWhatsApp = (profile) => {
    const data = getShareData(profile);
    if (!data.url) return;
    const msg = `SeaCrew: ${data.text}\n${data.url}`;
    const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(wa, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async (profile, event) => {
    event.stopPropagation();
    const data = getShareData(profile);
    if (!data.url) return;
    if (isInNativeApp()) {
      postShareToNative(data);
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (err) {
        if (err && err.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    }
  };

  const toggleMark = (profileId) => {
    setMarkedProfiles((prevMarked) => {
      const updated = prevMarked.includes(profileId)
        ? prevMarked.filter((id) => id !== profileId)
        : [...prevMarked, profileId];

      if (currentUserId) {
        try {
          localStorage.setItem(
            `markedSeaCrewProfiles_user_${currentUserId}`,
            JSON.stringify(updated)
          );
        } catch (error) {
          console.error('Error saving marked SeaCrew profiles to localStorage', error);
        }
      }

      return updated;
    });
  };

  useEffect(() => {
    if (!currentUserId) {
      setMarkedProfiles([]);
      return;
    }

    try {
      const stored = localStorage.getItem(`markedSeaCrewProfiles_user_${currentUserId}`);
      setMarkedProfiles(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Error loading marked SeaCrew profiles from localStorage', error);
      setMarkedProfiles([]);
    }
  }, [currentUserId]);

  useEffect(() => {
    setExpandedId(null);
    setResolvedCoverImages({});
    setResolvedExpandedImages({});
    setVisibleProfileIds({});
  }, [items]);

  useEffect(() => {
    if (!items.length || typeof IntersectionObserver === 'undefined') {
      setVisibleProfileIds(
        Object.fromEntries(items.map((profile) => [profile.id, true]))
      );
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleProfileIds((prev) => {
          const next = { ...prev };
          let changed = false;
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const profileId = entry.target.getAttribute('data-profile-id');
            if (!profileId || next[profileId]) return;
            next[profileId] = true;
            changed = true;
          });
          return changed ? next : prev;
        });
      },
      { rootMargin: '300px 0px' }
    );

    cardRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => {
      observer.disconnect();
    };
  }, [items]);

  useEffect(() => {
    const loadVisibleCoverImages = async () => {
      const pendingProfiles = items.filter((profile) => {
        const profileId = String(profile.id || '').trim();
        return (
          profileId &&
          visibleProfileIds[profileId] &&
          !Object.prototype.hasOwnProperty.call(resolvedCoverImages, profileId)
        );
      });

      if (!pendingProfiles.length) return;

      const nextEntries = await Promise.all(
        pendingProfiles.map(async (profile) => {
          const coverSource = getProfileImageSources(profile)[0];
          const cacheKey = getMediaCacheKey(coverSource);

          if (cacheKey && mediaUrlCacheRef.current.has(cacheKey)) {
            return [profile.id, mediaUrlCacheRef.current.get(cacheKey)];
          }

          const coverUrl = await resolveMediaItem(coverSource);
          const safeUrl = typeof coverUrl === 'string' && coverUrl.trim() ? coverUrl : null;
          if (cacheKey) mediaUrlCacheRef.current.set(cacheKey, safeUrl);
          return [profile.id, safeUrl];
        })
      );

      setResolvedCoverImages((prev) => {
        const next = { ...prev };
        nextEntries.forEach(([profileId, url]) => {
          next[profileId] = url;
        });
        return next;
      });
    };

    loadVisibleCoverImages();
  }, [items, resolvedCoverImages, visibleProfileIds]);

  useEffect(() => {
    if (!expandedId || resolvedExpandedImages[expandedId]) return;

    let isMounted = true;
    const profile = items.find((item) => item.id === expandedId);
    if (!profile) return undefined;

    const loadExpandedImages = async () => {
      const sourceItems = getProfileImageSources(profile);
      const urls = await Promise.all(
        sourceItems.map(async (item) => {
          const cacheKey = getMediaCacheKey(item);
          if (cacheKey && mediaUrlCacheRef.current.has(cacheKey)) {
            return mediaUrlCacheRef.current.get(cacheKey);
          }
          const resolvedUrl = await resolveMediaItem(item);
          const safeUrl = typeof resolvedUrl === 'string' && resolvedUrl.trim() ? resolvedUrl : null;
          if (cacheKey) mediaUrlCacheRef.current.set(cacheKey, safeUrl);
          return safeUrl;
        })
      );
      if (!isMounted) return;
      setResolvedExpandedImages((prev) => ({
        ...prev,
        [expandedId]: urls.filter((url) => typeof url === 'string' && url.trim()),
      }));
    };

    loadExpandedImages();
    return () => {
      isMounted = false;
    };
  }, [expandedId, items, resolvedExpandedImages]);

  if (loading) return <LoadingSpinner message="Loading SeaCrew profiles..." />;
  if (!items.length) {
    return (
      <div className="seacrew-empty">
        <h3>No SeaCrew candidates were found.</h3>
        <p>Only candidates with a completed Digital CV are shown here.</p>
      </div>
    );
  }

  return (
    <div className="seacrew-list">
      {items.map((profile) => {
        const displayName = profile.userNickname || 'Candidate';
        const cover = Object.prototype.hasOwnProperty.call(resolvedCoverImages, profile.id)
          ? resolvedCoverImages[profile.id]
          : null;
        const expandedImages = resolvedExpandedImages[profile.id] || (cover ? [cover] : []);
        const experienceMonths = Number.isFinite(Number(profile?.yachtingMonths))
          ? Number(profile.yachtingMonths)
          : computeExperienceMonths(profile.profile_experiences);
        const experienceLabel = formatYachtExperience(experienceMonths);
        const statusLabel = getEmploymentStatus(profile);
        const availabilityLabel = getAvailability(profile);
        const cityLabel = String(profile.city || profile.city_port || '').trim();
        const countryLabel = String(profile.country || '').trim();
        const rankLabel = getRank(profile);
        const isExpanded = expandedId === profile.id;
        const isMarked = markedProfiles.includes(profile.id);
        const shareUrl = getShareUrl(profile);
        const chatReceiverId = String(profile.chatReceiverId || '').trim();
        const canStartChat =
          Boolean(chatReceiverId) &&
          chatReceiverId !== String(currentUserId || '').trim() &&
          typeof onRequestChat === 'function';

        const toggle = (e) => {
          if (e && e.target && e.target.closest && e.target.closest('.no-toggle')) return;
          setExpandedId((p) => (p === profile.id ? null : profile.id));
        };

        const handleCoverError = () => {
          setResolvedCoverImages((prev) => (
            prev[profile.id] ? { ...prev, [profile.id]: null } : prev
          ));
        };

        const handleExpandedError = (failedSrc) => {
          setResolvedExpandedImages((prev) => {
            const current = Array.isArray(prev[profile.id]) ? prev[profile.id] : [];
            const next = current.filter((src) => src !== failedSrc);
            if (next.length === current.length) return prev;
            return { ...prev, [profile.id]: next };
          });
          setResolvedCoverImages((prev) => (
            prev[profile.id] === failedSrc ? { ...prev, [profile.id]: null } : prev
          ));
        };

        return (
          <article
            key={profile.id}
            className={`seacrew-card ${isExpanded ? 'expanded' : 'collapsed'} ${isMarked ? 'marked' : ''}`}
            onClick={toggle}
            data-profile-id={profile.id}
            ref={(node) => {
              if (node) {
                cardRefs.current.set(String(profile.id), node);
                return;
              }
              cardRefs.current.delete(String(profile.id));
            }}
          >
            <div
              className="seacrew-card-media"
            >
              {isExpanded ? (
                expandedImages.length > 0 ? (
                  <div className="seacrew-card-slider" onClick={(e) => e.stopPropagation()}>
                    <Slider
                      key={`${profile.id}-${expandedImages.join('|')}`}
                      {...sliderSettings}
                    >
                      {expandedImages.map((src, i) => (
                        <div key={`${profile.id}-img-${i}`} className="seacrew-image-wrap seacrew-slide-frame">
                          <div
                            className="seacrew-media-blur"
                            aria-hidden="true"
                            style={{ backgroundImage: `url("${src}")` }}
                          />
                          <img
                            src={src}
                            alt={`${displayName} media ${i + 1}`}
                            className="seacrew-image seacrew-image-expanded"
                            onError={() => handleExpandedError(src)}
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
                      onError={handleCoverError}
                    />
                  </div>
                ) : (
                  <div className="seacrew-card-image-placeholder">No image</div>
                )
              )}
            </div>

            <div className="seacrew-card-body">
              <div className="seacrew-card-header">
                <h3 className="seacrew-card-name">{displayName}</h3>
                <button
                  type="button"
                  className={`seacrew-mark-toggle no-toggle ${isMarked ? 'active' : ''}`}
                  aria-label={isMarked ? 'Unmark candidate' : 'Mark candidate'}
                  aria-pressed={isMarked}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleMark(profile.id);
                  }}
                >
                  {isMarked ? '✔' : ''}
                </button>
              </div>
              <p className="seacrew-card-title">{rankLabel}</p>
              {isExpanded && (
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
                  {shareUrl && (
                    <div className="seacrew-card-actions seacrew-share-actions no-toggle">
                      <div
                        className="seacrew-share-bar"
                        style={shareBarStyle}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {showNativeShare ? (
                          <button
                            type="button"
                            onClick={(event) => handleShare(profile, event)}
                            style={roundShareBtnStyle}
                            aria-label="Share"
                            title="Share"
                          >
                            <span className="material-icons" style={shareIconStyle}>ios_share</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleWhatsApp(profile);
                              }}
                              style={whatsAppShareBtnStyle}
                              aria-label="Share on WhatsApp"
                              title="Share on WhatsApp"
                            >
                              <img src="/icons/whatsapp.svg" alt="" style={shareIconImgStyle} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCopyLink(profile);
                              }}
                              style={roundShareBtnStyle}
                              aria-label="Copy share link"
                              title="Copy link"
                            >
                              <img src="/icons/link.svg" alt="" style={shareIconImgStyle} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {canStartChat && (
                    <div className="seacrew-card-actions no-toggle">
                      <button
                        type="button"
                        className="seacrew-chat-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRequestChat(chatReceiverId);
                        }}
                      >
                        Private Chat
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
