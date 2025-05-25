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
import '../navbar.css'; // ✅ Import de estilos refinados para navbar

function Navbar() {
  const { currentUser } = useAuth();
  const { cartItems = [], setCartItems } = useCarrito();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef();

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
    <Link to="/">
      <img
        src="/logos/yachtdaywork.png"
        alt="YachtDayWork logo"
        className="navbar-logo"
      />
    </Link>
    <button className="navbar-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</button>
  </div>

      <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>

          {currentUser ? (
            <>
              <button onClick={() => { navigate('/profile'); setIsMenuOpen(false); }} className="profile-icon-text">
              <span className="material-icons">account_circle</span>
              <small>Profile</small>
              </button>

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

      {/* Modales */}
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
    </nav>
  );

  function renderModal(content) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }} onClick={() => {
        setShowProductModal(false);
        setShowOfferModal(false);
        setShowServiceModal(false);
        setShowEventModal(false);
        setShowChatList(false);
      }}>
        <div style={{
          backgroundColor: '#fff',
          color: '#000',
          padding: '20px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setShowProductModal(false);
              setShowOfferModal(false);
              setShowServiceModal(false);
              setShowEventModal(false);
              setShowChatList(false);
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '15px',
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >X</button>
          {content}
        </div>
      </div>
    );
  }
}

export default Navbar;