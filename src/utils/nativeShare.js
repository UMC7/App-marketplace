/**
 * Native app share: when running inside the React Native WebView,
 * posts share data to the native layer to open the system share sheet.
 * Web stays unchanged (navigator.share or WhatsApp+Copy fallback).
 */
export const isInNativeApp = () =>
  typeof window !== 'undefined' && !!window.ReactNativeWebView;

export const postShareToNative = (data) => {
  if (!isInNativeApp() || !window.ReactNativeWebView?.postMessage) return;
  try {
    const payload = JSON.stringify({
      type: 'SHARE',
      title: data.title || '',
      text: data.text || '',
      url: data.url || '',
    });
    window.ReactNativeWebView.postMessage(payload);
  } catch (e) {
    console.error('postShareToNative failed', e);
  }
};
