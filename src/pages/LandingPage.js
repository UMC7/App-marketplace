// src/components/LandingPage.js

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import ThemeLogo from '../components/ThemeLogo';
import { useAuth } from '../context/AuthContext';
import '../LandingPage.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

function LandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeFeatureModal, setActiveFeatureModal] = useState('');

  const featurePromos = [
    {
      title: 'Digital CV',
      eyebrow: 'Shareable profile',
      description:
        'Turn your candidate profile into a polished public page you can share with recruiters, captains, and agencies.',
      accent: 'cv',
      ctaLabel: 'Explore profile tools',
      to: '/profile',
    },
    {
      title: 'Business Card',
      eyebrow: 'Scan and connect',
      description:
        'Convert your profile into a compact business card with QR access, ready to open your CV in one scan.',
      accent: 'card',
      ctaLabel: 'View card workflow',
      to: '/profile',
    },
    {
      title: 'SeaCrew Card',
      eyebrow: 'Quick intro card',
      description:
        'Stay discoverable to employers with a fast visual profile that shows key hiring details without exposing personal information.',
      accent: 'crew',
      ctaLabel: 'See crew identity tools',
      to: '/profile',
    },
  ];

  const SLIDE_WIDTH = 360;
  const [mobileCenterPadding, setMobileCenterPadding] = useState('0px');

  useEffect(() => {
    const updatePadding = () => {
      const vw = Math.min(window.innerWidth, 768);
      const pad = Math.max((vw - SLIDE_WIDTH) / 2, 0);
      setMobileCenterPadding(`${pad}px`);
    };
    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
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

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 5000,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '0px',
    adaptiveHeight: true,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: true,
          centerPadding: mobileCenterPadding,
          adaptiveHeight: true,
          arrows: false,
        },
      },
    ],
  };

  const handleFeaturePromoClick = (event, feature) => {
    if (feature.accent !== 'cv' && feature.accent !== 'card' && feature.accent !== 'crew') return;
    event.preventDefault();
    setActiveFeatureModal(feature.accent);
  };

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
      <div className="container landing-page-container" style={{ textAlign: 'center' }}>
        <h1>Welcome to your Yachting Hub</h1>
        <p>Choose your Option to Continue:</p>

        <div className="logo-grid">
          <Link to="/marketplace" className="module-link">
            <div className="module-tile">
              <div className="module-logo-wrap">
                <ThemeLogo
                  light="/logos/seamarket.png"
                  dark="/logos/seamarketDM.png"
                  alt="SeaMarket"
                  className="module-logo"
                />
              </div>
            </div>
          </Link>
          <Link to="/yacht-services" className="module-link">
            <div className="module-tile">
              <div className="module-logo-wrap">
                <ThemeLogo
                  light="/logos/seaservices.png"
                  dark="/logos/seaservicesDM.png"
                  alt="SeaServices"
                  className="module-logo"
                />
              </div>
            </div>
          </Link>
          <Link to="/yacht-works" className="module-link">
            <div className="module-tile">
              <div className="module-logo-wrap">
                <ThemeLogo
                  light="/logos/seajobs.png"
                  dark="/logos/seajobsDM.png"
                  alt="SeaJobs"
                  className="module-logo"
                />
              </div>
            </div>
          </Link>
          <Link to="/events" className="module-link">
            <div className="module-tile">
              <div className="module-logo-wrap">
                <ThemeLogo
                  light="/logos/seaevents.png"
                  dark="/logos/seaeventsDM.png"
                  alt="SeaEvents"
                  className="module-logo"
                />
              </div>
            </div>
          </Link>
        </div>

        <div className="module-carousel">
          <Slider {...settings}>
            <div>
              <div className="module-card">
                <h3>SeaMarket</h3>
                <p>
                  From spare parts to top gear, buy and sell everything for your yacht in one place.
                </p>
              </div>
            </div>
            <div>
              <div className="module-card">
                <h3>SeaServices</h3>
                <p>
                  Need a hand with your yacht? Discover or offer top maritime services, from repairs to full management.
                </p>
              </div>
            </div>
            <div>
              <div className="module-card">
                <h3>SeaJobs</h3>
                <p>
                  Explore daily job listings for onboard and onshore positions.
                  Apply directly to captains and recruiters.
                </p>
              </div>
            </div>
            <div>
              <div className="module-card">
                <h3>SeaEvents</h3>
                <p>
                  Discover upcoming yachting events and gatherings around the world.
                  Publish or join with ease.
                </p>
              </div>
            </div>
          </Slider>
        </div>

        <div className="landing-scroll-band" aria-hidden="true">
          <div className="landing-scroll-cue">
            <span className="landing-scroll-cue__text">Discover more</span>
            <span className="landing-scroll-cue__arrow-wrap">
              <span className="landing-scroll-cue__chevron" />
              <span className="landing-scroll-cue__chevron landing-scroll-cue__chevron--second" />
            </span>
          </div>
        </div>

        <section className="feature-promo-section is-visible" aria-labelledby="feature-promo-title">
          <div className="feature-promo-header">
            <p className="feature-promo-kicker">Featured Tools</p>
            <h2 id="feature-promo-title">Crew features built to be seen and shared</h2>
            <p className="feature-promo-intro">
              Stand out faster with free tools built to make your profile more visible, your applications stronger, and your first impression impossible to miss.
            </p>
          </div>

          <div className="feature-promo-grid">
            {featurePromos.map((feature) => (
              <article
                key={feature.title}
                className={`feature-promo-card feature-promo-card--${feature.accent}`}
              >
                <div className="feature-promo-visual" aria-hidden="true">
                  {feature.accent === 'cv' && (
                    <div className="promo-mock promo-mock-cv">
                      <ThemeLogo
                        light="/images/landing/digital-cv-light.png"
                        dark="/images/landing/digital-cv-dark.png"
                        alt="Digital CV preview"
                        className="promo-mock-cv-image"
                      />
                    </div>
                  )}

                  {feature.accent === 'card' && (
                    <div className="promo-mock promo-mock-business-card">
                      <ThemeLogo
                        light="/images/landing/business-card-light.png"
                        dark="/images/landing/business-card-dark.png"
                        alt="Business Card preview"
                        className="promo-mock-business-card-image"
                      />
                    </div>
                  )}

                  {feature.accent === 'crew' && (
                    <div className="promo-mock promo-mock-crew-card">
                      <ThemeLogo
                        light="/images/landing/seacrew-card-light.png"
                        dark="/images/landing/seacrew-card-dark.png"
                        alt="SeaCrew Card preview"
                        className="promo-mock-crew-image"
                      />
                    </div>
                  )}
                </div>

                <div className="feature-promo-copy">
                  <p className="feature-promo-eyebrow">{feature.eyebrow}</p>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <Link
                    className="feature-promo-link"
                    to={feature.to}
                    onClick={(event) => handleFeaturePromoClick(event, feature)}
                  >
                    {feature.ctaLabel}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {activeFeatureModal === 'cv' && (
        <div
          className="modal-overlay feature-promo-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="digital-cv-modal-title"
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
              <h2 id="digital-cv-modal-title">A live candidate profile built to be shared</h2>
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
          aria-labelledby="business-card-modal-title"
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
              <h2 id="business-card-modal-title">A compact card built for fast sharing and first contact</h2>
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
          aria-labelledby="seacrew-card-modal-title"
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
              <h2 id="seacrew-card-modal-title">A crew directory card built to be found without oversharing</h2>
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

export default LandingPage;
