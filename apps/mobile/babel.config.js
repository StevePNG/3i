const path = require('path');

module.exports = function (api) {
  api.cache(true);

  const tamaguiConfig = path.join(
    __dirname,
    '../packages/ui-kit/tamagui.config.js'
  );

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui', '@3i/ui-kit'],
          config: tamaguiConfig,
          logTimings: false
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};
