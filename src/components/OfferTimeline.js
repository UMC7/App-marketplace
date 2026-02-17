import React from 'react';
import MatchBorder from './MatchBorder';
import ThemeLogo from './ThemeLogo';
import Avatar from './Avatar';
import LoadingSpinner from './LoadingSpinner';

const REMARKS_DISCLAIMER = 'Disclaimer:\nYacht Daywork Ltd. connects employers and crew directly and is not involved in hiring decisions or private agreements. Please communicate responsibly and remain cautious when applying.';

const formatSalaryValue = (currency, amount, withTips) => {
  const base = `${currency || ''} ${Number(amount).toLocaleString('en-US')}`;
  return withTips ? `${base} + Tips` : base;
};

const formatSalary = (offer) => {
  if (!offer) return '';
  const base = offer.is_doe
    ? 'DOE'
    : formatSalaryValue(offer.salary_currency, offer.salary, false);
  return offer.is_tips ? `${base} + Tips` : base;
};

const formatDate = (dateStr, monthOnly = false) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  const options = monthOnly
    ? { month: 'short', year: 'numeric' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
};

const isTodayLocal = (timestamp) => {
  const offerDate = new Date(timestamp);
  const now = new Date();

  return (
    offerDate.getDate() === now.getDate() &&
    offerDate.getMonth() === now.getMonth() &&
    offerDate.getFullYear() === now.getFullYear()
  );
};

const getRoleImage = (title) => {
  if (!title) return 'others';

  const lowerTitle = title.toLowerCase();

  if ([
    'captain', 'captain/engineer', 'skipper', 'chase boat captain', 'relief captain', 'chief officer', '2nd officer', '3rd officer', 'bosun', 'deck/engineer', 'mate', 'lead deckhand', 'deckhand', 'deck/steward(ess)', 'deck/carpenter', 'deck/divemaster'
  ].some(role => lowerTitle.includes(role))) return 'deckdepartment';

  if ([
    'chief engineer', '2nd engineer', '3rd engineer', 'solo engineer', 'engineer', 'electrician'
  ].some(role => lowerTitle.includes(role))) return 'enginedepartment';

  if ([
    'chef', 'head chef', 'sous chef', 'solo chef', 'cook', 'cook/crew chef', 'cook/steward(ess)', 'deck/cook'
  ].some(role => lowerTitle.includes(role))) return 'galleydepartment';
  if ([
    'chief steward(ess)', '2nd steward(ess)', '2nd stewardess', '3rd steward(ess)', '3rd stewardess',
    '4th steward(ess)', '4th stewardess', 'steward(ess)', 'stewardess', 'steward', 'solo steward(ess)',
    'junior steward(ess)', 'stew/deck', 'laundry/steward(ess)', 'stew/masseur',
    'masseur', 'hairdresser', 'barber', 'butler', 'housekeeper', 'cook/stew/deck'
  ].some(role => lowerTitle.includes(role))) return 'interiordepartment';

  if (lowerTitle.includes('shore') || lowerTitle.includes('shore-based') || lowerTitle.includes('shorebased')) return 'shorebased';

  if (lowerTitle.includes('nanny')) return 'nanny';
  if (lowerTitle.includes('nurse')) return 'nurse';
  if (lowerTitle.includes('dayworker')) return 'dayworker';

  if ([
    'videographer',
    'yoga/pilates instructor',
    'personal trainer',
    'dive instructor',
    'water sport instructor',
    'other'
  ].some(role => lowerTitle.includes(role))) return 'others';

  return 'others';
};

