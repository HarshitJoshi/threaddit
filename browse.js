#!/usr/bin/env node
'use strict';

const colors = require('colors');
const blessed = require('neo-blessed');
const contrib = require('blessed-contrib');

const { colorScheme } = require('./helpers/constants');

const { createLoginScreen } = require('./modals/login');
const { createPostsScreen } = require('./modals/posts');
const { createNotification } = require('./modals/notification');

const logger = require('./helpers/logger');
const { loadingMessages } = require('./helpers/loadingMessages');
const { validateEnvConfiguration, validateRedditCreds } = require('./helpers/validateConfig');

const { retrieveData } = require('./services/retrieveData');

let dotEnvCreds = null;
let loginEntryStatus = false;
let screen = null;
let grid = null;
let menubar = null;
let loader = null;

function setLoader() {
  let loading = blessed.loading({
    parent: screen,
    align: 'center',
    top: 'center',
    left: 'center',
    height: 'shrink',
    width: 'half'
  });

  screen.on('resize', () => {
    loading.emit('attach');
  });

  return loading;
}

async function displayLoginScreen() {
  try {
    const enteredCreds = await createLoginScreen(screen);
    const verifiedConfigObj = await validateRedditCreds(enteredCreds);
    if (!verifiedConfigObj.isValid) {
      await createNotification(screen, {
        label: ' {bold}{red-fg}Error{/bold}{/red-fg} ',
        hint: ' {bold}{black-fg}Check your connection or credentials.{/bold}{/black-fg} '
      });
      return await displayLoginScreen();
    }
    loginEntryStatus = false;
    return {
      config: verifiedConfigObj.config
    };
  } catch (err) {
    logger.error('error during login screen', err);
  }
}

async function buildMenuCommands() {

  let login = {
    ' Login': {
      keys: ['L-l', 'L', 'l'],
      callback: async () => {
        loginEntryStatus = true;
        await displayLoginScreen();
      }
    }
  };

  let switchSubreddit = {
    ' Switch Subreddit': {
      keys: ['A-a', 'A', 'a']
    }
  };

  let switchSubredditSort = {
    ' Switch Sorting': {
      keys: ['B-b', 'B', 'b']
    }
  };

  let defaultCmds = {
    ' Exit': {
      keys: ['E-e', 'E', 'e', 'escape'],
      callback: () => process.exit(0)
    },
    ' Gain focus': {
      keys: ['tab']
    }
  };


  const cmds = loginEntryStatus
    ? { ...login, ...defaultCmds }
    : { ...switchSubreddit, ...switchSubredditSort, ...defaultCmds };

  return cmds;
}

async function createInterface() {
  screen = blessed.screen({
    smartCSR: true,
    title: 'Threaddit',
    cursor: {
      artificial: true,
      shape: 'line',
      blink: true,
      color: 'red'
    }
  });

  menubar = blessed.listbar({
    parent: screen,
    keys: true,
    bottom: 0,
    left: 0,
    height: 2,
    style: {
      item: {
        fg: 'yellow'
      },
      selected: {
        fg: 'yellow'
      }
    },
    commands: await buildMenuCommands()
  });

  grid = new contrib.grid({
    rows: 36,
    cols: 36,
    screen: screen
  });

  screen.on('resize', () => {
    menubar.emit('attach');
  });

  screen.key(['escape', 'C-c'], (ch, key) => process.exit(0));

  try {
    if (!dotEnvCreds || !dotEnvCreds.isValid || !dotEnvCreds.config) {
      loginEntryStatus = true;
      return await displayLoginScreen();
    }
    return {
      config: dotEnvCreds.config
    };
  } catch (err) {
    logger.error('something went wrong while creating interface ', err);
  }
}

async function main() {
  try {
    logger.info('Validating Env Config...');
    dotEnvCreds = await validateEnvConfiguration();
    if (!dotEnvCreds.isValid) {
      throw new Error('invalid or missing env creds');
    }
    logger.info('Env config loaded')
    const interfaceObj = await createInterface();
    if (!interfaceObj || !interfaceObj.config) {
      throw new Error('inteface was not initialized properly');
    }
    loader = setLoader();
    loader.load(`${loadingMessages[loadingMessages.length * Math.random() | 0]}`.bold.green);
    logger.info('attempting to fetch data');
    const retrievedDataObj = await retrieveData(interfaceObj.config);
    if (!retrievedDataObj) {
      throw new Error('couldn\'t retrieve data correctly');
    }
    loader.stop();
    await createPostsScreen(screen, grid, retrievedDataObj, interfaceObj.config);
  } catch (err) {
    logger.error(err);
    console.log('something went wrong with the application, check logs ');
  }
}

(async () => {
  await main();
})();
