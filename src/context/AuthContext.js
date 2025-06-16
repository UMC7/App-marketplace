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
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error al obtener la sesión:', error.message);
          setCurrentUser(null);
          return;
        }

        if (!session?.user) {
          setCurrentUser(null);
          return;
        }

        const user = session.user;
        const metadata = user.user_metadata || {};

        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (selectError && selectError.code === 'PGRST116') {
          // Usuario no existe aún, insertamos
          const insertPayload = {
            id: user.id,
            email: user.email,
            first_name: metadata.first_name || null,
            last_name: metadata.last_name || null,
            birth_year: metadata.birth_year || null,
            nickname: metadata.nickname || null,
            phone: metadata.phone || null,
            alt_phone: metadata.alt_phone || null,
            alt_email: metadata.alt_email || null,
            accepted_terms: metadata.accepted_terms === true,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: insertError } = await supabase.from('users').insert(insertPayload);
          if (insertError) {
            console.warn('No se pudo insertar el perfil del usuario:', insertError.message);
          }
        } else if (existingUser) {
          // Usuario ya existe, actualizamos si hay campos vacíos
          const fieldsToUpdate = {};

          const fields = [
            'first_name',
            'last_name',
            'birth_year',
            'nickname',
            'phone',
            'alt_phone',
            'alt_email',
            'accepted_terms',
          ];

          for (const field of fields) {
            const dbValue = existingUser[field];
            const metaValue = metadata[field];

            const isEmpty =
              dbValue === null ||
              dbValue === undefined ||
              dbValue === '' ||
              (field === 'accepted_terms' && dbValue === false);

            if (isEmpty && metaValue !== undefined && metaValue !== null && metaValue !== '') {
              fieldsToUpdate[field] =
                field === 'birth_year' ? parseInt(metaValue) :
                field === 'accepted_terms' ? metaValue === true :
                metaValue;
            }
          }

          if (Object.keys(fieldsToUpdate).length > 0) {
            fieldsToUpdate.updated_at = new Date().toISOString();
            const { error: updateError } = await supabase
              .from('users')
              .update(fieldsToUpdate)
              .eq('id', user.id);

            if (updateError) {
              console.warn('No se pudieron actualizar los campos vacíos:', updateError.message);
            }
          }
        }

        // Obtener perfil actualizado
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('No se pudo obtener el perfil extendido:', profileError.message);
          setCurrentUser(user);
        } else {
          setCurrentUser({
            ...user,
            app_metadata: {
              ...user.app_metadata,
              ...userProfile,
            },
          });
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