import React from 'react';
import { Link } from 'react-router-dom';
import '../LandingPage.css'; // Asegúrate de que este archivo existe

function LandingPage() {
  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <h1>Welcome to your Yacht Hub</h1>
      <p>Choose your Option to Continue:</p>
      <div className="logo-grid">
        <Link to="/marketplace">
          <img src="/logos/seamarket.png" alt="SeaMarket" className="module-logo" />
        </Link>
        <Link to="/yacht-services">
          <img src="/logos/seaservices.png" alt="Yacht Services" className="module-logo" />
        </Link>
        <Link to="/yacht-works">
          <img src="/logos/seajobs.png" alt="Yacht Works" className="module-logo" />
        </Link>
        <Link to="/events">
          <img src="/logos/seaevents.png" alt="Events" className="module-logo" />
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;