const OfferTimeline = ({
  groupedOffers,
  expandedWeeks,
  expandedDays,
  toggleWeek,
  toggleDay,
  expandedOfferId,
  toggleExpanded,
  cardRefs,
  authors,
  authorAvatars,
  isMobile,
  showAvatarMobile,
  handleCopy,
  copiedField,
  markedOffers,
  toggleMark,
  showNativeShare,
  handleShare,
  handleWhatsApp,
  handleCopyLink,
  handleDirectApply,
  handleRequestChat,
  handleShowChatLoginInfo,
  offersLoading,
  currentUser,
  appliedOfferIds,
}) => {
  const iconBarStyle = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 };
  const roundBtn = {
    width: 44, height: 44, borderRadius: '9999px', border: '1px solid rgba(0,0,0,0.1)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: '#fff', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.06)'
  };
  const waBtn = { ...roundBtn, background: '#25D366', border: 'none' };
  const iconImg = { width: 22, height: 22, display: 'block' };
  const shareIcon = { fontSize: 22, color: '#111' };

  return (
    <>
      {Object.entries(groupedOffers).map(([weekGroup, dates]) => (
        <div key={weekGroup} style={{ marginBottom: '30px' }}>
          <h3 style={{ cursor: 'pointer' }} onClick={() => toggleWeek(weekGroup)}>
            {expandedWeeks[weekGroup] ? '▼' : '►'} {weekGroup}
          </h3>

          {expandedWeeks[weekGroup] &&
            Object.entries(dates).map(([dayGroup, offers]) => (
              <div
  key={dayGroup}
  style={{
    margin: '0 auto 15px',
    padding: '0 10px',
    maxWidth: '100%',
    boxSizing: 'border-box'
  }}
>
                <h4
                  style={{ textTransform: 'capitalize', cursor: 'pointer' }}
                  onClick={() => toggleDay(dayGroup)}
                >
                  {expandedDays[dayGroup] ? '▼' : '►'} {dayGroup}
                </h4>

                {expandedDays[dayGroup] &&
                  offers.map((offer) => {
                    const isOwner = currentUser?.id === offer.user_id;
                    const isExpanded = expandedOfferId === offer.id;
                    const primaryScore = Number(String(offer.match_primary_score).replace('%','')) || 0;
                    const teammateScore = Number(String(offer.match_teammate_score).replace('%','')) || 0;
                    const rank1DeckLic = Array.isArray(offer.required_licenses) && offer.required_licenses[0] ? offer.required_licenses[0] : null;
                    const rank1EngineLic = Array.isArray(offer.required_engineering_licenses) && offer.required_engineering_licenses[0] ? offer.required_engineering_licenses[0] : null;
                    const rank1DocsRaw = Array.isArray(offer.required_documents) ? offer.required_documents : (typeof offer.required_documents === 'string' ? offer.required_documents.split(',').map((d) => d.trim()).filter(Boolean) : []);
                    const rank1DocsOnly = rank1DocsRaw.filter((doc) => doc !== rank1DeckLic && doc !== rank1EngineLic);
                    const rank2DeckLic = Array.isArray(offer.teammate_required_licenses) && offer.teammate_required_licenses[0] ? offer.teammate_required_licenses[0] : null;
                    const rank2EngineLic = Array.isArray(offer.teammate_required_engineering_licenses) && offer.teammate_required_engineering_licenses[0] ? offer.teammate_required_engineering_licenses[0] : null;
                    const rank2DocsRaw = Array.isArray(offer.teammate_required_documents) ? offer.teammate_required_documents : [];
                    const rank2DocsOnly = rank2DocsRaw.filter((doc) => doc !== rank2DeckLic && doc !== rank2EngineLic);
                    const hasRank1 = rank1DeckLic || rank1EngineLic || rank1DocsOnly.length > 0;
                    const hasRank2 = offer.team && (rank2DeckLic || rank2EngineLic || rank2DocsOnly.length > 0);
                    const hasAnyRequiredDocs = hasRank1 || hasRank2;
                    const remarkParagraphs = (() => {
                      const description = offer.description || '';
                      return description
                        .split(/\n{2,}/)
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean);
                    })();
                    const isShoreBased = offer.work_environment === 'Shore-based';
                    const languagesAvailable =
                      Boolean(
                        offer.language_1 ||
                          offer.language_1_fluency ||
                          offer.language_2 ||
                          offer.language_2_fluency
                      ) || (Array.isArray(offer.visas) && offer.visas.length > 0);
                    const renderLanguagesBlock = (className) =>
                      languagesAvailable ? (
                        <div className={`expanded-block ${className}`}>
                          <div className="field-pair">
                            {offer.language_1 && (
                              <div className="field-group">
                                <div className="field-label">Language</div>
                                <div className="field-value">{offer.language_1}</div>
                              </div>
                            )}

                            {offer.language_1_fluency && (
                              <div className="field-group">
                                <div className="field-label">Fluency</div>
                                <div className="field-value">{offer.language_1_fluency}</div>
                              </div>
                            )}

                            {offer.language_2 && (
                              <div className="field-group">
                                <div className="field-label">2nd Language</div>
                                <div className="field-value">{offer.language_2}</div>
                              </div>
                            )}

                            {offer.language_2_fluency && (
                              <div className="field-group">
                                <div className="field-label">Fluency</div>
                                <div className="field-value">{offer.language_2_fluency}</div>
                              </div>
                            )}

                            {Array.isArray(offer.visas) && offer.visas.length > 0 && (
                              <div className="field-group visas">
                                <div className="field-label">Visa(s)</div>
                                <div className="field-value">{offer.visas.join(', ')}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null;
                    const renderShoreStartBlock = () => {
                      const hasStart = offer.is_asap || offer.start_date || offer.end_date;
                      if (!hasStart) return null;
                      return (
                        <div className="expanded-block block3">
                          <div className="field-pair">
                            {offer.type && (
                              <div className="field-group terms">
                                <div className="field-label">Terms</div>
                                <div className="field-value">{offer.type}</div>
                              </div>
                            )}

                            {(offer.is_asap || offer.start_date) && (
                              <div className="field-group">
                                <div className="field-label">Start Date</div>
                                <div className="field-value">
                                  {offer.is_asap
                                    ? 'ASAP'
                                    : offer.is_flexible
                                      ? 'Flexible'
                                      : formatDate(offer.start_date, offer.start_date_month_only)}
                                </div>
                              </div>
                            )}

                            {offer.end_date && (
                              <div className="field-group">
                                <div className="field-label">End Date</div>
                                <div className="field-value">{formatDate(offer.end_date, offer.end_date_month_only)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    };
                    const renderShoreLocationBlock = () => {
                      const workLocation = offer.city ? 'On-Site' : 'Remote';
                      return (
                        <div className="expanded-block block4">
                          <div className="field-pair">
                            <div className="field-group">
                              <div className="field-label">Work Location</div>
                              <div className="field-value">{workLocation}</div>
                            </div>
                            {offer.city && (
                              <div className="field-group">
                                <div className="field-label">City</div>
                                <div className="field-value">{offer.city}</div>
                              </div>
                            )}
                            {offer.country && (
                              <div className="field-group">
                                <div className="field-label">Country</div>
                                <div className="field-value">{offer.country}</div>
                              </div>
                            )}
                            {offer.contact_email && (
                              <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                                <div
                                  className="field-label"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    whiteSpace: 'nowrap',
                                    position: 'relative',
                                  }}
                                >
                                  <span>Email</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(offer.contact_email, 'email');
                                    }}
                                    title="Copy email"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '1em',
                                      color: '#007BFF',
                                      padding: 0,
                                      marginLeft: '4px',
                                      lineHeight: 1,
                                      display: 'inline-block',
                                    }}
                                  >
                                    📋
                                  </button>
                                  {copiedField === 'email' && (
                                    <span
                                      style={{
                                        position: 'absolute',
                                        top: '-1.5em',
                                        left: '0',
                                        fontSize: '0.75rem',
                                        color: 'green',
                                      }}
                                    >
                                      Copied!
                                    </span>
                                  )}
                                </div>
                                <div
                                  className="field-value email"
                                  style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                  title={offer.contact_email}
                                >
                                  {offer.contact_email}
                                </div>
                              </div>
                            )}
                            {offer.contact_phone && (
                              <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                                <div
                                  className="field-label"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    whiteSpace: 'nowrap',
                                    position: 'relative',
                                  }}
                                >
                                  <span>Phone</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(offer.contact_phone, 'phone');
                                    }}
                                    title="Copy phone"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '1em',
                                      color: '#007BFF',
                                      padding: 0,
                                      marginLeft: '4px',
                                      lineHeight: 1,
                                      display: 'inline-block',
                                    }}
                                  >
                                    📋
                                  </button>
                                  {copiedField === 'phone' && (
                                    <span
                                      style={{
                                        position: 'absolute',
                                        top: '-1.5em',
                                        left: '0',
                                        fontSize: '0.75rem',
                                        color: 'green',
                                      }}
                                    >
                                      Copied!
                                    </span>
                                  )}
                                </div>
                                <div
                                  className="field-value email"
                                  style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                  title={offer.contact_phone}
                                >
                                  {offer.contact_phone}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    };
                    return (
                      <div
                        key={offer.id}
                        id={`offer-${offer.id}`}
                        ref={(el) => { if (el) cardRefs.current[offer.id] = el; }}
                        onClick={() => toggleExpanded(offer.id)}
                        className={`offer-card ${isExpanded ? 'expanded' : ''} ${markedOffers.includes(offer.id) ? 'marked' : ''}`}
                      >
                        {isExpanded ? (
  <div className="offer-content">
    <div className="top-row">
    <div className={`expanded-block block1 ${
  offer.team
    ? offer.is_doe
      ? offer.years_in_rank !== null && offer.years_in_rank !== undefined
        ? 'case3'
        : 'case4'
      : offer.years_in_rank !== null && offer.years_in_rank !== undefined
        ? 'case1'
        : 'case2'
    : ''
} ${offer.teammate_rank && (offer.teammate_experience === null || offer.teammate_experience === undefined) ? 'no-rank2' : ''} ${Array.isArray(offer.required_licenses) && offer.required_licenses.length > 0 ? 'has-license' : ''} ${Array.isArray(offer.required_engineering_licenses) && offer.required_engineering_licenses.length > 0 ? 'has-engineering-license' : ''} ${(offer.years_in_rank !== null && offer.years_in_rank !== undefined) ? 'has-time-in-rank' : ''}`}>
  <div className="field-pair">
    {offer.title && (
      <div className="field-group position">
        <div className="field-label">Position</div>
        <div className="field-value">{offer.title}</div>
      </div>
    )}

    {Array.isArray(offer.required_licenses) && offer.required_licenses.length > 0 && (
      <div className="field-group license">
        <div className="field-label">License</div>
        <div className="field-value">{offer.required_licenses[0]}</div>
      </div>
    )}
    {Array.isArray(offer.required_engineering_licenses) && offer.required_engineering_licenses.length > 0 && (
      <div className="field-group engineering-license">
        <div className="field-label">Engineering License</div>
        <div className="field-value">{offer.required_engineering_licenses[0]}</div>
      </div>
    )}
    {(offer.years_in_rank !== null && offer.years_in_rank !== undefined) && (
      <div className="field-group time-in-rank">
        <div className="field-label">Time in Rank</div>
        <div className="field-value">
          {offer.years_in_rank === 0 ? 'Green' : offer.years_in_rank === -1 ? 'New in rank welcome' : `> ${offer.years_in_rank}`}
        </div>
      </div>
    )}

    {isShoreBased && offer.gender && (
      <div className="field-group">
        <div className="field-label">Sex</div>
        <div className="field-value">{offer.gender}</div>
      </div>
    )}

    {(offer.is_doe || offer.salary) && (
      <div className="field-group salary">
        <div className="field-label">Salary</div>
        <div className="field-value">{formatSalary(offer)}</div>
      </div>
    )}

    {offer.teammate_rank && (
  <div className="field-group position2">
    <div className="field-label">Position (2)</div>
    <div className="field-value">{offer.teammate_rank}</div>
  </div>
)}

{(offer.teammate_experience === null || offer.teammate_experience === undefined) && offer.teammate_salary && (
    <div className="field-group salary2">
      <div className="field-label">Salary (2)</div>
      <div className="field-value">
      {formatSalaryValue(offer.salary_currency, offer.teammate_salary, offer.is_tips)}
      </div>
    </div>
)}

{(offer.teammate_experience !== null && offer.teammate_experience !== undefined) && (
  <div className="field-group time-in-rank2">
    <div className="field-label">Time in Rank</div>
    <div className="field-value">
      {offer.teammate_experience === 0 ? 'Green' : offer.teammate_experience === -1 ? 'New in rank welcome' : `> ${offer.teammate_experience}`}
    </div>
  </div>
)}

{(offer.teammate_experience !== null && offer.teammate_experience !== undefined) && offer.teammate_salary && (
  <div className="field-group salary2">
    <div className="field-label">Salary (2)</div>
    <div className="field-value">
      {formatSalaryValue(offer.salary_currency, offer.teammate_salary, offer.is_tips)}
    </div>
  </div>
)}

    {!isShoreBased && offer.type && (
      <div className="field-group terms">
        <div className="field-label">Terms</div>
        <div className="field-value">{offer.type}</div>
      </div>
    )}
    {/* Sex (al final del bloque 1) */}
{!offer.team && offer.gender && !isShoreBased && (
  <div className="field-group gender">
    <div className="field-label">Sex</div>
    <div className="field-value">{offer.gender}</div>
  </div>
)}
  </div>
</div>
      {isShoreBased ? (
        <>
          {renderLanguagesBlock('block2')}
          {renderShoreStartBlock()}
          {renderShoreLocationBlock()}
        </>
      ) : (
        <>
      {(offer.yacht_type ||
  (offer.yacht_size && offer.work_environment !== 'Shore-based') ||
  offer.propulsion_type ||
  offer.flag ||
  offer.uses ||
  offer.season_type) && (

  <div className="expanded-block block2">
  <div className="field-pair">
    {offer.yacht_type && (
      <div className="field-group">
        <div className="field-label">Yacht Type</div>
        <div className="field-value">{offer.yacht_type}</div>
      </div>
    )}

    {offer.yacht_size && offer.work_environment !== 'Shore-based' && (
      <div className="field-group">
        <div className="field-label">Size</div>
        <div className="field-value">{offer.yacht_size}</div>
      </div>
    )}

    {offer.propulsion_type &&
  offer.work_environment !== 'Shore-based' &&
  ['captain', 'relief captain', 'skipper', 'captain/engineer'].some(t =>
    (offer.title || '').toLowerCase().includes(t)
  ) && (
    <div className="field-group propulsion">
      <div className="field-label">Propulsion</div>
      <div className="field-value">{offer.propulsion_type}</div>
    </div>
)}

    {offer.flag && (
      <div className="field-group">
        <div className="field-label">Flag</div>
        <div className="field-value">{offer.flag}</div>
      </div>
    )}

    {offer.uses && (
      <div className="field-group">
        <div className="field-label">Use</div>
        <div className="field-value">{offer.uses}</div>
      </div>
    )}

    {offer.season_type && (
      <div className="field-group">
        <div className="field-label">Season Type</div>
        <div className="field-value">{offer.season_type}</div>
      </div>
    )}
  </div>
</div>
)}

          {renderLanguagesBlock('block3')}

      <div className="expanded-block block4">
  <div className="field-pair">
    {offer.homeport && (
      <div className="field-group">
        <div className="field-label">Homeport</div>
        <div className="field-value">{offer.homeport}</div>
      </div>
    )}
    
    {offer.is_smoke_free_yacht && (
      <div className="field-group">
        <div className="field-label">Smoke-free yacht</div>
        <div className="field-value">Yes</div>
      </div>
    )}

    {offer.is_dry_boat && (
      <div className="field-group">
        <div className="field-label">Dry boat</div>
        <div className="field-value">Yes</div>
      </div>
    )}

    {offer.is_no_visible_tattoos && (
      <div className="field-group">
        <div className="field-label">No visible tattoos</div>
        <div className="field-value">Yes</div>
      </div>
    )}

    {(offer.is_asap || offer.start_date) && (
      <div className="field-group">
        <div className="field-label">Start Date</div>
        <div className="field-value">
          {offer.is_asap
            ? 'ASAP'
            : offer.is_flexible
              ? 'Flexible'
              : formatDate(offer.start_date, offer.start_date_month_only)}
        </div>
      </div>
    )}

    {offer.end_date && (
      <div className="field-group">
        <div className="field-label">End Date</div>
        <div className="field-value">{formatDate(offer.end_date, offer.end_date_month_only)}</div>
      </div>
    )}

    {offer.liveaboard && (
      <div className="field-group">
        <div className="field-label">Liveaboard</div>
        <div className="field-value">{offer.liveaboard}</div>
      </div>
    )}

    {offer.holidays && (
      <div className="field-group">
        <div className="field-label">Holidays per year</div>
        <div className="field-value">{offer.holidays}</div>
      </div>
    )}
  </div>
</div>

      <div className="expanded-block block5">
  <div className="field-pair">
    {offer.city && (
      <div className="field-group">
        <div className="field-label">City</div>
        <div className="field-value">{offer.city}</div>
      </div>
    )}

    {offer.country && (
      <div className="field-group">
        <div className="field-label">Country</div>
        <div className="field-value">{offer.country}</div>
      </div>
    )}

    {offer.local_candidates_only && (
      <div className="field-group">
        <div className="field-label">Local candidates only</div>
        <div className="field-value">Yes</div>
      </div>
    )}

    {offer.contact_email && (
  <div className="field-group" style={{ gridColumn: '1 / -1' }}>
    <div
      className="field-label"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}
    >
      <span>Email</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCopy(offer.contact_email, 'email');
        }}
        title="Copy email"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1em',
          color: '#007BFF',
          padding: 0,
          marginLeft: '4px',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        📋
      </button>
      {copiedField === 'email' && (
        <span
          style={{
            position: 'absolute',
            top: '-1.5em',
            left: '0',
            fontSize: '0.75rem',
            color: 'green',
          }}
        >
          Copied!
        </span>
      )}
    </div>
                                <div
                                  className="field-value email"
                                  style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                  title={offer.contact_email}
                                >
                                  {offer.contact_email}
                                </div>
  </div>
)}

    {offer.contact_phone && (
  <div className="field-group" style={{ gridColumn: '1 / -1' }}>
    <div
      className="field-label"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}
    >
      <span>Phone</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCopy(offer.contact_phone, 'phone');
        }}
        title="Copy phone"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1em',
          color: '#007BFF',
          padding: 0,
          marginLeft: '4px',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        📋
      </button>
      {copiedField === 'phone' && (
        <span
          style={{
            position: 'absolute',
            top: '-1.5em',
            left: '0',
            fontSize: '0.75rem',
            color: 'green',
          }}
        >
          Copied!
        </span>
      )}
    </div>
    <div
      className="field-value email"
      style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      title={offer.contact_phone}
    >
      {offer.contact_phone}
    </div>
  </div>
)}
  </div>
</div>
        </>
      )}
    </div>

    {hasAnyRequiredDocs && (
  <div className="expanded-block block6 required-docs-block">
    <div className="field-label">Required Documents / Certifications</div>
    <div className="field-value">
      {hasRank1 && (
        <>
          {offer.team && <div className="required-docs-rank-label">{offer.title}:</div>}
          <div className="required-docs-grid">
            {rank1DeckLic && <span className="required-doc-chip">{rank1DeckLic}</span>}
            {rank1EngineLic && <span className="required-doc-chip">{rank1EngineLic}</span>}
            {rank1DocsOnly.map((doc, index) => (
              <span key={`r1-${doc}-${index}`} className="required-doc-chip">{doc}</span>
            ))}
          </div>
        </>
      )}
      {hasRank2 && (
        <>
          {offer.team && <div className="required-docs-rank-label">{offer.teammate_rank}:</div>}
          <div className="required-docs-grid">
            {rank2DeckLic && <span className="required-doc-chip">{rank2DeckLic}</span>}
            {rank2EngineLic && <span className="required-doc-chip">{rank2EngineLic}</span>}
            {rank2DocsOnly.map((doc, index) => (
              <span key={`r2-${doc}-${index}`} className="required-doc-chip">{doc}</span>
            ))}
          </div>
        </>
      )}
    </div>
  </div>
)}

    <div className="expanded-block block6">
      <div className="field-label">Remarks</div>
      <div className="field-value remarks-content">
        {remarkParagraphs.map((paragraph, index) => (
          <p
            key={index}
            style={{
              whiteSpace: 'pre-line',
              marginBottom: '12px',
              textAlign: 'justify',
            }}
          >
            {paragraph}
          </p>
        ))}
        <p className="remarks-disclaimer">
          {REMARKS_DISCLAIMER}
        </p>
      </div>
    </div>

    <div className="expanded-block block7">
  <div className="job-share-bar" style={iconBarStyle} onClick={(e) => e.stopPropagation()}>
    {showNativeShare ? (
      <button
        type="button"
        onClick={(e) => handleShare(offer, e)}
        style={roundBtn}
        aria-label="Share"
        title="Share"
      >
        <span className="material-icons" style={shareIcon}>ios_share</span>
      </button>
    ) : (
      <>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleWhatsApp(offer); }}
          style={waBtn}
          aria-label="Share on WhatsApp"
          title="Share on WhatsApp"
        >
          <img src="/icons/whatsapp.svg" alt="" style={iconImg} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleCopyLink(offer.id); }}
          style={roundBtn}
          aria-label="Copy share link"
          title="Copy link"
        >
          <img src="/icons/link.svg" alt="" style={iconImg} />
        </button>
      </>
    )}
  </div>
  {!isOwner && (
    <div className="chat-actions">
      <button
        className="direct-apply-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleDirectApply(offer.id);
        }}
        type="button"
        disabled={appliedOfferIds?.has?.(offer.id)}
        title={appliedOfferIds?.has?.(offer.id) ? 'Application submitted' : undefined}
      >
        {appliedOfferIds?.has?.(offer.id) ? 'Application Submitted' : 'Direct Application'}
      </button>
      <button
        className={`start-chat-btn ${offer.is_private_chat_enabled === false ? 'start-chat-btn--disabled' : ''}`}
        disabled={offer.is_private_chat_enabled === false}
        onClick={(e) => {
          e.stopPropagation();
          if (offer.is_private_chat_enabled === false) return;
          if (currentUser) {
            handleRequestChat(offer.id, offer.user_id);
          } else {
            handleShowChatLoginInfo();
          }
        }}
        aria-disabled={offer.is_private_chat_enabled === false || !currentUser}
        title={
          offer.is_private_chat_enabled === false
            ? 'Private chat is disabled for this offer.'
            : !currentUser
              ? 'Sign in to start a private chat.'
              : undefined
        }
        style={
          !currentUser && offer.is_private_chat_enabled !== false
            ? { opacity: 0.6, cursor: 'not-allowed' }
            : undefined
        }
      >
        {offer.is_private_chat_enabled === false ? 'Private Chat disabled' : 'Start Private Chat'}
      </button>
    </div>
  )}
