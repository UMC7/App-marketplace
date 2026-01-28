import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';

export default function WebViewRoot() {
  const webviewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      // If WebView can go back, navigate history instead of exiting app
      if (canGoBack && webviewRef.current) {
        // @ts-ignore
        webviewRef.current.goBack();
        return true;
      }
      return false; // allow default behavior (exit app)
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [canGoBack]);

  const handleRetry = () => {
    setHasError(false);
    if (webviewRef.current) {
      // @ts-ignore
      webviewRef.current.reload();
    }
  };

  const handleError = () => {
    setHasError(true);
  };

  const handleShouldStartLoad = (event: WebViewNavigation): boolean => {
    const { url } = event;

    // Allow about:blank
    if (url === 'about:blank') {
      return true;
    }

    // Allow relative URLs
    if (url.startsWith('/')) {
      return true;
    }

    // Handle special schemes (must be handled by native apps)
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

    // Parse and validate absolute URLs
    try {
      const parsedUrl = new URL(url);
      const { protocol, hostname } = parsedUrl;

      // Allow only HTTPS yachtdaywork.com and subdomains
      if (
        protocol === 'https:' &&
        (hostname === 'yachtdaywork.com' || hostname.endsWith('.yachtdaywork.com'))
      ) {
        return true;
      }

      // Handle external HTTP/HTTPS URLs
      if (protocol === 'http:' || protocol === 'https:') {
        Linking.openURL(url).catch((err) => {
          console.warn('Failed to open URL:', url, err);
        });
        return false;
      }

      // Block any other protocol (file:, content:, data:, etc.)
      return false;
    } catch (error) {
      // If URL parsing fails and it's not a recognized scheme, block it
      console.warn('Invalid or unrecognized URL:', url);
      return false;
    }
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
          source={{ uri: 'https://www.yachtdaywork.com' }}
          originWhitelist={['https://www.yachtdaywork.com', 'https://*.yachtdaywork.com']}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          onNavigationStateChange={(navState) => setCanGoBack(!!navState.canGoBack)}
          onError={handleError}
          onHttpError={handleError}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          style={styles.webview}
        />
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
