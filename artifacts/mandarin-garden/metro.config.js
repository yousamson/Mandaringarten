const { getDefaultConfig } = require('expo/metro-config');
const { createPreviewRouting } = require('./scripts/preview-routing.cjs');

const config = getDefaultConfig(__dirname);
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) =>
  createPreviewRouting(
    enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware,
    process.env.REPLIT_EXPO_DEV_DOMAIN,
    process.env.BASE_PATH || '/mobile/',
  );

module.exports = config;