</div>
  </div>
) : (
<div className={`collapsed-offer${offer.team ? ' team' : ''}`}>
<div className="collapsed-images">
  {isMobile ? (
    offer.team ? (
      showAvatarMobile ? (
        <MatchBorder score={primaryScore}>
          <div className="mobile-team-avatar role-icon">
            <Avatar
              nickname={authors[offer.user_id] || 'User'}
              srcUrl={authorAvatars[offer.user_id] || null}
              size={96}
              shape="square"
              radius={0}
              style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />
          </div>
        </MatchBorder>
      ) : (
        <>
  <MatchBorder score={primaryScore}>
    <ThemeLogo
      light={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebased' : getRoleImage(offer.title)}.png`}
      dark={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebasedDM' : getRoleImage(offer.title) + 'DM'}.png`}
      alt="role"
      className="role-icon"
    />
  </MatchBorder>

  {offer.team && offer.teammate_rank && (
    <MatchBorder score={teammateScore}>
      <ThemeLogo
        light={`/logos/roles/${getRoleImage(offer.teammate_rank)}.png`}
        dark={`/logos/roles/${getRoleImage(offer.teammate_rank)}DM.png`}
        alt="teammate role"
        className="role-icon"
      />
    </MatchBorder>
  )}
</>
      )
    ) : (
    showAvatarMobile ? (
    <MatchBorder score={primaryScore}>
      <div className="mobile-avatar-slot role-icon">
        <Avatar
          nickname={authors[offer.user_id] || 'User'}
          srcUrl={authorAvatars[offer.user_id] || null}
          size={96}
          shape="square"
          radius={0}
          style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      </div>
    </MatchBorder>
      ) : (
        <MatchBorder score={primaryScore}>
      <ThemeLogo
        light={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebased' : getRoleImage(offer.title)}.png`}
        dark={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebasedDM' : getRoleImage(offer.title) + 'DM'}.png`}
        alt="role"
        className="role-icon"
      />
    </MatchBorder>
  )
)
  ) : (
  <>
    <MatchBorder score={primaryScore}>
      <ThemeLogo
        light={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebased' : getRoleImage(offer.title)}.png`}
        dark={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebasedDM' : getRoleImage(offer.title) + 'DM'}.png`}
        alt="role"
        className="role-icon"
      />
    </MatchBorder>

    {offer.team && offer.teammate_rank && (
      <MatchBorder score={teammateScore}>
        <ThemeLogo
          light={`/logos/roles/${getRoleImage(offer.teammate_rank)}.png`}
          dark={`/logos/roles/${getRoleImage(offer.teammate_rank)}DM.png`}
          alt="teammate role"
          className="role-icon"
        />
      </MatchBorder>
    )}

    {!isMobile && (
      <div className="recruiter-tile">
        <div className="recruiter-label">RECRUITER</div>
        <div className="recruiter-avatar-wrap">
          <Avatar
            nickname={authors[offer.user_id] || 'User'}
            srcUrl={authorAvatars[offer.user_id] || null}
            size={96}
            shape="square"
            radius={0}
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 12,
              display: 'block'
            }}
          />
        </div>
      </div>
    )}
  </>
)}
</div>
<div className="collapsed-info-row">
  {isMobile ? (

  <div className="collapsed-column collapsed-primary">
    {/* Rank */}
    <span className="rank-fixed">{offer.title}</span>

    {/* Salary */}
    <div className="salary-line">
      <strong>Salary:</strong>{' '}
      {formatSalary(offer)}
    </div>

    {/* Rank 2 */}
    {offer.team && offer.teammate_rank && (
      <div className="rank-fixed">{offer.teammate_rank}</div>
    )}


    {/* Salary 2 */}
    {offer.team && offer.teammate_salary && (
      <div className="salary-line">
        <strong>Salary:</strong>{' '}
        {formatSalaryValue(offer.salary_currency, offer.teammate_salary, offer.is_tips)}
      </div>
    )}

    {/* SHORE-BASED */}
    {offer.work_environment === 'Shore-based' ? (
      <>
        <div className="salary-line">
          <strong>Work Location:</strong> {offer.city ? 'On-Site' : 'Remote'}
        </div>
        {offer.city && (
          <div className="salary-line">
            <strong>City:</strong> {offer.city}
          </div>
        )}
        {offer.city && offer.country && (
          <div className="salary-line">
            <strong>Country:</strong> {offer.country}
          </div>
        )}
      </>
    ) : (
      <>
        {/* NO Shore-based */}
        {offer.yacht_type && (
          <div className="salary-line">
            <strong>Yacht Type:</strong> {offer.yacht_type}
          </div>
        )}
        {offer.yacht_size && (
          <div className="salary-line">
            <strong>Size:</strong> {offer.yacht_size}
          </div>
        )}
        {offer.city && (
          <div className="salary-line">
            <strong>City:</strong> {offer.city}
          </div>
        )}
        {offer.country && (
          <div className="salary-line">
            <strong>Country:</strong> {offer.country}
          </div>
        )}
      </>
    )}
  </div>
) : (
  // 🔸 VERSIÓN PARA PANTALLAS GRANDES — SIN CAMBIOS
  <div className="collapsed-column collapsed-primary">
    <span className="rank-fixed">{offer.title}</span>
    {offer.team && offer.teammate_rank && (
      <div className="rank-fixed">{offer.teammate_rank}</div>
    )}
    {offer.work_environment === 'Shore-based' && (
      <div className="salary-line">
        <strong>Work Location:</strong> {offer.city ? 'On-Site' : 'Remote'}
      </div>
    )}
    {offer.yacht_type && (
      <div className="salary-line">
        <strong>Yacht Type:</strong> {offer.yacht_type}
      </div>
    )}
    {offer.city && (
      <div className="salary-line">
        <strong>City:</strong> {offer.city}
      </div>
    )}
  </div>
)}

  {!isMobile && (
  <div className="collapsed-column collapsed-secondary">
    {offer.team ? (
      <>
        {/* Línea 1: Salary */}
        <div className="salary-line">
          <strong>Salary:</strong>{' '}
          {formatSalary(offer)}
        </div>

        {/* Línea 2: Teammate Salary o espacio vacío */}
        <div className="salary-line">
          {offer.teammate_salary ? (
            <>
              <strong>Salary:</strong>{' '}
              {formatSalaryValue(offer.salary_currency, offer.teammate_salary, offer.is_tips)}
            </>
          ) : (
            '\u00A0'
          )}
        </div>

        {/* Línea 3: Size (reservada si shore-based) */}
        <div className="salary-line">
          {offer.work_environment !== 'Shore-based' && offer.yacht_size ? (
            <>
              <strong>Size:</strong> {offer.yacht_size}
            </>
          ) : (
            '\u00A0'
          )}
        </div>

        {/* Línea 4: Country (ocultar si shore-based && remote) */}
        {!(offer.work_environment === 'Shore-based' && !offer.city) && (
          <div className="salary-line">
            <strong>Country:</strong> {offer.country}
          </div>
        )}
      </>
    ) : (
      <>
        {/* Línea 1: Salary */}
        <div className="salary-line">
          <strong>Salary:</strong>{' '}
          {formatSalary(offer)}
        </div>

        {/* Línea 2: Size (reservada si shore-based) */}
        <div className="salary-line">
          {offer.work_environment !== 'Shore-based' && offer.yacht_size ? (
            <>
              <strong>Size:</strong> {offer.yacht_size}
            </>
          ) : (
            '\u00A0'
          )}
        </div>

        {/* Línea 3: Country (ocultar si shore-based && remote) */}
        {!(offer.work_environment === 'Shore-based' && !offer.city) && (
          <div className="salary-line">
            <strong>Country:</strong> {offer.country}
          </div>
        )}
      </>
    )}
  </div>
)}

<div className="collapsed-footer">
  {isTodayLocal(offer.created_at) && (
    <div className="posted-timestamp-collapsed">
      <strong>Posted:</strong> {formatTime(offer.created_at)}
    </div>
  )}
  <div
    className="tick-marker"
    onClick={(e) => {
      e.stopPropagation();
      toggleMark(offer.id);
    }}
  >
    {markedOffers.includes(offer.id) ? '✔' : ''}
  </div>
</div>
</div>
</div>
)}
</div>
                    );
                  })}
              </div>
            ))}
        </div>
      ))}

      {offersLoading && (
        <LoadingSpinner message="Loading offers..." />
      )}
      {!offersLoading && Object.keys(groupedOffers).length === 0 && (
        <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
          No matching offers found.
        </p>
      )}

    </>
  );
};

export default OfferTimeline;
