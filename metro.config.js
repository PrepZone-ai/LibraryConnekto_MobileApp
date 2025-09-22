const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    sourceExts: [...config.resolver.sourceExts, 'mjs'],
    extraNodeModules: {
      ...config.resolver.extraNodeModules,
      'react-native-svg': require.resolve('react-native-svg'),
      'react-native-vector-icons': require.resolve('react-native-vector-icons'),
    },
    assetExts: [...config.resolver.assetExts, 'ttf', 'otf'],
  },
};
