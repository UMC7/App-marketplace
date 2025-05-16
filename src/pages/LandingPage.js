import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <h1>Welcome to your Yacht Hub</h1>
      <p>Choose your Option to Continue:</p>
      <div className="landing-button-group">
  <Link to="/marketplace" className="landing-button">SeaMarket</Link>
  <Link to="/yacht-services" className="landing-button">Yacht Services</Link>
  <Link to="/yacht-works" className="landing-button">Yacht Works</Link>
  <Link to="/events" className="landing-button">Events</Link>
</div>
    </div>
  );
}

export default LandingPage;