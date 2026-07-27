import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeLogo from './ThemeLogo';
import '../LandingPage.css';

const FEATURE_PROMOS = [
  {
    id: 'cv',
    eyebrow: 'Shareable Profile',
    title: 'Digital CV',
    description:
      'Turn your candidate profile into a polished public page you can share with recruiters, captains, and agencies.',
    ctaLabel: 'Explore profile tools',
    accentClass: 'cv',
    lightImage: '/images/landing/digital-cv-light.png',
    darkImage: '/images/landing/digital-cv-dark.png',
  },
  {
    id: 'card',
    eyebrow: 'Scan and connect',
    title: 'Business Card',
    description:
      'Convert your profile into a compact business card with QR access, ready to open your CV in one scan.',
    ctaLabel: 'View card workflow',
    accentClass: 'card',
    lightImage: '/images/landing/business-card-light.png',
    darkImage: '/images/landing/business-card-dark.png',
  },
  {
    id: 'crew',
    eyebrow: 'Quick intro card',
    title: 'SeaCrew Card',
    description:
      'Stay discoverable to employers with a fast visual profile that shows key hiring details without exposing personal information.',
    ctaLabel: 'See crew identity tools',
    accentClass: 'crew',
    lightImage: '/images/landing/seacrew-card-light.png',
    darkImage: '/images/landing/seacrew-card-dark.png',
  },
];

