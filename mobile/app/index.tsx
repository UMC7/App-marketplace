import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { registerRootComponent } from 'expo';

const WEB_URL_RAW = (process.env.EXPO_PUBLIC_WEB_URL || '').trim();
const WEB_URL = WEB_URL_RAW
  ? WEB_URL_RAW.startsWith('http://') || WEB_URL_RAW.startsWith('https://')
    ? WEB_URL_RAW
    : `https://${WEB_URL_RAW}`
  : '';

const DEBUG_WEBVIEW = true;

function WebViewRoot() {
  const webviewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!WEB_URL) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Missing EXPO_PUBLIC_WEB_URL</Text>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBack && webviewRef.current) {
        // @ts-ignore
        webviewRef.current.goBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [canGoBack]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (webviewRef.current) {
      // @ts-ignore
      webviewRef.current.reload();
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleShouldStartLoad = (event: WebViewNavigation): boolean => {
    const { url } = event;

    if (DEBUG_WEBVIEW) console.log('WV nav request', url);

    if (
      (url === 'https://yachtdaywork.com/' && WEB_URL.includes('yachtdaywork.com')) ||
      (url === 'https://www.yachtdaywork.com/' && WEB_URL.includes('yachtdaywork.com'))
    ) {
      return true;
    }

    if (url === 'about:blank') {
      return true;
    }

    if (url.startsWith('/')) {
      return true;
    }

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
      Linking.openURL(url).catch((err) => {
        console.warn('Failed to open URL:', url, err);
      });
      return false;
    }

    const match = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^\/?#]+)(.*)$/);
    if (!match) return false;

    const protocol = (match[1] || '').toLowerCase();
    const hostname = (match[2] || '').toLowerCase();

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

  return (
    <SafeAreaView style={styles.container}>
      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>Check your internet and try again</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
          onLoadStart={() => setIsLoading(true)}
          onLoadProgress={(e) => {
            if (DEBUG_WEBVIEW) console.log('WV progress', e?.nativeEvent?.progress, e?.nativeEvent?.url);
          }}
          onLoadEnd={(e) => {
            if (DEBUG_WEBVIEW) console.log('WV loadEnd', e?.nativeEvent?.url);
            setIsLoading(false);
          }}
          onNavigationStateChange={(navState) => setCanGoBack(!!navState.canGoBack)}
          onError={(e) => {
            if (DEBUG_WEBVIEW) console.log('WV onError', e?.nativeEvent);
            handleError();
          }}
          onHttpError={(e) => {
            if (DEBUG_WEBVIEW) console.log('WV onHttpError', e?.nativeEvent);
            handleError();
          }}
          onConsoleMessage={(e) => {
            if (DEBUG_WEBVIEW) console.log('WV console', e?.nativeEvent?.message);
          }}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          style={styles.webview}
        />
      )}
      {isLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#081a3b" />
        </View>
      )}
      <View style={styles.bottomSpacer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  bottomSpacer: {
    height: 0,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
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
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#081a3b',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#081a3b',
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

registerRootComponent(WebViewRoot);

export { WebViewRoot };
