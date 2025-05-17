import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import supabase from '../supabase';
import YachtOfferForm from './YachtOfferForm';
import PostProductForm from './PostProductForm';
import PostServiceForm from './PostServiceForm';
import PostEventForm from './PostEventForm';
import ChatList from './ChatList';
import Modal from './Modal'; // Usa el mismo modal del chat
import ChatPage from './ChatPage';

function Navbar() {
  const { currentUser } = useAuth();
  const { cartItems = [], setCartItems } = useCarrito();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const menuRef = useRef();
  const [showChatList, setShowChatList] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
  const fetchUnreadMessages = async () => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('yacht_work_messages')
      .select('id')
      .eq('receiver_id', currentUser.id)
      .eq('read', false);

    if (!error) {
      setUnreadCount(data.length);
    }
  };

  fetchUnreadMessages();
}, [currentUser]);

  const handleLogout = async () => {
    try {
      await supabase.auth.getSession();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al cerrar sesión:', error.message);
        alert('Error al cerrar sesión.');
        return;
      }
      setCartItems([]);
      localStorage.removeItem('cart');
      navigate('/login');
    } catch (err) {
      console.error('Error inesperado al cerrar sesión:', err.message);
      alert('Error inesperado.');
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleOfferPosted = () => {
    setShowOfferModal(false);
    window.location.reload();
  };

  const handleProductPosted = () => {
    setShowProductModal(false);
    window.location.reload();
  };

  const handleServicePosted = () => {
    setShowServiceModal(false);
    window.location.reload();
  };

  return (
  <nav style={styles.navbar}>
    <div style={styles.leftSection}>
  <Link to="/" style={styles.logo}>YachtDayWork</Link>
  <button className="navbar-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
    ☰
  </button>
</div>

    <div style={styles.rightSection}>
  <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
    {currentUser ? (
  <>
  <button onClick={() => navigate('/profile')} className="navLink">Perfil</button>

  <div ref={menuRef} style={{ position: 'relative', width: '100%' }}>
  <button className="navLink" onClick={() => setShowMenu(!showMenu)}>
    Publicar
  </button>
  {showMenu && (
    <div style={styles.dropdownMenu}>
        <button
  className="navLink"
  onClick={() => {
    setShowProductModal(true);
    setShowMenu(false);
  }}
>
  Publicar Producto
</button>

      <button
  className="navLink"
  onClick={() => {
    setShowProductModal(true);
    setShowMenu(false);
  }}
>
  Publicar Servicios
</button>

      <button
  className="navLink"
  onClick={() => {
    setShowProductModal(true);
    setShowMenu(false);
  }}
>
  Publicar Empleos
</button>

      <button
  className="navLink"
  onClick={() => {
    setShowProductModal(true);
    setShowMenu(false);
  }}
>
  Publicar Eventos
</button>

    </div>
  )}
</div>
        <button onClick={() => setShowChatList(true)} className="navLink">
  💬 Chats
  {unreadCount > 0 && (
    <span className="badge">{unreadCount}</span>
  )}
</button>
        <button onClick={() => navigate('/favorites')} className="navLink">Favoritos</button>
        <button onClick={() => navigate('/cart')} className="navLink">Carrito</button>
        <button onClick={handleLogout} className="navLink">Logout</button>
      </>
    ) : (
      <>
        <Link to="/login" className="navLink">Iniciar sesión</Link>
        <Link to="/register" className="navLink">Registrarse</Link>
      </>
    )}
  </div>
</div>

      {/* Modales */}
{showOfferModal && (
  <div style={modalStyles.overlay} onClick={() => setShowOfferModal(false)}>
    <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
      <button style={modalStyles.closeBtn} onClick={() => setShowOfferModal(false)}>X</button>
      <YachtOfferForm user={currentUser} onOfferPosted={handleOfferPosted} />
    </div>
  </div>
)}
{showProductModal && (
  <div style={modalStyles.overlay} onClick={() => setShowProductModal(false)}>
    <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
      <button style={modalStyles.closeBtn} onClick={() => setShowProductModal(false)}>X</button>
      <PostProductForm onPosted={handleProductPosted} />
    </div>
  </div>
)}
{showServiceModal && (
  <div style={modalStyles.overlay} onClick={() => setShowServiceModal(false)}>
    <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
      <button style={modalStyles.closeBtn} onClick={() => setShowServiceModal(false)}>X</button>
      <PostServiceForm onPosted={handleServicePosted} />
    </div>
  </div>
)}
{showEventModal && (
  <div style={modalStyles.overlay} onClick={() => setShowEventModal(false)}>
    <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
      <button style={modalStyles.closeBtn} onClick={() => setShowEventModal(false)}>X</button>
      <PostEventForm />
    </div>
  </div>
)}
{showChatList && (
  <div style={modalStyles.overlay} onClick={() => setShowChatList(false)}>
    <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
      <button style={modalStyles.closeBtn} onClick={() => setShowChatList(false)}>X</button>
      {!activeChat ? (
        <ChatList
          currentUser={currentUser}
          onOpenChat={(offerId, receiverId) => {
            setActiveChat({ offerId, receiverId });
          }}
        />
      ) : (
        <ChatPage
          offerId={activeChat.offerId}
          receiverId={activeChat.receiverId}
          onBack={() => setActiveChat(null)}
        />
      )}
    </div>
  </div>
)}
</nav>
);
}

const styles = {
  navbar: {
  display: 'flex',
  flexWrap: 'wrap',
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
  flexWrap: 'wrap',
  gap: '10px',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
  marginTop: '10px',
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
  padding: '10px 15px',
  display: 'block',
  width: '100%',
  textAlign: 'left',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
},
  chatButton: {
  display: 'flex',
  alignItems: 'center',
  color: 'white',
  fontSize: '16px',
  textDecoration: 'none',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  gap: '5px',
  },
  badge: {
    backgroundColor: 'red',
    color: 'white',
    borderRadius: '50%',
    padding: '2px 8px',
    fontSize: '12px',
    marginLeft: '5px',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: '#0077cc',
    color: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 1000,
    borderRadius: '4px',
    overflow: 'hidden',
  },
  dropdownItem: {
    display: 'block',
    padding: '10px 20px',
    textAlign: 'left',
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },
  linkGroup: {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  alignItems: 'center',
  },
  '@media (max-width: 600px)': {
  rightSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  hamburger: {
  display: 'none',
  fontSize: '24px',
  background: 'none',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
},
mobileMenu: {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  paddingTop: '10px',
},
'@media (max-width: 600px)': {
  hamburger: {
    display: 'block',
  },
  linkGroup: {
    display: 'none',
  },
  mobileMenu: {
    display: 'flex',
  }
}
}
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  content: {
  backgroundColor: '#fff',
  color: '#000',
  padding: '20px',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '600px',
  position: 'relative',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxSizing: 'border-box',
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    background: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
  },
};

export default Navbar;