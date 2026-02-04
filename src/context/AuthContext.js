// src/context/AuthContext.js
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import supabase from '../supabase';
import { registerFCM } from '../notifications/registerFCM';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Sube el "pending_avatar" guardado en localStorage y actualiza users.avatar_url
async function uploadPendingAvatarIfAny(user) {
  try {
    const raw = localStorage.getItem('pending_avatar');
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed?.dataUrl) return;

    // DataURL -> Blob
    const res = await fetch(parsed.dataUrl);
    const blob = await res.blob();

    // Ruta debe empezar con {auth.uid} para cumplir las policies
    const fileName = `avatar_${Date.now()}.webp`;
    const path = `${user.id}/${fileName}`;

    const { error: upErr } = await supabase
      .storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: blob.type || 'image/webp' });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = pub?.publicUrl;
    if (!avatarUrl) throw new Error('No public URL from storage');

    // Guarda en tu tabla public.users
    const { error: dbErr } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (dbErr) throw dbErr;

    localStorage.removeItem('pending_avatar');
  } catch (e) {
    console.error('uploadPendingAvatarIfAny error:', e);
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const postAuthToWebView = useCallback((session) => {
    if (typeof window === 'undefined' || !session?.user) return;
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: 'AUTH',
        user_id: session.user.id,
        access_token: session.access_token || null,
      }),
    );
  }, []);

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

        const buildExtendedUser = (profileData) => {
          const mergedAppMetadata = {
            ...user.app_metadata,
            ...(profileData || {}),
          };
          const resolvedRole =
            profileData?.role ||
            metadata.role ||
            user.app_metadata?.role ||
            user.role ||
            'user';
          return {
            ...user,
            role: resolvedRole,
            app_metadata: mergedAppMetadata,
          };
        };

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
          setCurrentUser(buildExtendedUser(null));
        } else {
          setCurrentUser(buildExtendedUser(userProfile));
        }
        postAuthToWebView(session);
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
        postAuthToWebView(session);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Subir "pending avatar" al tener usuario con id (una vez por sesión)
  useEffect(() => {
    const u = currentUser;
    if (!u?.id) return;
    uploadPendingAvatarIfAny(u);
  }, [currentUser?.id]);

  // === FCM: registrar/actualizar token cuando hay usuario autenticado ===
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!currentUser?.id) return;
    registerFCM(currentUser);
  }, [currentUser?.id]);

  // WebView: enviar user_id + access_token para que la app registre push con autenticación
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userId = currentUser?.id;
    if (!userId) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      postAuthToWebView(session);
    })();
  }, [currentUser?.id]);

  // 🔄 Escucha en tiempo real cambios en la fila del usuario (incluye avatar_url)
  // y actualiza currentUser.app_metadata sin recargar.
  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) return;

    const channel = supabase
      .channel(`user_${userId}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        (payload) => {
          const row = payload.new || payload.old;
          if (!row) return;

          // Merge de los campos del perfil dentro de app_metadata
          setCurrentUser((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
            role: row.role ?? prev.role,
            app_metadata: {
              ...prev.app_metadata,
              ...row,
            },
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
