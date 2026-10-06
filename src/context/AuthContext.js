// src/context/AuthContext.js
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import supabase from '../supabase';
import { registerFCM } from '../notifications/registerFCM';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const isRegistrationComplete = (profileData) => Boolean(
  profileData?.first_name &&
  profileData?.last_name &&
  profileData?.birth_year &&
  profileData?.nickname &&
  profileData?.phone_code &&
  profileData?.phone_number &&
  profileData?.accepted_terms === true
);

const isGoogleUser = (user) => {
  const provider = user?.app_metadata?.provider;
  const providers = user?.app_metadata?.providers;
  return provider === 'google' || (Array.isArray(providers) && providers.includes('google'));
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
    registration_complete: true,
    app_metadata: mergedAppMetadata,
  };
};

async function getProfileForUser(user) {
  if (!user?.id) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.warn('No se pudo obtener el perfil extendido:', error.message);
    return null;
  }

  return data;
}

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
    let mounted = true;

    const resolveSession = async (session) => {
      if (!session?.user) {
        sessionRef.current = null;
        if (mounted) setCurrentUser(null);
        return;
      }

      const profile = await getProfileForUser(session.user);
      const requiresGoogleCompletion = isGoogleUser(session.user);
      const complete = !requiresGoogleCompletion || isRegistrationComplete(profile);

      if (!complete) {
        // Google OAuth may temporarily own a Supabase session while the
        // registration-completion form is being finished. Do not expose that
        // temporary session as an authenticated YachtDayWork user.
        sessionRef.current = null;
        if (mounted) setCurrentUser(null);
        return;
      }

      sessionRef.current = session;
      postAuthToWebView(session);
      if (mounted) setCurrentUser(buildExtendedUser(session.user, profile));
    };

    const bootstrap = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error al obtener la sesión:', error.message);
          if (mounted) setCurrentUser(null);
        } else {
          await resolveSession(session);
        }
      } catch (err) {
        console.error('Error inesperado al obtener sesión:', err.message);
        if (mounted) setCurrentUser(null);
      } finally {
        if (mounted) setLoading(false);
      }

      authListener = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          sessionRef.current = null;
          if (mounted) setCurrentUser(null);
          return;
        }

        resolveSession(session).catch((err) => {
          console.error('Error al resolver sesión:', err?.message || err);
          if (mounted) setCurrentUser(null);
        });
      });
    };

    bootstrap();

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  useEffect(() => {
    const u = currentUser;
    if (!u?.id) return;
    uploadPendingAvatarIfAny(u);
  }, [currentUser?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!currentUser?.id) return;
    if (window.ReactNativeWebView) return;
    registerFCM(currentUser);
  }, [currentUser?.id]);

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
  }, [postAuthToWebView]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let mounted = true;
    const registerFromWeb = async (expoToken) => {
      const session = sessionRef.current;
      if (!mounted) return;
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
  }, []);

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

            if (isGoogleUser(prev) && !isRegistrationComplete(row)) {
              sessionRef.current = null;
              return null;
            }

            return {
              ...prev,
              role: row.role ?? prev.role,
              registration_complete: true,
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
