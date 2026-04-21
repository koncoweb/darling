// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Redirect react-native-maps to a web-safe stub when bundling for web.
// react-native-maps uses native-only modules (codegenNativeCommands) that
// are not available in a browser environment.
const NATIVE_ONLY_MODULES = {
  'react-native-maps': path.resolve(__dirname, 'modules/react-native-maps/index.web.js'),
};

const originalResolver = config.resolver?.resolveRequest;

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Only swap out the module on web
    if (platform === 'web' && NATIVE_ONLY_MODULES[moduleName]) {
      return {
        filePath: NATIVE_ONLY_MODULES[moduleName],
        type: 'sourceFile',
      };
    }

    // Fall back to the original resolver (or the default Metro resolver)
    if (originalResolver) {
      return originalResolver(context, moduleName, platform);
    }

    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
