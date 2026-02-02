// mobile/app/index.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

const WEB_URL_RAW = (process.env.EXPO_PUBLIC_WEB_URL || '').trim();
const WEB_URL = WEB_URL_RAW
  ? WEB_URL_RAW.startsWith('http://') || WEB_URL_RAW.startsWith('https://')
    ? WEB_URL_RAW
    : `https://${WEB_URL_RAW}`
  : '';

const DEBUG_WEBVIEW = false;

function WebViewRootInner() {
  const webviewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();

  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const systemColorScheme = useColorScheme();
  const normalizedColorScheme = systemColorScheme === 'dark' ? 'dark' : 'light';

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
        console.log('Push notification permission status (before request):', currentStatus);
        let finalStatus = currentStatus;

        if (finalStatus !== 'granted') {
          const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
          console.log('Push notification permission status (after request):', requestedStatus);
          finalStatus = requestedStatus;
        }

        if (finalStatus !== 'granted') {
          console.log('Push notifications permission not granted.');
          return;
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync();
        console.log('Expo push token (debug):', tokenResponse.data);
      } catch (error) {
        console.log('Failed to register for push notifications:', error);
      }
    };

    registerForPushNotifications();
  }, []);

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

  const injectedJavaScriptBeforeContentLoaded = useMemo(() => `
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
            `, [normalizedColorScheme]);

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
            onMessage={(e) => {
              if (e?.nativeEvent?.data === 'ydw_ready') stopLoader();
            }}
            injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
            style={styles.webview}
          />
        </View>
      )}

      {isLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#081a3b" />
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
