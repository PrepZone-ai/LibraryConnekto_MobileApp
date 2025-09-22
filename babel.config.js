module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          extensions: ['.tsx', '.ts', '.js', '.json'],
          alias: {
            '@components': './components',
            '@services': './services',
            '@config': './config',
            '@types': './types',
            '@lib': './lib'
          }
        }
      ],
      [
        'module:react-native-dotenv',
        {
          "moduleName": "@env",
          "path": ".env",
          "blacklist": null,
          "whitelist": null,
          "safe": false,
          "allowUndefined": true
        }
      ],
      [
        'react-native-paper/babel',
        {
          commonjs: true,
        },
      ],
    ],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  };
};
