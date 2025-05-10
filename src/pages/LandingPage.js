import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Bienvenido a la plataforma</h1>
      <p>Selecciona una sección para comenzar:</p>
      <div style={{ marginTop: '30px' }}>
        <Link to="/marketplace" style={buttonStyle}>Marketplace</Link>
        <Link to="/yacht-services" style={buttonStyle}>Yacht Services</Link>
        <Link to="/yacht-works" style={buttonStyle}>Yacht Works</Link>
        <Link to="/events" style={buttonStyle}>Events</Link>
      </div>
    </div>
  );
}

const buttonStyle = {
  display: 'inline-block',
  margin: '10px',
  padding: '12px 24px',
  backgroundColor: '#0077cc',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '6px',
  fontSize: '16px',
};

export default LandingPage;