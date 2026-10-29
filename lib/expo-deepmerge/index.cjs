// Compatibility adapter for @expo/config, not a general deepmerge replacement.
// Expo only uses the default merge and the arrayMerge option for updates.
const createDeepmerge = require("@fastify/deepmerge");

module.exports = function mergeExpoConfig(target, source, options = {}) {
  for (const key of Object.keys(options)) {
    if (key !== "arrayMerge") {
      throw new TypeError(`Unsupported Expo merge option: ${key}`);
    }
  }
  if (options.arrayMerge !== undefined && typeof options.arrayMerge !== "function") {
    throw new TypeError("arrayMerge must be a function");
  }
  return createDeepmerge({
    symbols: true,
    ...(options.arrayMerge ? { mergeArray: () => options.arrayMerge } : {}),
  })(target, source);
};
