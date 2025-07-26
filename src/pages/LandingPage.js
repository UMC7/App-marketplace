// src/components/LandingPage.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import '../LandingPage.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

function LandingPage() {
  // El ancho fijo de tu tarjeta .module-card
  const SLIDE_WIDTH = 360;

  // Estado para el padding que centrará el slide en móvil
  const [mobileCenterPadding, setMobileCenterPadding] = useState('0px');

  useEffect(() => {
    const updatePadding = () => {
      // Tomamos el ancho real del viewport (limitado a 768px para móvil)
      const vw = Math.min(window.innerWidth, 768);
      // Calculamos el hueco a cada lado para centrar un slide de 360px
      const pad = Math.max((vw - SLIDE_WIDTH) / 2, 0);
      setMobileCenterPadding(`${pad}px`);
    };
    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 5000,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerMode: true,            // centra en desktop
    centerPadding: '0px',        // sin padding en desktop
    adaptiveHeight: true,        // ajusta la altura al contenido
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: true,                 // centra en móvil
          centerPadding: mobileCenterPadding, // ¡padd dinámico!
          adaptiveHeight: true,
          arrows: false
        }
      }
    ]
  };

  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <h1>Welcome to your Yachting Hub</h1>
      <p>Choose your Option to Continue:</p>

      <div className="logo-grid">
        <Link to="/marketplace">
          <img src="/logos/seamarket.png" alt="SeaMarket" className="module-logo" />
        </Link>
        <Link to="/yacht-services">
          <img src="/logos/seaservices.png" alt="SeaServices" className="module-logo" />
        </Link>
        <Link to="/yacht-works">
          <img src="/logos/seajobs.png" alt="SeaJobs" className="module-logo" />
        </Link>
        <Link to="/events">
          <img src="/logos/seaevents.png" alt="SeaEvents" className="module-logo" />
        </Link>
      </div>

      <div className="module-carousel">
        <Slider {...settings}>
          <div>
            <div className="module-card">
              <h3>SeaMarket</h3>
              <p>
                Buy and sell yacht-related equipment, spare parts, and supplies
                directly with other professionals.
              </p>
            </div>
          </div>
          <div>
            <div className="module-card">
              <h3>SeaServices</h3>
              <p>
                Find or offer professional maritime services such as repairs,
                maintenance, and yacht management.
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
    </div>
  );
}

export default LandingPage;
