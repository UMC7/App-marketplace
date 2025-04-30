// src/pages/ProfilePage.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabase';

function ProfilePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al cerrar sesión:', error.message);
      }
      navigate('/login');
      window.location.reload();
    } catch (err) {
      console.error('Error inesperado al cerrar sesión:', err.message);
    }
  };

  return (
    <div>
      <h1>Perfil de usuario</h1>
      {currentUser ? (
        <>
          <p>Email: {currentUser.email}</p>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </>
      ) : (
        <p>No estás autenticado.</p>
      )}
    </div>
  );
}

export default ProfilePage;