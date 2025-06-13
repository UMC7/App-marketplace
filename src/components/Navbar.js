// src/components/Navbar.js

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
import ChatPage from './ChatPage';
import Modal from './Modal';
import '../navbar.css';

function Navbar() {
  const { currentUser, loading } = useAuth();
  const { cartItems = [], setCartItems } = useCarrito();
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTouPanel, setShowTouPanel] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const menuRef = useRef();

  // Detecta si está en móvil portrait
  const [isMobilePortrait, setIsMobilePortrait] = useState(
    window.matchMedia('(max-width: 768px) and (orientation: portrait)').matches
  );

  // Auto-colapsa la pestaña TOU después de 2.5 segundos abierta
  useEffect(() => {
    if (showTouPanel) {
      const timeout = setTimeout(() => setShowTouPanel(false), 2500);
      return () => clearTimeout(timeout);
    }
  }, [showTouPanel]);

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

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!currentUser) return;
      const { data, error } = await supabase
        .from('yacht_work_messages')
        .select('id')
        .eq('receiver_id', currentUser.id)
        .eq('read', false);
      if (!error) setUnreadCount(data.length);
    };
    fetchUnreadMessages();
  }, [currentUser]);

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
            <img
              src="/logos/yachtdaywork.png"
              alt="YachtDayWork logo"
              className="navbar-logo"
            />
          </Link>
        </div>
        {/* No mostramos el toggle si es móvil landscape */}
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
            <button onClick={() => { navigate('/favorites'); setIsMenuOpen(false); }} className="favorites-icon-text">
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

      {/* BOTÓN TOU FLOTANTE - SOLO MOBILE PORTRAIT */}
      {isMobilePortrait && (
        <button
          className="tou-tab-collapsed"
          onClick={() => setShowTouPanel(s => !s)}
          aria-label="Terms of Use"
          style={{
            position: 'fixed',
            top: '15px',
            right: 0,
            zIndex: 9999,
            background: '#68ada8',
            color: '#fff',
            border: 'none',
            borderRadius: '8px 0 0 8px',
            width: showTouPanel ? '42px' : '14px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(8,26,59,0.10)',
            cursor: 'pointer',
            opacity: 0.95,
            padding: 0,
            transition: 'width 0.2s cubic-bezier(.4,2.4,.7,.9)'
          }}
        >
          {showTouPanel ? (
            <span
              className="material-icons"
              style={{ fontSize: 26, cursor: 'pointer' }}
              onClick={() => {
                setShowLegalModal(true);
                setShowTouPanel(false);
              }}
            >
              library_books
            </span>
          ) : (
            <div style={{
              width: '3px',
              height: '26px',
              background: '#fff',
              borderRadius: '2px',
              marginLeft: '3px'
            }} />
          )}
        </button>
      )}

      {/* Modales de publicación y chats */}
{showOfferModal && renderModal(<YachtOfferForm user={currentUser} onOfferPosted={() => { setShowOfferModal(false); window.location.reload(); }} />)}
{showProductModal && renderModal(<PostProductForm onPosted={() => { setShowProductModal(false); window.location.reload(); }} />)}
{showServiceModal && renderModal(<PostServiceForm onPosted={() => { setShowServiceModal(false); window.location.reload(); }} />)}
{showEventModal && renderModal(<PostEventForm />)}
{showChatList && renderModal(
  !activeChat ? (
    <ChatList
      currentUser={currentUser}
      onOpenChat={(offerId, receiverId) => setActiveChat({ offerId, receiverId })}
    />
  ) : (
    <ChatPage
      offerId={activeChat.offerId}
      receiverId={activeChat.receiverId}
      onBack={() => setActiveChat(null)}
    />
  )
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

      {/* Usamos el estado isMobilePortrait en vez de media query directa */}
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

              <button className="nav-icon-button" onClick={() => navigate('/favorites')}>
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

      {/* Modal de selección de tipo de publicación desde el botón Post en el menú inferior móvil */}
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

  function renderModal(content) {
    return (
      <div className="modal-overlay" onClick={() => {
        setShowProductModal(false);
        setShowOfferModal(false);
        setShowServiceModal(false);
        setShowEventModal(false);
        setShowChatList(false);
      }}>
        <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setShowProductModal(false);
              setShowOfferModal(false);
              setShowServiceModal(false);
              setShowEventModal(false);
              setShowChatList(false);
            }}
            className="modal-close-button"
          >X</button>
          {content}
        </div>
      </div>
    );
  }
}

export default Navbar;