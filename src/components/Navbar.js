// src/components/Navbar.js

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabase';

function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al cerrar sesión:', error.message);
      }
      navigate('/login');
      window.location.reload();
    } catch (err) {
      console.error('Error inesperado al cerrar sesión:', err.message);
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.leftSection}>
        <Link to="/" style={styles.logo}>Marketplace</Link>
      </div>

      <div style={styles.rightSection}>
        {currentUser ? (
          <>
            <Link to="/profile" style={styles.navLink}>Perfil</Link>
            <Link to="/post-product" style={styles.navLink}>Publicar Producto</Link>
            <button onClick={handleLogout} style={styles.logoutButton}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.navLink}>Iniciar sesión</Link>
            <Link to="/register" style={styles.navLink}>Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#0077cc',
    color: 'white',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
  },
  rightSection: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    textDecoration: 'none',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid white',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Navbar;