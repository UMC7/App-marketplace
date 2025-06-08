// src/context/AuthContext.js

import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../supabase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error al obtener la sesión:', error.message);
        } else if (data?.session?.user) {
          const user = data.session.user;

          // Buscar datos personalizados desde la tabla public.users
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (profileError) {
            console.warn('No se pudo obtener el perfil extendido:', profileError.message);
            setCurrentUser(user); // Fallback solo con user auth
          } else {
            setCurrentUser({
              ...user,
              app_metadata: userProfile, // Incluye role, etc.
            });
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error inesperado al obtener sesión:', err.message);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) {
    setCurrentUser(null);
  } else {
    getSession();
  }
});

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}