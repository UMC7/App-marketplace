import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import CookieBanner from './components/cookies/CookieBanner';
import { initAnalytics } from './utils/analytics';
import { getConsent, getThemePreference } from './components/cookies/cookiesConfig';

import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import PostProduct from './pages/PostProduct';
import ProductDetailPage from './pages/ProductDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import CartPage from './pages/CartPage';
import YachtServicesPage from './pages/YachtServicesPage';
import YachtWorksPage from './pages/YachtWorksPage';
import EventsPage from './pages/EventsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPanel from './admin/AdminPanel';
import LegalPage from './pages/legal/LegalPage';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';

import './App.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AnimatedLayout from './layouts/AnimatedLayout'; // ✅ Nuevo layout

// ✅ NUEVO: detalle de evento (para deep links o uso futuro)
import EventDetail from './pages/EventDetail';

function AuthRedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { pathname, hash, search } = location;
    const hashParams = new URLSearchParams((hash || '').replace(/^#/, ''));
    const searchParams = new URLSearchParams(search || '');

    const type = hashParams.get('type') || searchParams.get('type');
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');

    if (type === 'recovery' && accessToken) {
      navigate(`/reset-password${hash || ''}`, { replace: true });
      return;
    }

    if (type === 'signup' && accessToken) {
      toast.success('Your email has been successfully verified.');
      navigate('/login', { replace: true });
      return;
    }

    if (pathname === '/' && hash === '#') {
      navigate('/reset-password', { replace: true });
    }
  }, [location, navigate]);

  return null;
}

function AppRoutes({ currentUser }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<AnimatedLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<HomePage />} />

          <Route
            path="/login"
            element={!currentUser ? <LoginPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/register"
            element={!currentUser ? <RegisterPage /> : <Navigate to="/profile" replace />}
          />

          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/yacht-services" element={<YachtServicesPage />} />
          <Route path="/yacht-services/post-product" element={<PostProduct />} />
          <Route path="/yacht-works" element={<YachtWorksPage />} />

          {/* Listado de eventos */}
          <Route path="/events" element={<EventsPage />} />

          {/* ✅ NUEVO: rutas de detalle por ID o slug, por si quieres usarlas/compartir */}
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/events/:id" element={<EventDetail />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post-product"
            element={
              <ProtectedRoute>
                <PostProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { currentUser, loading } = useAuth();
  const [consentLoaded, setConsentLoaded] = useState(false);

  useEffect(() => {
    const savedTheme = getThemePreference();
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  useEffect(() => {
    const storedConsent = getConsent();
    if (storedConsent) {
      initAnalytics();
    }
    setConsentLoaded(true);
  }, []);

  if (loading || !consentLoaded) {
    return <div>Loading application...</div>;
  }

  return (
    <Router>
      <Navbar />
      <AuthRedirectHandler />
      <ToastContainer autoClose={1500} />
      <CookieBanner />

      <div className="main-content">
        <AppRoutes currentUser={currentUser} />
      </div>
    </Router>
  );
}

export default App;