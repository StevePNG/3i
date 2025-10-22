const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const net = require('net');

const detoxGlobalSetup = require('detox/runners/jest/globalSetup');

const START_TIMEOUT_MS = Number.parseInt(process.env.DETOX_EXPO_START_TIMEOUT || '120000', 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForMetro = async (url, timeoutMs, expoProcess) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (expoProcess.exitCode !== null) {
      throw new Error(`Expo dev server exited with code ${expoProcess.exitCode}`);
    }
    try {
      await new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
          response.on('data', () => {});
          response.on('end', () => {
            if (response.statusCode && response.statusCode >= 200 && response.statusCode < 400) {
              resolve();
            } else {
              reject(new Error(`Metro responded with status ${response.statusCode}`));
            }
          });
        });
        request.on('error', reject);
        request.setTimeout(5000, () => {
          request.destroy(new Error('Metro status request timed out'));
        });
      });
      return;
    } catch (error) {
      await sleep(1500);
    }
  }
  throw new Error(`Timed out after ${timeoutMs}ms waiting for Expo dev server at ${url}`);
};

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const tester = net.connect({ port, host: '127.0.0.1' });
    tester.once('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    tester.once('connect', () => {
      tester.end();
      resolve(false);
    });
    tester.setTimeout(1000, () => {
      tester.destroy();
      resolve(false);
    });
  });

const findAvailablePort = async (startPort, attempts = 8) => {
  let port = startPort;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortAvailable(port)) {
      return port;
    }
    port += 1;
  }
  throw new Error(`Unable to find open port starting from ${startPort}`);
};

module.exports = async () => {
  await detoxGlobalSetup();

  const projectRoot = path.resolve(__dirname, '..');
  const desiredPort = Number.parseInt(process.env.EXPO_METRO_PORT || '8081', 10);
  const resolvedPort = await findAvailablePort(desiredPort);
  const portArg = String(resolvedPort);

  process.env.EXPO_METRO_PORT = portArg;
  process.env.RCT_METRO_PORT = portArg;
  process.env.EXPO_DEV_SERVER_PORT = portArg;
  process.env.DETOX_DEV_SERVER_URL = `exp://127.0.0.1:${portArg}`;
  process.env.TAMAGUI_TARGET = process.env.TAMAGUI_TARGET || 'native';
  const tamaguiConfigPath = path.resolve(projectRoot, '../packages/ui-kit/tamagui.config.js');
  process.env.TAMAGUI_CONFIG = process.env.TAMAGUI_CONFIG || tamaguiConfigPath;
  global.__EXPO_PORT__ = resolvedPort;

  const expoCommand = process.env.DETOX_EXPO_COMMAND || 'npx';
  const expoArgs =
    process.env.DETOX_EXPO_ARGS?.split(' ').filter(Boolean) ?? [
      'expo',
      'start',
      '--dev-client',
      '--port',
      portArg
    ];

  const expoProcess = spawn(expoCommand, expoArgs, {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      EXPO_NO_DOTENV: '1',
      RCT_METRO_PORT: portArg,
      EXPO_DEV_SERVER_PORT: portArg,
      EXPO_METRO_PORT: portArg,
      TAMAGUI_TARGET: process.env.TAMAGUI_TARGET,
      TAMAGUI_CONFIG: process.env.TAMAGUI_CONFIG
    }
  });

  expoProcess.stdout.on('data', (data) => {
    process.stdout.write(`[expo] ${data}`);
  });
  expoProcess.stderr.on('data', (data) => {
    process.stderr.write(`[expo] ${data}`);
  });
  expoProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`Expo dev server exited prematurely with code ${code}`);
    }
  });

  global.__EXPO_PROCESS__ = expoProcess;

  const statusUrl = `http://127.0.0.1:${portArg}/status`;
  await waitForMetro(statusUrl, START_TIMEOUT_MS, expoProcess);
};
