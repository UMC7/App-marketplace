import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Contexts
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import PostProduct from './pages/PostProduct';
import ProductDetailPage from './pages/ProductDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import CartPage from './pages/CartPage';
import EditProductPage from './pages/EditProductPage'; // ✅ NUEVO

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Cargando aplicación...</div>;
  }

  return (
    <Router>
      <Navbar />

      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={!currentUser ? <LoginPage /> : <Navigate to="/profile" replace />}
        />
        <Route
          path="/register"
          element={!currentUser ? <RegisterPage /> : <Navigate to="/profile" replace />}
        />
        <Route path="/product/:id" element={<ProductDetailPage />} />

        {/* Rutas protegidas */}
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

        {/* Fallback para rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;