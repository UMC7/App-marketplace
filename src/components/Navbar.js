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
  const [activeChat, setActiveChat] = useState(null);
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
    </div>

    <div style={styles.rightSection}>
      {currentUser ? (
        <>
          <Link to="/profile" style={styles.navLink}>Perfil</Link>

          <div
  onClick={() => setShowChatList(true)}
  style={{ ...styles.chatButton }}
>
  💬 Chats
  {unreadCount > 0 && (
    <span style={styles.badge}>{unreadCount}</span>
  )}
</div>

          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              style={{ ...styles.navLink, background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setShowMenu(!showMenu)}
            >
              Publicar
            </button>
            {showMenu && (
              <div style={styles.dropdownMenu}>
                <button
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowProductModal(true);
                    setShowMenu(false);
                  }}
                >
                  Publicar Producto
                </button>

                <button
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowServiceModal(true);
                    setShowMenu(false);
                  }}
                >
                  Publicar Servicio
                </button>

                <button
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowOfferModal(true);
                    setShowMenu(false);
                  }}
                >
                  Publicar Empleo
                </button>

                <button
                style={styles.dropdownItem}
                onClick={() => {
                  setShowEventModal(true);
                  setShowMenu(false);
                }}
              >
                Publicar Evento
              </button>
              </div>
            )}
          </div>

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

      {/* Modales */}
      {showOfferModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <button style={modalStyles.closeBtn} onClick={() => setShowOfferModal(false)}>X</button>
            <YachtOfferForm user={currentUser} onOfferPosted={handleOfferPosted} />
          </div>
        </div>
      )}
      {showProductModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <button style={modalStyles.closeBtn} onClick={() => setShowProductModal(false)}>X</button>
            <PostProductForm onPosted={handleProductPosted} />
          </div>
        </div>
      )}
      {showServiceModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <button style={modalStyles.closeBtn} onClick={() => setShowServiceModal(false)}>X</button>
            <PostServiceForm onPosted={handleServicePosted} />
          </div>
        </div>
      )}
      {showEventModal && (
  <div style={modalStyles.overlay}>
    <div style={modalStyles.content}>
      <button style={modalStyles.closeBtn} onClick={() => setShowEventModal(false)}>X</button>
      <PostEventForm />
    </div>
  </div>
)}
      {showChatList && (
  <div style={modalStyles.overlay}>
    <div style={modalStyles.content}>
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
    padding: '30px',
    borderRadius: '8px',
    maxWidth: '700px',
    width: '100%',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
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