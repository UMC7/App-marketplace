// src/context/AuthContext.js
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import supabase from '../supabase';
import { registerFCM } from '../notifications/registerFCM';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const buildExtendedUser = (user, profileData) => {
  if (!user) return null;

  const metadata = user.user_metadata || {};
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
  const sessionRef = useRef(null);
  const postAuthToWebView = useCallback(async (session, skipRefresh = false) => {
    if (typeof window === 'undefined' || !window.ReactNativeWebView || !session?.user) return;
    let s = session;
    if (!skipRefresh) {
      try {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        if (refreshed?.access_token) s = refreshed;
      } catch (_) {}
    }
    const accessToken = (s.access_token || '').trim();
    if (!accessToken) return;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'AUTH',
        user_id: s.user.id,
        access_token: accessToken,
      }),
    );
  }, []);

  useEffect(() => {
    let authListener;
    const hydrateSessionUser = async (user) => {
      if (!user?.id) return null;

      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('No se pudo obtener el perfil extendido:', profileError.message);
          return buildExtendedUser(user, null);
        }

        return buildExtendedUser(user, userProfile);
      } catch (err) {
        console.error('Error al obtener el perfil extendido:', err.message);
        return buildExtendedUser(user, null);
      }
    };

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
          sessionRef.current = null;
          return;
        }

        sessionRef.current = session;
        postAuthToWebView(session);

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
          setCurrentUser(buildExtendedUser(user, null));
        } else {
          setCurrentUser(buildExtendedUser(user, userProfile));
        }
      } catch (err) {
        console.error('Error inesperado al obtener sesión:', err.message);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    const bootstrap = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setCurrentUser(session.user);
          sessionRef.current = session;
        }
      } catch (err) {
        console.error('Error inesperado al obtener sesión inicial:', err.message);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }

      await getSession();

      authListener = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          sessionRef.current = null;
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        sessionRef.current = session;
        postAuthToWebView(session);
        setLoading(true);
        hydrateSessionUser(session.user)
          .then((extendedUser) => {
            if (extendedUser) {
              setCurrentUser(extendedUser);
            }
          })
          .finally(() => {
            setLoading(false);
          });
        // NO llamar getSession() aquí
      });
    };

    bootstrap();

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
    if (sessionRef.current) postAuthToWebView(sessionRef.current);
  }, [currentUser?.id, postAuthToWebView]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let retryTimeout;
    let resendTimeouts = [];
    const handler = () => {
      if (sessionRef.current) {
        postAuthToWebView(sessionRef.current);
        // Re-enviar AUTH 2s y 5s después por si la primera se perdió
        resendTimeouts.push(setTimeout(() => {
          if (sessionRef.current) postAuthToWebView(sessionRef.current, true);
        }, 2000));
        resendTimeouts.push(setTimeout(() => {
          if (sessionRef.current) postAuthToWebView(sessionRef.current, true);
        }, 5000));
      } else {
        retryTimeout = setTimeout(() => {
          if (sessionRef.current) postAuthToWebView(sessionRef.current);
        }, 1500);
      }
    };

    window.addEventListener('ydw:ready', handler);
    return () => {
      window.removeEventListener('ydw:ready', handler);
      if (retryTimeout) clearTimeout(retryTimeout);
      resendTimeouts.forEach((t) => clearTimeout(t));
    };
  }, [postAuthToWebView]);

  // Fallback: cuando la app nativa inyecta el Expo push token, la web registra directamente
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const registerFromWeb = async (expoToken) => {
      const session = sessionRef.current;
      if (!session?.user?.id || !expoToken) return;
      const accessToken = (session.access_token || '').trim();
      if (!accessToken || accessToken.length < 50) return;
      try {
        await fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            user_id: session.user.id,
            platform: 'android',
            token: expoToken,
            access_token: accessToken,
          }),
        });
      } catch (_) {}
    };
    const handler = (e) => {
      const token = (e?.detail || window.__expoPushToken || '').trim();
      if (token) registerFromWeb(token);
    };
    window.addEventListener('expo:pushToken', handler);
    if (window.__expoPushToken) handler({ detail: window.__expoPushToken });
    return () => window.removeEventListener('expo:pushToken', handler);
  }, []);

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
