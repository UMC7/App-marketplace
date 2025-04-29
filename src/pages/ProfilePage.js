import React from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabase';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    window.location.reload(); // Para actualizar el estado global
  };

  return (
    <div>
      <h1>Perfil de usuario</h1>
      <p>Email: {currentUser?.email}</p>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
}

export default ProfilePage;