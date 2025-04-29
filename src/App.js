// src/App.js
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

function App() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <Navbar />

      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/profile" />} />
        <Route path="/register" element={!currentUser ? <RegisterPage /> : <Navigate to="/profile" />} />

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
      </Routes>
    </Router>
  );
}

export default App;