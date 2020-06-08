#!/usr/bin/env node
'use strict';

const logger = require('../helpers/logger');
const { validateEnvConfiguration } = require('../helpers/validateConfig');
const snoowrap = require('snoowrap');

module.exports.hasValidLoginCreds = async (credentials) => {
  const validConfig = validateEnvConfiguration();
  let { isValid, config } = validConfig;
  if (!isValid || !config) {
    throw new Error('something went wrong with loading credentials');
  }
  if (!config.username || !config.password) {
    if (!credentials || !credentials.username || !credentials.password) {
      return false;
    }
    config = {
      ...config,
      username: credentials.username,
      password: credentials.password
    }
  }
  try {
    const redditObj = new snoowrap(config);
    const userInfo = await redditObj.getUser(config.username);
    const isVerified = await userInfo.fetch().verified;
    return {
      config,
      isVerified
    };
  } catch (err) {
    logger.error('error while validating credentials: ', err);
    return {
      isVerified: false
    };
  }
};
