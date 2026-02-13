/**
 * Configura explícitamente la raíz del proyecto para que el autolinking
 * use mobile/node_modules en lugar de la raíz del monorepo.
 */
module.exports = {
  project: {
    android: {
      sourceDir: './android',
      appName: 'app',
    },
    ios: {
      sourceDir: './ios',
    },
  },
};
