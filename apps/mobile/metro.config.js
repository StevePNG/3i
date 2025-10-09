require('ts-node/register');
const { getDefaultConfig } = require('@expo/metro-config');
const { withTamagui } = require('@tamagui/metro-plugin');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '..', '..');

const config = getDefaultConfig(projectRoot);
const tamaguiConfigPath = path.join(
  workspaceRoot,
  'packages',
  'ui-kit',
  'tamagui.config.js'
);

config.watchFolders = [
  ...new Set([workspaceRoot, path.join(workspaceRoot, 'packages')])
];

config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.join(workspaceRoot, 'node_modules'),
  path.join(projectRoot, 'node_modules')
];

module.exports = withTamagui(config, {
  config: tamaguiConfigPath,
  components: ['tamagui', '@3i/ui-kit'],
  themeBuilder: false
});
