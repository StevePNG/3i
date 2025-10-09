require('ts-node/register');

const configModule = require('./src/tamagui.config.ts');

module.exports = configModule.config || configModule.default || configModule;
