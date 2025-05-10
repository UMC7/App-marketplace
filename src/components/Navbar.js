import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import supabase from '../supabase';

function Navbar() {
  const { currentUser } = useAuth();
  const { cartItems = [], setCartItems } = useCarrito(); // ✅ previene undefined
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.getSession();

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al cerrar sesión:', error.message);
        alert('Error al cerrar sesión.');
        return;
      }

      // 🧹 Limpiar carrito y localStorage al cerrar sesión
      setCartItems([]);
      localStorage.removeItem('cart');

      navigate('/login');
    } catch (err) {
      console.error('Error inesperado al cerrar sesión:', err.message);
      alert('Error inesperado.');
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav style={styles.navbar}>
      <div style={styles.leftSection}>
        <Link to="/" style={styles.logo}>YachtDayWork</Link>
      </div>

      <div style={styles.rightSection}>
  {currentUser ? (
    <>
      <Link to="/profile" style={styles.navLink}>Perfil</Link>
      <Link
        to={window.location.pathname.includes('/yacht-services') ? '/yacht-services/post-product' : '/post-product'}
        style={styles.navLink}
      >
        Publicar Producto
      </Link>
      <Link to="/favorites" style={styles.navLink}>Favoritos</Link>
      <Link to="/cart" style={styles.navLink}>
        Carrito {totalItems > 0 && <span style={styles.badge}>{totalItems}</span>}
      </Link>
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
    position: 'relative',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid white',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  badge: {
    backgroundColor: 'red',
    color: 'white',
    borderRadius: '50%',
    padding: '2px 8px',
    fontSize: '12px',
    marginLeft: '5px',
  },
};

export default Navbar;