/**
 * Native app share: when running inside the React Native WebView,
 * posts share data to the native layer to open the SYSTEM NATIVE share sheet.
 * 
 * IMPORTANT: The native app should use the system's native share API:
 * - Android: ReactNative.Share.share() or Intent.ACTION_SEND
 * - iOS: UIActivityViewController
 * 
 * DO NOT show a custom share UI - use the system's native share sheet instead.
 * 
 * Web stays unchanged (navigator.share or WhatsApp+Copy fallback).
 */
export const isInNativeApp = () =>
  typeof window !== 'undefined' && !!window.ReactNativeWebView;

export const postShareToNative = (data) => {
  if (!isInNativeApp() || !window.ReactNativeWebView?.postMessage) return;
  try {
    const payload = JSON.stringify({
      type: 'SHARE',
      useNativeShare: true, // Explicit flag to use native system share
      title: data.title || '',
      text: data.text || '',
      url: data.url || '',
    });
    window.ReactNativeWebView.postMessage(payload);
  } catch (e) {
    console.error('postShareToNative failed', e);
  }
};
