// mobile/plugins/withForceDarkAllowedFalse.js
const { withAndroidStyles } = require('@expo/config-plugins');

module.exports = function withForceDarkAllowedFalse(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;

    const appTheme = styles.resources.style?.find((s) => s.$?.name === 'AppTheme');
    if (!appTheme) return config;

    appTheme.item = appTheme.item || [];

    const existing = appTheme.item.find((i) => i.$?.name === 'android:forceDarkAllowed');
    if (existing) {
      existing._ = 'false';
    } else {
      appTheme.item.push({ $: { name: 'android:forceDarkAllowed' }, _: 'false' });
    }

    return config;
  });
};