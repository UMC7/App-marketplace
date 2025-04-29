// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../supabase'; // Asegúrate de importar tu conexión a Supabase

const AuthContext = createContext();

// Hook personalizado para usar el contexto más fácilmente
export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para obtener la sesión actual
  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error al obtener la sesión:', error.message);
    } else {
      setCurrentUser(data.session?.user || null);
    }
    setLoading(false);
  };

  // Escuchar cambios en la autenticación (login, logout)
  useEffect(() => {
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setCurrentUser(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    // Cleanup
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}