function SeaJobsPromoCard({ promo, compact = false, inline = false, active = false, onSelect }) {
  const handleClick = () => {
    if (typeof onSelect === 'function') onSelect();
  };

  return (
    <article
      className={[
        'seajobs-feature-promo-card',
        `seajobs-feature-promo-card--${promo.accentClass}`,
        compact ? 'is-compact' : '',
        inline ? 'is-inline' : '',
        active ? 'is-active' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="seajobs-feature-promo-visual" aria-hidden="true">
        <ThemeLogo
          light={promo.lightImage}
          dark={promo.darkImage}
          alt={`${promo.title} preview`}
          className="seajobs-feature-promo-image"
        />
      </div>
      <div className="seajobs-feature-promo-copy">
        <p className="seajobs-feature-promo-eyebrow">{promo.eyebrow}</p>
        <h3>{promo.title}</h3>
        <p>{promo.description}</p>
        <button
          type="button"
          className="seajobs-feature-promo-link"
          onClick={handleClick}
        >
          {promo.ctaLabel}
        </button>
      </div>
    </article>
  );
}

export function SeaJobsFeatureRail({ currentUser }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeFeatureModal, setActiveFeatureModal] = useState('');

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % FEATURE_PROMOS.length);
    }, 5000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeFeatureModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveFeatureModal('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeFeatureModal]);

  const activePromo = FEATURE_PROMOS[activeIndex];
  const closeFeatureModal = () => setActiveFeatureModal('');
  const handleFeaturePrimaryAction = () => {
    closeFeatureModal();
    navigate(currentUser ? '/profile?tab=cv' : '/register');
  };
  const handleSeaCrewAction = () => {
    closeFeatureModal();
    navigate('/yacht-works?tab=crew');
  };

  return (
    <>
      <aside className="seajobs-feature-rail" aria-label="Featured crew tools">
        <div className="seajobs-feature-rail-inner">
          <p className="seajobs-feature-rail-kicker">Featured Tools</p>
          <div className="seajobs-feature-rail-stage">
            <SeaJobsPromoCard
              promo={activePromo}
              compact
              active
              onSelect={() => setActiveFeatureModal(activePromo.id)}
            />
          </div>
          <div className="seajobs-feature-rail-dots" aria-hidden="true">
            {FEATURE_PROMOS.map((promo, index) => (
              <button
                key={promo.id}
                type="button"
                className={`seajobs-feature-rail-dot${index === activeIndex ? ' is-active' : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${promo.title}`}
              />
            ))}
          </div>
        </div>
      </aside>

      {activeFeatureModal === 'cv' && (
        <div
          className="modal-overlay feature-promo-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="digital-cv-modal-title-seajobs"
          onClick={closeFeatureModal}
        >
          <div
            className="modal-content-wrapper feature-promo-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-button feature-promo-modal-close"
              aria-label="Close Digital CV details"
              onClick={closeFeatureModal}
            >
              &times;
            </button>

            <div className="feature-promo-modal-hero">
              <p className="feature-promo-modal-kicker">Digital CV</p>
              <h2 id="digital-cv-modal-title-seajobs">A live candidate profile built to be shared</h2>
              <p className="feature-promo-modal-intro">
                Your Digital CV is not just a prettier CV. It is a controlled public profile with a unique link, analytics, media, documents, and profile updates that stay live without needing to resend a new version every time.
              </p>
            </div>

            <div className="feature-promo-modal-showcase">
              <ThemeLogo
                light="/images/landing/digital-cv-light.png"
                dark="/images/landing/digital-cv-dark.png"
                alt="Digital CV modal preview"
                className="feature-promo-modal-visual-image"
              />

              <ul className="feature-promo-modal-highlights">
                <li className="feature-promo-modal-highlightItem">Unique public link and QR access</li>
                <li className="feature-promo-modal-highlightItem">Analytics for views, traffic, and locations</li>
                <li className="feature-promo-modal-highlightItem">Image and video gallery</li>
                <li className="feature-promo-modal-highlightItem">Document storage for recruiter-facing files</li>
                <li className="feature-promo-modal-highlightItem">Visibility controls for CV and selected public content</li>
                <li className="feature-promo-modal-highlightItem">Live updates without resending a new link</li>
              </ul>
            </div>

            <div className="feature-promo-modal-story">
              <section className="feature-promo-modal-panel feature-promo-modal-panel--wide">
                <h3>Why it is stronger than a static PDF</h3>
                <p>
                  A PDF goes out of date the moment you change something. Your Digital CV stays connected to your profile,
                  so when you update experience, documents, media, or contact details, the shared page reflects the current version without changing the link.
                </p>
              </section>

              <section className="feature-promo-modal-panel">
                <h3>What you can control</h3>
                <ul>
                  <li>Who sees your public-facing CV</li>
                  <li>Which media you want visible</li>
                  <li>Public contact details and visibility settings</li>
                  <li>Whether your profile stays active for sharing</li>
                </ul>
              </section>

              <section className="feature-promo-modal-panel">
                <h3>How it is created</h3>
                <ol>
                  <li>Complete your Lite profile to 100%</li>
                  <li>Add your experience, media, and core documents</li>
                  <li>Unlock your Digital CV automatically</li>
                  <li>Share the same live link anywhere you need</li>
                </ol>
              </section>
            </div>

            <div className="feature-promo-modal-footer">
              <div className="feature-promo-modal-note">Completely free to create and use.</div>
              <button
                type="button"
                className="feature-promo-modal-btn feature-promo-modal-btn--primary"
                onClick={handleFeaturePrimaryAction}
              >
                {currentUser ? 'Go to my profile' : 'Register to create yours'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFeatureModal === 'card' && (
        <div
          className="modal-overlay feature-promo-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="business-card-modal-title-seajobs"
          onClick={closeFeatureModal}
        >
          <div
            className="modal-content-wrapper feature-promo-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-button feature-promo-modal-close"
              aria-label="Close Business Card details"
              onClick={closeFeatureModal}
            >
              &times;
            </button>

            <div className="feature-promo-modal-hero">
              <p className="feature-promo-modal-kicker">Business Card</p>
              <h2 id="business-card-modal-title-seajobs">A compact card built for fast sharing and first contact</h2>
              <p className="feature-promo-modal-intro">
                Your Business Card turns profile data into a polished share-ready card with a QR that opens your Digital CV, so you can introduce yourself faster on WhatsApp, email, social media, or in person.
              </p>
            </div>

            <div className="feature-promo-modal-showcase feature-promo-modal-showcase--card">
              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--card-top">
                <li className="feature-promo-modal-highlightItem">QR code linked to your live Digital CV</li>
                <li className="feature-promo-modal-highlightItem">Compact format for quick introductions</li>
              </ul>

              <ThemeLogo
                light="/images/landing/business-card-light.png"
                dark="/images/landing/business-card-dark.png"
                alt="Business Card modal preview"
                className="feature-promo-modal-visual-image"
              />

              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--card-bottom">
                <li className="feature-promo-modal-highlightItem">Download as PNG or PDF for print or direct send</li>
              </ul>

              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--card-bottom-full">
                <li className="feature-promo-modal-highlightItem">Light and dark card styles for different sharing contexts</li>
                <li className="feature-promo-modal-highlightItem">A persistent QR that keeps working even if your public CV link is rotated or replaced</li>
              </ul>
            </div>

            <div className="feature-promo-modal-story">
              <section className="feature-promo-modal-panel feature-promo-modal-panel--wide">
                <h3>Why it works alongside your Digital CV</h3>
                <p>
                  The Business Card and Digital CV serve different roles and complement each other. The card is built for the first touchpoint:
                  a clean, compact way to introduce yourself quickly. From there, the QR opens the full Digital CV when someone wants the deeper view,
                  without forcing everything into the first message or meeting.
                </p>
              </section>

              <section className="feature-promo-modal-panel">
                <h3>Where it fits best</h3>
                <ul>
                  <li>WhatsApp, Instagram, and direct messages</li>
                  <li>Email signatures and quick follow-ups</li>
                  <li>Dockside meetings and networking moments</li>
                  <li>Printed sharing with instant QR access</li>
                </ul>
              </section>

              <section className="feature-promo-modal-panel">
                <h3>How it is created</h3>
                <ol>
                  <li>Complete your Lite profile to 100%</li>
                  <li>Unlock your public Digital CV link and QR</li>
                  <li>Open preview and choose light or dark mode</li>
                  <li>Copy or download the card anytime you need it</li>
                </ol>
              </section>
            </div>

            <div className="feature-promo-modal-footer">
              <div className="feature-promo-modal-note">Completely free to create and use.</div>
              <button
                type="button"
                className="feature-promo-modal-btn feature-promo-modal-btn--primary"
                onClick={handleFeaturePrimaryAction}
              >
                {currentUser ? 'Go to my profile' : 'Register to create yours'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFeatureModal === 'crew' && (
        <div
          className="modal-overlay feature-promo-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seacrew-card-modal-title-seajobs"
          onClick={closeFeatureModal}
        >
          <div
            className="modal-content-wrapper feature-promo-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-button feature-promo-modal-close"
              aria-label="Close SeaCrew Card details"
              onClick={closeFeatureModal}
            >
              &times;
            </button>

            <div className="feature-promo-modal-hero">
              <p className="feature-promo-modal-kicker">SeaCrew Card</p>
              <h2 id="seacrew-card-modal-title-seajobs">A crew directory card built to be found without oversharing</h2>
              <p className="feature-promo-modal-intro">
                SeaCrew Card is built to help employers discover candidates directly, even when they do not want to create a job post. It shows useful hiring signals like rank, location, status, availability, and experience, while keeping sensitive personal information out of view.
              </p>
            </div>

            <div className="feature-promo-modal-showcase feature-promo-modal-showcase--crew">
              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--crew-top">
                <li className="feature-promo-modal-highlightItem">Keeps personal information out of public view</li>
                <li className="feature-promo-modal-highlightItem">Uses Private Chat as the safe first contact channel</li>
              </ul>

              <ThemeLogo
                light="/images/landing/seacrew-card-light.png"
                dark="/images/landing/seacrew-card-dark.png"
                alt="SeaCrew Card modal preview"
                className="feature-promo-modal-visual-image"
              />

              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--crew-mid">
                <li className="feature-promo-modal-highlightItem">Lets employers browse crew profiles without needing to publish a job post</li>
                <li className="feature-promo-modal-highlightItem">Leaves the candidate in control of what gets shared next</li>
              </ul>

              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--crew-bottom-full">
                <li className="feature-promo-modal-highlightItem">Shows hiring essentials like rank, location, status, availability, and experience</li>
                <li className="feature-promo-modal-highlightItem">Stays available as an always-on profile in the SeaCrew directory</li>
              </ul>
            </div>

            <div className="feature-promo-modal-story">
              <section className="feature-promo-modal-panel feature-promo-modal-panel--wide">
                <h3>What makes SeaCrew Card different</h3>
                <p>
                  SeaCrew Card works like a live book of profiles for employers who want to search more directly. Instead of waiting for a candidate to apply or creating a public post,
                  an employer can discover people already visible in SeaCrew, review only the essential signals, and decide who to contact through Private Chat.
                </p>
              </section>

              <section className="feature-promo-modal-panel">
                <h3>What employers can see</h3>
                <ul>
                  <li>Photo, name, and rank at a glance</li>
                  <li>City, country, status, and availability</li>
                  <li>Experience level in a quick-read format</li>
                  <li>A direct option to start Private Chat</li>
                </ul>
              </section>

              <section className="feature-promo-modal-panel">
                <h3>How privacy stays protected</h3>
                <ol>
                  <li>Personal contact details are not exposed in the public card</li>
                  <li>First contact happens through Private Chat</li>
                  <li>The candidate decides what to reveal after contact starts</li>
                  <li>You can show or hide the SeaCrew card from preview whenever needed</li>
                </ol>
              </section>
            </div>

            <div className="feature-promo-modal-footer feature-promo-modal-footer--stacked">
              <div className="feature-promo-modal-note">Completely free to create and use.</div>
              <div className="feature-promo-modal-actionsRow">
                <button
                  type="button"
                  className="feature-promo-modal-btn feature-promo-modal-btn--secondary"
                  onClick={handleSeaCrewAction}
                >
                  Go to SeaCrew
                </button>
                <button
                  type="button"
                  className="feature-promo-modal-btn feature-promo-modal-btn--primary"
                  onClick={handleFeaturePrimaryAction}
                >
                  {currentUser ? 'Go to my profile' : 'Register to create yours'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SeaJobsInlinePromo({ currentUser, promoIndex = 0 }) {
  const navigate = useNavigate();
  const [activeFeatureModal, setActiveFeatureModal] = useState('');
  const promo = useMemo(
    () => FEATURE_PROMOS[((promoIndex % FEATURE_PROMOS.length) + FEATURE_PROMOS.length) % FEATURE_PROMOS.length],
    [promoIndex]
  );
  useEffect(() => {
    if (!activeFeatureModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveFeatureModal('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeFeatureModal]);

  const closeFeatureModal = () => setActiveFeatureModal('');
  const handleFeaturePrimaryAction = () => {
    closeFeatureModal();
    navigate(currentUser ? '/profile?tab=cv' : '/register');
  };
  const handleSeaCrewAction = () => {
    closeFeatureModal();
    navigate('/yacht-works?tab=crew');
  };

  return (
    <>
      <div className="seajobs-inline-promo-wrap">
        <SeaJobsPromoCard
          promo={promo}
          inline
          onSelect={() => setActiveFeatureModal(promo.id)}
        />
      </div>

      {activeFeatureModal === 'cv' && (
        <div
          className="modal-overlay feature-promo-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`digital-cv-modal-title-inline-${promoIndex}`}
          onClick={closeFeatureModal}
        >
          <div className="modal-content-wrapper feature-promo-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close-button feature-promo-modal-close" aria-label="Close Digital CV details" onClick={closeFeatureModal}>&times;</button>
            <div className="feature-promo-modal-hero">
              <p className="feature-promo-modal-kicker">Digital CV</p>
              <h2 id={`digital-cv-modal-title-inline-${promoIndex}`}>A live candidate profile built to be shared</h2>
              <p className="feature-promo-modal-intro">
                Your Digital CV is not just a prettier CV. It is a controlled public profile with a unique link, analytics, media, documents, and profile updates that stay live without needing to resend a new version every time.
              </p>
            </div>
            <div className="feature-promo-modal-showcase">
              <ThemeLogo light="/images/landing/digital-cv-light.png" dark="/images/landing/digital-cv-dark.png" alt="Digital CV modal preview" className="feature-promo-modal-visual-image" />
              <ul className="feature-promo-modal-highlights">
                <li className="feature-promo-modal-highlightItem">Unique public link and QR access</li>
                <li className="feature-promo-modal-highlightItem">Analytics for views, traffic, and locations</li>
                <li className="feature-promo-modal-highlightItem">Image and video gallery</li>
                <li className="feature-promo-modal-highlightItem">Document storage for recruiter-facing files</li>
                <li className="feature-promo-modal-highlightItem">Visibility controls for CV and selected public content</li>
                <li className="feature-promo-modal-highlightItem">Live updates without resending a new link</li>
              </ul>
            </div>
            <div className="feature-promo-modal-story">
              <section className="feature-promo-modal-panel feature-promo-modal-panel--wide">
                <h3>Why it is stronger than a static PDF</h3>
                <p>
                  A PDF goes out of date the moment you change something. Your Digital CV stays connected to your profile,
                  so when you update experience, documents, media, or contact details, the shared page reflects the current version without changing the link.
                </p>
              </section>
              <section className="feature-promo-modal-panel">
                <h3>What you can control</h3>
                <ul>
                  <li>Who sees your public-facing CV</li>
                  <li>Which media you want visible</li>
                  <li>Public contact details and visibility settings</li>
                  <li>Whether your profile stays active for sharing</li>
                </ul>
              </section>
              <section className="feature-promo-modal-panel">
                <h3>How it is created</h3>
                <ol>
                  <li>Complete your Lite profile to 100%</li>
                  <li>Add your experience, media, and core documents</li>
                  <li>Unlock your Digital CV automatically</li>
                  <li>Share the same live link anywhere you need</li>
                </ol>
              </section>
            </div>
            <div className="feature-promo-modal-footer">
              <div className="feature-promo-modal-note">Completely free to create and use.</div>
              <button type="button" className="feature-promo-modal-btn feature-promo-modal-btn--primary" onClick={handleFeaturePrimaryAction}>
                {currentUser ? 'Go to my profile' : 'Register to create yours'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFeatureModal === 'card' && (
        <div
          className="modal-overlay feature-promo-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`business-card-modal-title-inline-${promoIndex}`}
          onClick={closeFeatureModal}
        >
          <div className="modal-content-wrapper feature-promo-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close-button feature-promo-modal-close" aria-label="Close Business Card details" onClick={closeFeatureModal}>&times;</button>
            <div className="feature-promo-modal-hero">
              <p className="feature-promo-modal-kicker">Business Card</p>
              <h2 id={`business-card-modal-title-inline-${promoIndex}`}>A compact card built for fast sharing and first contact</h2>
              <p className="feature-promo-modal-intro">
                Your Business Card turns profile data into a polished share-ready card with a QR that opens your Digital CV, so you can introduce yourself faster on WhatsApp, email, social media, or in person.
              </p>
            </div>
            <div className="feature-promo-modal-showcase feature-promo-modal-showcase--card">
              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--card-top">
                <li className="feature-promo-modal-highlightItem">QR code linked to your live Digital CV</li>
                <li className="feature-promo-modal-highlightItem">Compact format for quick introductions</li>
              </ul>
              <ThemeLogo light="/images/landing/business-card-light.png" dark="/images/landing/business-card-dark.png" alt="Business Card modal preview" className="feature-promo-modal-visual-image" />
              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--card-bottom">
                <li className="feature-promo-modal-highlightItem">Download as PNG or PDF for print or direct send</li>
              </ul>
              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--card-bottom-full">
                <li className="feature-promo-modal-highlightItem">Light and dark card styles for different sharing contexts</li>
                <li className="feature-promo-modal-highlightItem">A persistent QR that keeps working even if your public CV link is rotated or replaced</li>
              </ul>
            </div>
            <div className="feature-promo-modal-story">
              <section className="feature-promo-modal-panel feature-promo-modal-panel--wide">
                <h3>Why it works alongside your Digital CV</h3>
                <p>
                  The Business Card and Digital CV serve different roles and complement each other. The card is built for the first touchpoint:
                  a clean, compact way to introduce yourself quickly. From there, the QR opens the full Digital CV when someone wants the deeper view,
                  without forcing everything into the first message or meeting.
                </p>
              </section>
              <section className="feature-promo-modal-panel">
                <h3>Where it fits best</h3>
                <ul>
                  <li>WhatsApp, Instagram, and direct messages</li>
                  <li>Email signatures and quick follow-ups</li>
                  <li>Dockside meetings and networking moments</li>
                  <li>Printed sharing with instant QR access</li>
                </ul>
              </section>
              <section className="feature-promo-modal-panel">
                <h3>How it is created</h3>
                <ol>
                  <li>Complete your Lite profile to 100%</li>
                  <li>Unlock your public Digital CV link and QR</li>
                  <li>Open preview and choose light or dark mode</li>
                  <li>Copy or download the card anytime you need it</li>
                </ol>
              </section>
            </div>
            <div className="feature-promo-modal-footer">
              <div className="feature-promo-modal-note">Completely free to create and use.</div>
              <button type="button" className="feature-promo-modal-btn feature-promo-modal-btn--primary" onClick={handleFeaturePrimaryAction}>
                {currentUser ? 'Go to my profile' : 'Register to create yours'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFeatureModal === 'crew' && (
        <div
          className="modal-overlay feature-promo-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`seacrew-card-modal-title-inline-${promoIndex}`}
          onClick={closeFeatureModal}
        >
          <div className="modal-content-wrapper feature-promo-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close-button feature-promo-modal-close" aria-label="Close SeaCrew Card details" onClick={closeFeatureModal}>&times;</button>
            <div className="feature-promo-modal-hero">
              <p className="feature-promo-modal-kicker">SeaCrew Card</p>
              <h2 id={`seacrew-card-modal-title-inline-${promoIndex}`}>A crew directory card built to be found without oversharing</h2>
              <p className="feature-promo-modal-intro">
                SeaCrew Card is built to help employers discover candidates directly, even when they do not want to create a job post. It shows useful hiring signals like rank, location, status, availability, and experience, while keeping sensitive personal information out of view.
              </p>
            </div>
            <div className="feature-promo-modal-showcase feature-promo-modal-showcase--crew">
              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--crew-top">
                <li className="feature-promo-modal-highlightItem">Keeps personal information out of public view</li>
                <li className="feature-promo-modal-highlightItem">Uses Private Chat as the safe first contact channel</li>
              </ul>
              <ThemeLogo light="/images/landing/seacrew-card-light.png" dark="/images/landing/seacrew-card-dark.png" alt="SeaCrew Card modal preview" className="feature-promo-modal-visual-image" />
              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--crew-mid">
                <li className="feature-promo-modal-highlightItem">Lets employers browse crew profiles without needing to publish a job post</li>
                <li className="feature-promo-modal-highlightItem">Leaves the candidate in control of what gets shared next</li>
              </ul>
              <ul className="feature-promo-modal-highlights feature-promo-modal-highlights--crew-bottom-full">
                <li className="feature-promo-modal-highlightItem">Shows hiring essentials like rank, location, status, availability, and experience</li>
                <li className="feature-promo-modal-highlightItem">Stays available as an always-on profile in the SeaCrew directory</li>
              </ul>
            </div>
            <div className="feature-promo-modal-story">
              <section className="feature-promo-modal-panel feature-promo-modal-panel--wide">
                <h3>What makes SeaCrew Card different</h3>
                <p>
                  SeaCrew Card works like a live book of profiles for employers who want to search more directly. Instead of waiting for a candidate to apply or creating a public post,
                  an employer can discover people already visible in SeaCrew, review only the essential signals, and decide who to contact through Private Chat.
                </p>
              </section>
              <section className="feature-promo-modal-panel">
                <h3>What employers can see</h3>
                <ul>
                  <li>Photo, name, and rank at a glance</li>
                  <li>City, country, status, and availability</li>
                  <li>Experience level in a quick-read format</li>
                  <li>A direct option to start Private Chat</li>
                </ul>
              </section>
              <section className="feature-promo-modal-panel">
                <h3>How privacy stays protected</h3>
                <ol>
                  <li>Personal contact details are not exposed in the public card</li>
                  <li>First contact happens through Private Chat</li>
                  <li>The candidate decides what to reveal after contact starts</li>
                  <li>You can show or hide the SeaCrew card from preview whenever needed</li>
                </ol>
              </section>
            </div>
            <div className="feature-promo-modal-footer feature-promo-modal-footer--stacked">
              <div className="feature-promo-modal-note">Completely free to create and use.</div>
              <div className="feature-promo-modal-actionsRow">
                <button type="button" className="feature-promo-modal-btn feature-promo-modal-btn--secondary" onClick={handleSeaCrewAction}>
                  Go to SeaCrew
                </button>
                <button type="button" className="feature-promo-modal-btn feature-promo-modal-btn--primary" onClick={handleFeaturePrimaryAction}>
                  {currentUser ? 'Go to my profile' : 'Register to create yours'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function getSeaJobsPromoCycleCount() {
  return FEATURE_PROMOS.length;
}
