import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Contexts
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

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
import EditProductPage from './pages/EditProductPage';
import YachtServicesPage from './pages/YachtServicesPage';
import YachtWorksPage from './pages/YachtWorksPage'; // ajusta el path si es necesario
import EditServicePage from './pages/EditServicePage'; // ✅ Importación agregada

import './App.css';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Cargando aplicación...</div>;
  }

  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/marketplace" element={<HomePage />} />
        <Route
          path="/login"
          element={!currentUser ? <LoginPage /> : <Navigate to="/profile" replace />}
        />
        <Route
          path="/register"
          element={!currentUser ? <RegisterPage /> : <Navigate to="/profile" replace />}
        />
        <Route path="/product/:id" element={<ProductDetailPage />} />

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
          path="/editproduct/:id"
          element={
            <ProtectedRoute>
              <EditProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editservice/:id"
          element={
            <ProtectedRoute>
              <EditServicePage />
            </ProtectedRoute>
          }
        />{/* ✅ Ruta agregada */}

        <Route path="/yacht-services" element={<YachtServicesPage />} />
        <Route path="/yacht-services/post-product" element={<PostProduct />} />
        <Route path="/yacht-works" element={<YachtWorksPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;