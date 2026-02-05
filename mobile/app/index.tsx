// mobile/app/index.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { WebView, type WebViewNavigation, type WebViewMessageEvent } from 'react-native-webview';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const WEB_URL_RAW = (process.env.EXPO_PUBLIC_WEB_URL || '').trim();
const WEB_URL = WEB_URL_RAW
  ? WEB_URL_RAW.startsWith('http://') || WEB_URL_RAW.startsWith('https://')
    ? WEB_URL_RAW
    : `https://${WEB_URL_RAW}`
  : '';

const DEBUG_WEBVIEW = false;
const LOADER_BG = '#2a2a2a';
const PUSH_REGISTER_URL =
  WEB_URL && WEB_URL.length
    ? `${WEB_URL.replace(/\/$/, '')}/api/push/register`
    : 'https://www.yachtdaywork.com/api/push/register';

function LoadingLogo() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.96, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);
  return (
    <View style={styles.loaderContent}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Image
          source={require('../assets/images/Iniciales.png')}
          style={styles.loaderLogo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

function WebViewRootInner() {
  const webviewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();

  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const systemColorScheme = useColorScheme();
  const normalizedColorScheme = systemColorScheme === 'dark' ? 'dark' : 'light';

  const authUserIdRef = useRef<string | null>(null);
  const expoPushTokenRef = useRef<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authAccessToken, setAuthAccessToken] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const stopLoader = () => setIsLoading(false);
  const startLoader = () => setIsLoading(true);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [canGoBack]);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      try {
        const { status: currentStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = currentStatus;

        if (finalStatus !== 'granted') {
          const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
          finalStatus = requestedStatus;
        }

        if (finalStatus !== 'granted') {
          return;
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        expoPushTokenRef.current = tokenResponse.data;
        setExpoPushToken(tokenResponse.data);
      } catch {}
    };

    registerForPushNotifications();
  }, []);

  useEffect(() => {
    if (!expoPushToken) return;
    const script = `(function(){var t="${expoPushToken.replace(/\\/g,'\\\\').replace(/"/g,'\\"')}";window.__expoPushToken=t;window.dispatchEvent(new CustomEvent('expo:pushToken',{detail:t}));})();true;`;
    webviewRef.current?.injectJavaScript(script);
  }, [expoPushToken]);

  useEffect(() => {
    if (!authUserId || !expoPushToken) return;
    const token = (authAccessToken || '').trim();
    if (!token || token.length < 50) return;

    const doRegister = (attempt = 1) => {
      fetch(PUSH_REGISTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Access-Token': token,
        },
        body: JSON.stringify({
          user_id: authUserId,
          platform: 'android',
          token: expoPushToken,
          access_token: token,
        }),
      })
        .then((res) => {
          if (res.status === 401 && attempt < 3) {
            setTimeout(() => doRegister(attempt + 1), 1500 * attempt);
            return;
          }
        })
        .catch(() => {});
    };

    void doRegister();
  }, [authUserId, authAccessToken, expoPushToken]);

  const handleRetry = () => {
    setHasError(false);
    startLoader();
    webviewRef.current?.reload();
  };

  const handleError = () => {
    setHasError(true);
    stopLoader();
  };

  const handleShouldStartLoad = (event: WebViewNavigation): boolean => {
    const { url } = event;

    if (DEBUG_WEBVIEW) console.log('WV nav request', url);

    if (url === 'about:blank') return true;
    if (url.startsWith('/')) return true;

    if (
      url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('sms:') ||
      url.startsWith('whatsapp://') ||
      url.startsWith('intent://') ||
      url.startsWith('geo:') ||
      url.startsWith('maps://') ||
      url.startsWith('stripe://')
    ) {
      Linking.openURL(url).catch(() => {});
      return false;
    }

    const match = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^\/?#]+)(.*)$/);
    if (!match) return false;

    const protocol = match[1].toLowerCase();
    const hostname = match[2].toLowerCase();

    if (
      protocol === 'https' &&
      (hostname === 'yachtdaywork.com' ||
        hostname === 'www.yachtdaywork.com' ||
        hostname.endsWith('.yachtdaywork.com'))
    ) {
      return true;
    }

    if (protocol === 'http' || protocol === 'https') {
      Linking.openURL(url).catch(() => {});
      return false;
    }

    return false;
  };

  const injectedJavaScriptBeforeContentLoaded = useMemo(
    () => `
      (function() {
        var meta = document.createElement('meta');
        meta.name = 'color-scheme';
        meta.content = '${normalizedColorScheme}';
        document.head.appendChild(meta);
        document.documentElement.setAttribute('data-theme', '${normalizedColorScheme}');
        document.documentElement.dataset.theme = '${normalizedColorScheme}';
        document.body.dataset.theme = '${normalizedColorScheme}';
        document.documentElement.style.setProperty('--preferred-color-scheme', '${normalizedColorScheme}');
        window.__ydw_system_color_scheme = '${normalizedColorScheme}';

        function pingReady() {
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage('ydw_ready');
            }
          } catch (e) {}
        }

        document.addEventListener('DOMContentLoaded', pingReady, { once: true });
        window.addEventListener('load', pingReady, { once: true });
        setTimeout(pingReady, 1200);
        setTimeout(pingReady, 3000);
        pingReady();
      })();
      true;
    `,
    [normalizedColorScheme]
  );

  if (!WEB_URL) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Missing EXPO_PUBLIC_WEB_URL</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>Check your internet and try again</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <WebView
            ref={webviewRef}
            source={{ uri: WEB_URL }}
            cacheEnabled
            originWhitelist={[
              'https://www.yachtdaywork.com',
              'https://yachtdaywork.com',
              'https://*.yachtdaywork.com',
            ]}
            javaScriptEnabled
            domStorageEnabled
            onLoadStart={startLoader}
            onLoadProgress={(e) => {
              if (e.nativeEvent.progress >= 0.2) stopLoader();
            }}
            onLoadEnd={stopLoader}
            onNavigationStateChange={(navState) => setCanGoBack(!!navState.canGoBack)}
            onError={handleError}
            onHttpError={handleError}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onMessage={(event: WebViewMessageEvent) => {
              const message = event?.nativeEvent?.data;
              if (!message) return;

              try {
                const payload = typeof message === 'string' ? JSON.parse(message) : null;
                if (payload?.type === 'NOTIF_BADGE' && typeof payload.count === 'number') {
                  Notifications.setBadgeCountAsync(Math.min(99, Math.max(0, payload.count)));
                  return;
                }
              } catch {}

              if (message === 'ydw_ready') {
                const token = expoPushTokenRef.current || expoPushToken;
                const tokenPart = token
                  ? `(function(){var t="${token.replace(/\\/g,'\\\\').replace(/"/g,'\\"')}";window.__expoPushToken=t;window.dispatchEvent(new CustomEvent('expo:pushToken',{detail:t}));})();`
                  : '';
                webviewRef.current?.injectJavaScript(`
                  window.dispatchEvent(new CustomEvent('ydw:ready'));
                  ${tokenPart}
                  true;
                `);
                stopLoader();
                return;
              }

              try {
                const payload = JSON.parse(message);
                if (payload?.type === 'AUTH' && payload.user_id) {
                  authUserIdRef.current = payload.user_id;
                  setAuthUserId(payload.user_id);
                  setAuthAccessToken(payload.access_token ?? null);
                }
              } catch {}
            }}
            injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
            style={styles.webview}
          />
        </View>
      )}

      {isLoading && (
        <View style={[styles.loaderOverlay, { backgroundColor: LOADER_BG }]}>
          <LoadingLogo />
        </View>
      )}
    </View>
  );
}

function WebViewRoot() {
  return (
    <SafeAreaProvider>
      <WebViewRootInner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webview: { flex: 1 },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContent: { justifyContent: 'center', alignItems: 'center' },
  loaderLogo: { width: 160, height: 160 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  errorTitle: { fontSize: 24, fontWeight: '700', color: '#081a3b', marginBottom: 12, textAlign: 'center' },
  errorMessage: { fontSize: 16, color: '#666', marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  retryButton: { paddingVertical: 12, paddingHorizontal: 32, backgroundColor: '#081a3b', borderRadius: 8, minWidth: 120, alignItems: 'center' },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

registerRootComponent(WebViewRoot);

export default WebViewRoot;
export { WebViewRoot };
