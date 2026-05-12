import React from 'react';
import { FaCopy, FaDownload, FaEnvelope, FaMapMarkerAlt, FaMobileAlt, FaShareAlt } from 'react-icons/fa';

function PublicProfileBusinessCardBody({
  businessCardEmail,
  businessCardLocation,
  businessCardLogoSrc,
  businessCardPhone,
  cardQrSrc,
  displayName,
  firstName,
  heroObjectPosition,
  heroSrc,
  rankText,
}) {
  return (
    <>
      <div className="ppv-businessCardBrand">
        <span>Powered by</span>
        <span>Yacht Daywork</span>
      </div>
      <div className="ppv-businessCardBody">
        <div className="ppv-businessCardPhotoWrap">
          {heroSrc ? (
            <img
              className="ppv-businessCardPhoto"
              src={heroSrc}
              alt={`${firstName || 'Candidate'} portrait`}
              style={{ objectPosition: heroObjectPosition }}
            />
          ) : (
            <div className="ppv-businessCardPhotoFallback">CV</div>
          )}
        </div>

        <div className="ppv-businessCardIdentity">
          <div className="ppv-businessCardTitleGroup">
            <div className="ppv-businessCardName">{displayName}</div>
            {rankText && <div className="ppv-businessCardRank">{rankText}</div>}
          </div>
          <div className="ppv-businessCardDetailsGroup">
            {(businessCardLocation.city || businessCardLocation.country) && (
              <div className="ppv-businessCardMetaRow ppv-businessCardLocation">
                <span className="ppv-businessCardMetaIcon" aria-hidden="true"><FaMapMarkerAlt /></span>
                <div className="ppv-businessCardMetaText">
                  {businessCardLocation.city && <span>{businessCardLocation.city}</span>}
                  {businessCardLocation.country && <span>{businessCardLocation.country}</span>}
                </div>
              </div>
            )}
            {businessCardPhone && (
              <div className="ppv-businessCardMetaRow ppv-businessCardContact">
                <span className="ppv-businessCardMetaIcon" aria-hidden="true"><FaMobileAlt /></span>
                <span className="ppv-businessCardMetaValue">{businessCardPhone}</span>
              </div>
            )}
            {businessCardEmail && (
              <div className="ppv-businessCardMetaRow ppv-businessCardContact">
                <span className="ppv-businessCardMetaIcon" aria-hidden="true"><FaEnvelope /></span>
                <span className="ppv-businessCardMetaValue">{businessCardEmail}</span>
              </div>
            )}
          </div>
        </div>

        <div className="ppv-businessCardQrWrap">
          <img
            className="ppv-businessCardLogo"
            src={businessCardLogoSrc}
            alt="Yacht Daywork"
          />
          {cardQrSrc ? (
            <img className="ppv-businessCardQr" src={cardQrSrc} alt="QR to digital CV" />
          ) : (
            <div className="ppv-businessCardQrFallback">QR</div>
          )}
          <div className="ppv-businessCardQrCaption">Scan to view CV</div>
        </div>
      </div>
    </>
  );
}

export default function PublicProfileBusinessCard({
  baseBusinessCardHeight,
  businessCardBodyProps,
  businessCardExportRef,
  businessCardRef,
  businessCardRootClassName,
  businessCardScale,
  businessCardStageRef,
  businessCardTheme,
  cardExportBusy,
  downloadMenuOpen,
  handleCopyBusinessCardImage,
  handleDownloadBusinessCard,
  handleShareBusinessCardImage,
  isMobile,
  setBusinessCardTheme,
  setDownloadMenuOpen,
}) {
  return (
    <>
      <header className="ppv-header">
        <div
          ref={businessCardStageRef}
          className="ppv-businessCardStage"
          style={{ height: `${baseBusinessCardHeight * businessCardScale}px` }}
        >
          <div
            className="ppv-businessCardScaler"
            style={{ transform: `scale(${businessCardScale})` }}
          >
            <div
              ref={businessCardRef}
              className={businessCardRootClassName}
              role="region"
              aria-label="Candidate business card preview"
            >
              <div className="ppv-businessCardControls">
                <div className="ppv-businessCardThemeToggle" role="group" aria-label="Business card color">
                  <button
                    type="button"
                    className={`ppv-businessCardThemeOption${businessCardTheme === 'dark' ? ' is-active' : ''}`}
                    onClick={() => setBusinessCardTheme('dark')}
                    aria-pressed={businessCardTheme === 'dark'}
                    disabled={!!cardExportBusy}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    className={`ppv-businessCardThemeOption${businessCardTheme === 'light' ? ' is-active' : ''}`}
                    onClick={() => setBusinessCardTheme('light')}
                    aria-pressed={businessCardTheme === 'light'}
                    disabled={!!cardExportBusy}
                  >
                    Light
                  </button>
                </div>
                <button
                  type="button"
                  className="ppv-businessCardAction"
                  onClick={isMobile ? handleShareBusinessCardImage : handleCopyBusinessCardImage}
                  disabled={!!cardExportBusy}
                >
                  <span className="ppv-businessCardActionLabel ppv-businessCardActionLabel--desktop">
                    {cardExportBusy === 'copy' ? 'Copying...' : 'Copy image'}
                  </span>
                  <span className="ppv-businessCardActionLabel ppv-businessCardActionLabel--mobile" aria-hidden="true">
                    {isMobile ? <FaShareAlt /> : <FaCopy />}
                  </span>
                </button>
                <div className="ppv-businessCardDownloadWrap">
                  <button
                    type="button"
                    className="ppv-businessCardAction"
                    onClick={() => setDownloadMenuOpen((open) => !open)}
                    disabled={!!cardExportBusy}
                    aria-expanded={downloadMenuOpen ? 'true' : 'false'}
                  >
                    <span className="ppv-businessCardActionLabel ppv-businessCardActionLabel--desktop">
                      {cardExportBusy === 'png' || cardExportBusy === 'pdf' ? 'Preparing...' : 'Download card'}
                    </span>
                    <span className="ppv-businessCardActionLabel ppv-businessCardActionLabel--mobile" aria-hidden="true">
                      <FaDownload />
                    </span>
                  </button>
                  {downloadMenuOpen && (
                    <div className="ppv-businessCardDownloadMenu">
                      <button
                        type="button"
                        className="ppv-businessCardDownloadOption"
                        onClick={() => handleDownloadBusinessCard('pdf')}
                      >
                        Download PDF
                      </button>
                      <button
                        type="button"
                        className="ppv-businessCardDownloadOption"
                        onClick={() => handleDownloadBusinessCard('png')}
                      >
                        Download PNG
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <PublicProfileBusinessCardBody {...businessCardBodyProps} />
            </div>
          </div>
        </div>
      </header>

      <div className="ppv-businessCardExportRoot" aria-hidden="true">
        <div
          ref={businessCardExportRef}
          className={`${businessCardRootClassName} ppv-businessCard--export`}
        >
          <PublicProfileBusinessCardBody {...businessCardBodyProps} />
        </div>
      </div>
    </>
  );
}
