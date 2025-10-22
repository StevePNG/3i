const detoxGlobalTeardown = require('detox/runners/jest/globalTeardown');

module.exports = async () => {
  const expoProcess = global.__EXPO_PROCESS__;
  if (expoProcess) {
    try {
      expoProcess.removeAllListeners('exit');
      expoProcess.kill('SIGINT');
    } catch (error) {
      console.warn('Failed to terminate Expo dev server gracefully:', error);
    }
    global.__EXPO_PROCESS__ = undefined;
  }
  await detoxGlobalTeardown();
};
