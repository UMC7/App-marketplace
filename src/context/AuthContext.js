// src/context/AuthContext.js
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import supabase from '../supabase';
import { registerFCM } from '../notifications/registerFCM';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const isRegistrationComplete = (profileData) => Boolean(
  profileData?.first_name &&
  profileData?.last_name &&
  profileData?.birth_year &&
  profileData?.nickname &&
  profileData?.phone_code &&
  profileData?.phone_number &&
  profileData?.accepted_terms === true
);

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
    registration_complete: isRegistrationComplete(profileData),
    app_metadata: mergedAppMetadata,
  };
};

async function uploadPendingAvatarIfAny(user) {
  try {
    const raw = localStorage.getItem('pending_avatar');
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed?.dataUrl) return;

    const res = await fetch(parsed.dataUrl);
    const blob = await res.blob();
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
  const currentUserIdRef = useRef(null);
  const postAuthToWebView = useCallback((session) => {
    if (typeof window === 'undefined' || !window.ReactNativeWebView || !session?.user) return;
    const accessToken = (session.access_token || '').trim();
    if (!accessToken) return;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'AUTH',
        user_id: session.user.id,
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

        const user = session.user;
        const metadata = user.user_metadata || {};

        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (selectError && selectError.code === 'PGRST116') {
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
          sessionRef.current = session;
        }
      } catch (err) {
        console.error('Error inesperado al obtener sesión inicial:', err.message);
        setCurrentUser(null);
      }

      await getSession();

      authListener = supabase.auth.onAuthStateChange((event, session) => {
        if (!session?.user) {
          sessionRef.current = null;
          setCurrentUser(null);
          return;
        }

        sessionRef.current = session;

        hydrateSessionUser(session.user).then((extendedUser) => {
          if (extendedUser) setCurrentUser(extendedUser);
        });
      });
    };

    bootstrap();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  useEffect(() => {
    const u = currentUser;
    if (!u?.id || u.registration_complete !== true) return;
    uploadPendingAvatarIfAny(u);
  }, [currentUser?.id, currentUser?.registration_complete]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!currentUser?.id || currentUser.registration_complete !== true) return;
    if (window.ReactNativeWebView) return;
    registerFCM(currentUser);
  }, [currentUser?.id, currentUser?.registration_complete]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userId = currentUser?.id;
    if (!userId || currentUser.registration_complete !== true) return;
    if (sessionRef.current) postAuthToWebView(sessionRef.current);
  }, [currentUser?.id, currentUser?.registration_complete, postAuthToWebView]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let retryTimeout;
    let resendTimeouts = [];
    const handler = () => {
      if (currentUser?.registration_complete !== true) return;
      if (sessionRef.current) {
        postAuthToWebView(sessionRef.current);
        resendTimeouts.push(setTimeout(() => {
          if (sessionRef.current) postAuthToWebView(sessionRef.current);
        }, 2000));
        resendTimeouts.push(setTimeout(() => {
          if (sessionRef.current) postAuthToWebView(sessionRef.current);
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
  }, [postAuthToWebView, currentUser?.registration_complete]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let mounted = true;
    const registerFromWeb = async (expoToken) => {
      const session = sessionRef.current;
      if (!mounted || currentUser?.registration_complete !== true) return;
      if (!session?.user?.id || !expoToken) return;
      const accessToken = (session.access_token || '').trim();
      if (!accessToken || accessToken.length < 50) return;
      const platform = /iPhone|iPad|iPod/.test(navigator.userAgent || '') ? 'ios' : 'android';
      try {
        await fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            user_id: session.user.id,
            platform,
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
    return () => {
      mounted = false;
      window.removeEventListener('expo:pushToken', handler);
    };
  }, [currentUser?.registration_complete]);

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

          setCurrentUser((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              role: row.role ?? prev.role,
              registration_complete: isRegistrationComplete(row),
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
