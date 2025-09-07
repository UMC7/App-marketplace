import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { useUnreadMessages } from '../context/UnreadMessagesContext';
import { useFavorites } from '../context/FavoritesContext';
import supabase from '../supabase';
import YachtOfferForm from './YachtOfferForm';
import PostProductForm from './PostProductForm';
import PostServiceForm from './PostServiceForm';
import PostEventForm from './PostEventForm';
import ChatList from './ChatList';
import ChatPage from './ChatPage';
import Modal from './Modal';
import ThemeToggle from './ThemeToggle';
import '../navbar.css';

function Navbar() {
  const { currentUser, loading } = useAuth();
  const { cartItems = [], setCartItems } = useCarrito();
  const { unreadCount } = useUnreadMessages();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [showTouPanel, setShowTouPanel] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const menuRef = useRef();

  const [isMobilePortrait, setIsMobilePortrait] = useState(
    window.matchMedia('(max-width: 768px) and (orientation: portrait)').matches
  );

  const [showSocialPanel, setShowSocialPanel] = useState(false);

  const [logoSrc, setLogoSrc] = useState('/logos/yachtdaywork.png');
  useEffect(() => {
    const updateLogo = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setLogoSrc(theme === 'dark' ? '/logos/yachtdayworkDarkMode.png' : '/logos/yachtdaywork.png');
    };
    updateLogo();
    const obs = new MutationObserver(updateLogo);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (showTouPanel) {
      const timeout = setTimeout(() => setShowTouPanel(false), 2500);
      return () => clearTimeout(timeout);
    }
  }, [showTouPanel]);

  useEffect(() => {
    if (showSocialPanel) {
      const timeout = setTimeout(() => setShowSocialPanel(false), 2500);
      return () => clearTimeout(timeout);
    }
  }, [showSocialPanel]);

  useEffect(() => {
    const checkOrientation = () => {
      setIsMobilePortrait(window.matchMedia('(max-width: 768px) and (orientation: portrait)').matches);
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return null;

  const handleLogout = async () => {
    try {
      await supabase.auth.getSession();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCartItems([]);
      localStorage.removeItem('cart');
      navigate('/login');
    } catch (err) {
      alert('Error al cerrar sesión.');
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="navbar-container">
      <div className="navbar-left">
        <div className="navbar-logo-wrapper">
          <Link to="/">
            <img src={logoSrc} alt="YachtDayWork logo" className="navbar-logo" />
          </Link>
        </div>
        {!window.matchMedia('(max-width: 900px) and (orientation: landscape)').matches && (
          <button className="navbar-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</button>
        )}
      </div>

      <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
        {currentUser ? (
          <>
            <button onClick={() => { navigate('/profile'); setIsMenuOpen(false); }} className="profile-icon-text">
              <span className="material-icons">account_circle</span>
              <small>Profile</small>
            </button>
            {currentUser?.app_metadata?.role === 'admin' && (
              <button onClick={() => { navigate('/admin'); setIsMenuOpen(false); }} className="profile-icon-text">
                <span className="material-icons">admin_panel_settings</span>
                <small>Admin</small>
              </button>
            )}
            <div ref={menuRef} style={{ position: 'relative', width: '100%' }}>
              <button className="post-icon-text" onClick={() => setShowMenu(!showMenu)}>
                <span className="material-icons">add_circle_outline</span>
                <small>Post</small>
              </button>
              {showMenu && (
                <div className="post-dropdown">
                  <button className="navLink" onClick={() => { setShowProductModal(true); setShowMenu(false); }}>Post Product</button>
                  <button className="navLink" onClick={() => { setShowServiceModal(true); setShowMenu(false); }}>Post Service</button>
                  <button className="navLink" onClick={() => { setShowOfferModal(true); setShowMenu(false); }}>Post Job</button>
                  <button className="navLink" onClick={() => { setShowEventModal(true); setShowMenu(false); }}>Post Event</button>
                </div>
              )}
            </div>
            <button onClick={() => { setShowChatList(true); setIsMenuOpen(false); }} className="chats-icon-text">
              {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
              <span className="material-icons">chat_bubble_outline</span>
              <small>Chats</small>
            </button>

            {/* Alerts (idéntico estilo, entre Chats y Favorites) */}
            <button onClick={() => { setIsMenuOpen(false); }} className="alerts-icon-text">
              <span className="material-icons">notifications_none</span>
              <small>Alerts</small>
            </button>

            <button onClick={() => { navigate('/favorites'); setIsMenuOpen(false); }} className="favorites-icon-text">
              {favorites.length > 0 && <span className="favorites-badge">{favorites.length}</span>}
              <span className="material-icons">favorite_border</span>
              <small>Favorites</small>
            </button>
            <button onClick={() => { navigate('/cart'); setIsMenuOpen(false); }} className="cart-icon-text">
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              <span className="material-icons">shopping_cart</span>
              <small>Cart</small>
            </button>
            <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="logout-icon-text">
              <span className="material-icons">logout</span>
              <small>Logout</small>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-icon-text">
              <span className="material-icons">person_outline</span>
              <small>Login</small>
            </Link>
            <Link to="/register" className="register-icon-text">
              <span className="material-icons">person_add</span>
              <small>Register</small>
            </Link>
          </>
        )}
      </div>

      {/* BOTÓN TOU FLOTANTE EXPANDIBLE (TEMA) */}
      <div
        style={{
          position: 'absolute',
          top: isMobilePortrait ? '50%' : '50%',
          right: isMobilePortrait ? '0' : '12px',
          transform: 'translateY(-50%)',
          background: '#68ada8',
          color: '#fff',
          borderRadius: '8px 0 0 8px',
          width: showTouPanel ? '60px' : '14px',
          height: showTouPanel ? '100px' : '44px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: showTouPanel ? 'flex-start' : 'center',
          boxShadow: '0 2px 8px rgba(8,26,59,0.10)',
          cursor: 'pointer',
          opacity: 0.95,
          paddingTop: showTouPanel ? (isMobilePortrait ? '24px' : '6px') : '0',
          paddingBottom: showTouPanel ? '6px' : '0',
          transition: 'all 0.2s cubic-bezier(.4,2.4,.7,.9)',
          zIndex: 1000,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setShowTouPanel((s) => !s);
        }}
      >
        {showTouPanel ? (
          <>
            <div style={{ transform: 'scale(0.85)', marginBottom: '6px' }}>
              <ThemeToggle />
            </div>
            <span
              className="material-icons"
              style={{ fontSize: 26, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setShowLegalModal(true);
                setShowTouPanel(false);
              }}
            >
              library_books
            </span>
          </>
        ) : (
          <div
            style={{
              width: '3px',
              height: '26px',
              background: '#fff',
              borderRadius: '2px',
              marginLeft: '3px',
            }}
          />
        )}
      </div>

      {/* BOTÓN FLOTANTE DE ACCESO A REDES SOCIALES */}
      <div
        style={{
          position: 'absolute',
          top: isMobilePortrait ? '50%' : 'calc(50% + 60px)',
          right: isMobilePortrait ? 'unset' : '12px',
          left: isMobilePortrait ? '0' : 'unset',
          transform: isMobilePortrait ? 'translateY(-50%)' : 'none',
          background: '#68ada8',
          color: '#fff',
          borderRadius: isMobilePortrait ? '0 8px 8px 0' : '8px 0 0 8px',
          width: isMobilePortrait ? (showSocialPanel ? '60px' : '14px') : (showSocialPanel ? '60px' : '14px'),
          height: isMobilePortrait ? (showSocialPanel ? '100px' : '44px') : (showSocialPanel ? '100px' : '44px'),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: showSocialPanel ? 'space-evenly' : 'center',
          boxShadow: '0 2px 8px rgba(8,26,59,0.10)',
          cursor: 'pointer',
          opacity: 0.95,
          paddingTop: showSocialPanel ? (isMobilePortrait ? '16px' : '10px') : '0',
          paddingBottom: showSocialPanel ? '6px' : '0',
          transition: 'all 0.2s cubic-bezier(.4,2.4,.7,.9)',
          zIndex: 1000,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setShowSocialPanel((s) => !s);
        }}
      >
        {showSocialPanel ? (
          <>
            <a
              href="https://www.instagram.com/yachtdaywork"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg"
                alt="Instagram"
                style={{
                  width: '30px',
                  height: '30px',
                  filter: 'invert(100%)',
                  display: 'block',
                }}
              />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61579224787364"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg"
                alt="Facebook"
                style={{
                  width: '30px',
                  height: '30px',
                  filter: 'invert(100%)',
                  display: 'block',
                }}
              />
            </a>
          </>
        ) : (
          <div
            style={{
              width: '3px',
              height: '26px',
              background: '#fff',
              borderRadius: '2px',
            }}
          />
        )}
      </div>

      {/* === MODALES UNIFICADOS === */}
      {showOfferModal && (
        <Modal onClose={() => setShowOfferModal(false)}>
          <YachtOfferForm user={currentUser} onOfferPosted={() => window.location.reload()} />
        </Modal>
      )}
      {showProductModal && (
        <Modal onClose={() => setShowProductModal(false)}>
          <PostProductForm onPosted={() => window.location.reload()} />
        </Modal>
      )}
      {showServiceModal && (
        <Modal onClose={() => setShowServiceModal(false)}>
          <PostServiceForm onPosted={() => window.location.reload()} />
        </Modal>
      )}
      {showEventModal && (
        <Modal onClose={() => setShowEventModal(false)}>
          <PostEventForm />
        </Modal>
      )}
      {showChatList && (
        <Modal onClose={() => { setActiveChat(null); setShowChatList(false); }}>
          {!activeChat ? (
            <ChatList
              currentUser={currentUser}
              onOpenChat={(offerId, receiverId) => setActiveChat({ offerId, receiverId })}
            />
          ) : (
            <ChatPage
              offerId={activeChat.offerId}
              receiverId={activeChat.receiverId}
              onBack={() => {
                setActiveChat(null);
                setShowChatList(true);
              }}
            />
          )}
        </Modal>
      )}
      {showLegalModal && (
        <Modal onClose={() => setShowLegalModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px 10px 20px 10px' }}>
            <button
              className="legal-modal-link"
              onClick={() => {
                setShowLegalModal(false);
                navigate('/legal');
              }}
              style={{
                background: '#68ada8',
                color: '#fff',
                border: 'none',
                borderRadius: '7px',
                padding: '12px 24px',
                fontSize: '1.15rem',
                marginBottom: '8px',
                width: '100%',
                maxWidth: 220,
                cursor: 'pointer'
              }}
            >
              Terms of Use
            </button>
            <button
              className="legal-modal-link"
              onClick={() => {
                setShowLegalModal(false);
                navigate('/privacy');
              }}
              style={{
                background: '#bca987',
                color: '#081a3b',
                border: 'none',
                borderRadius: '7px',
                padding: '12px 24px',
                fontSize: '1.15rem',
                width: '100%',
                maxWidth: 220,
                cursor: 'pointer'
              }}
            >
              Privacy Policy
            </button>
          </div>
        </Modal>
      )}

      {/* Menú inferior móvil */}
      {isMobilePortrait && (
        <div className="navbar-bottom">
          {currentUser ? (
            <>
              <button className="nav-icon-button" onClick={() => navigate('/profile')}>
                <span className="material-icons">account_circle</span>
                <small>Profile</small>
              </button>
              {currentUser?.app_metadata?.role === 'admin' && (
                <button className="nav-icon-button" onClick={() => navigate('/admin')}>
                  <span className="material-icons">admin_panel_settings</span>
                  <small>Admin</small>
                </button>
              )}
              <button className="nav-icon-button" onClick={() => setShowPostOptions(true)}>
                <span className="material-icons">add_circle_outline</span>
                <small>Post</small>
              </button>
              <button className="nav-icon-button" onClick={() => setShowChatList(true)}>
                {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
                <span className="material-icons">chat_bubble_outline</span>
                <small>Chats</small>
              </button>

              {/* Alerts (móvil, entre Chats y Favorites) */}
              <button className="nav-icon-button" onClick={() => {}}>
                <span className="material-icons">notifications_none</span>
                <small>Alerts</small>
              </button>

              <button className="nav-icon-button" onClick={() => navigate('/favorites')}>
                {favorites.length > 0 && <span className="favorites-badge">{favorites.length}</span>}
                <span className="material-icons">favorite_border</span>
                <small>Favorites</small>
              </button>
              <button className="nav-icon-button" onClick={() => navigate('/cart')}>
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                <span className="material-icons">shopping_cart</span>
                <small>Cart</small>
              </button>
              <button className="nav-icon-button" onClick={handleLogout}>
                <span className="material-icons">logout</span>
                <small>Logout</small>
              </button>
            </>
          ) : (
            <>
              <button className="nav-icon-button" onClick={() => navigate('/login')}>
                <span className="material-icons">person_outline</span>
                <small>Login</small>
              </button>
              <button className="nav-icon-button" onClick={() => navigate('/register')}>
                <span className="material-icons">person_add</span>
                <small>Register</small>
              </button>
            </>
          )}
        </div>
      )}

      {showPostOptions && (
        <div className="post-options-modal" onClick={() => setShowPostOptions(false)}>
          <div className="post-options-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select what you want to post</h3>
            <button className="navLink" onClick={() => { setShowProductModal(true); setShowPostOptions(false); }}>Post Product</button>
            <button className="navLink" onClick={() => { setShowServiceModal(true); setShowPostOptions(false); }}>Post Service</button>
            <button className="navLink" onClick={() => { setShowOfferModal(true); setShowPostOptions(false); }}>Post Job</button>
            <button className="navLink" onClick={() => { setShowEventModal(true); setShowPostOptions(false); }}>Post Event</button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;