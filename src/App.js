import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

// Contexts
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import CookieBanner from './components/cookies/CookieBanner';

// Pages
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

function AuthRedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    const access_token = params.get('access_token');

    if (type === 'recovery' && access_token) {
      navigate(`/reset-password?${params.toString()}`, { replace: true });
    }

    if (type === 'signup' && access_token) {
      toast.success('Your email has been successfully verified.');
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  return null;
}

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading application...</div>;
  }

  return (
    <Router>
      <Navbar />
      <AuthRedirectHandler />
      <ToastContainer autoClose={1500} />

      {/* Banner de Cookies */}
      <CookieBanner />

      <div className="main-content">
        <Routes>
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
          <Route path="/events" element={<EventsPage />} />

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
        </Routes>
      </div>
    </Router>
  );
}

export default App;