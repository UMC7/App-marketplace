const { withAndroidStyles } = require('@expo/config-plugins');

/**
 * Plugin to configure Android navigation bar to follow system theme
 * This sets the navigation bar to use system colors (light/dark) based on system theme
 */
const withSystemNavigationBar = (config) => {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;

    // Find or create AppTheme
    let appTheme = styles.resources.style?.find((s) => s.$?.name === 'AppTheme');
    if (!appTheme) {
      if (!styles.resources.style) {
        styles.resources.style = [];
      }
      appTheme = { $: { name: 'AppTheme' }, item: [] };
      styles.resources.style.push(appTheme);
    }

    appTheme.item = appTheme.item || [];

    // Remove existing navigation bar color if present (to allow system to control it)
    const navBarColorIndex = appTheme.item.findIndex((i) => i.$?.name === 'android:navigationBarColor');
    if (navBarColorIndex >= 0) {
      appTheme.item.splice(navBarColorIndex, 1);
    }

    // Set navigation bar to use system theme
    // This allows the navigation bar to automatically follow system dark/light mode
    const systemNavBar = appTheme.item.find((i) => i.$?.name === 'android:windowNavigationBarColor');
    if (!systemNavBar) {
      // Use transparent or system default - Android will handle theme automatically
      appTheme.item.push({ $: { name: 'android:windowNavigationBarColor' }, _: '@android:color/transparent' });
    }

    return config;
  });
};

module.exports = withSystemNavigationBar;
