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
  const [showPostOptions, setShowPostOptions] = useState(false);
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
      {window.matchMedia('(max-width: 768px) and (orientation: portrait)').matches && (
  <div className="navbar-bottom">
    {currentUser ? (
      <>
        <button className="nav-icon-button" onClick={() => navigate('/profile')}>
          <span className="material-icons">account_circle</span>
          <small>Profile</small>
        </button>

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

{showPostOptions && (
  <div
    className="post-options-modal"
    onClick={() => setShowPostOptions(false)}
  >
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