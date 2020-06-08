#!/usr/bin/env node
'use strict';

const snoowrap = require('snoowrap');
const path = require('path');
const logger = require('../helpers/logger');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const USER_AGENT = process.env.USER_AGENT || '';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const USERNAME = process.env.REDDIT_USERNAME || '';
const PASSWORD = process.env.REDDIT_PASSWORD || '';

let CONFIG = {
  userAgent: USER_AGENT,
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  username: USERNAME,
  password: PASSWORD
};

module.exports.validateEnvConfiguration = async () => {
  if (!CONFIG || !CONFIG.userAgent || !CONFIG.clientId || !CONFIG.clientSecret) {
    return {
      isValid: false
    };
  }
  if (CONFIG && (!CONFIG.username || !CONFIG.password)) {
    return {
      isValid: true
    };
  }
  try {
    return await this.validateRedditCreds(CONFIG);
  } catch (err) {
    logger.err('invalid content supplied in .env ', err);
    return {
      isValid: false
    };
  }
};

module.exports.validateRedditCreds = async (suppliedCreds) => {
  try {
    if (suppliedCreds && suppliedCreds.username && suppliedCreds.password) {
      if (!suppliedCreds.userAgent && !suppliedCreds.clientId && !suppliedCreds.clientSecret) {
        CONFIG = {
          ...CONFIG,
          username: suppliedCreds.username,
          password: suppliedCreds.password
        };
      }
    }
    const redditObj = new snoowrap(CONFIG);
    const userInfo = await redditObj.getUser(CONFIG.username);
    const isValid = await userInfo.fetch().verified;
    return {
      config: CONFIG,
      isValid
    };
  } catch (err) {
    logger.error('error while validating credentials: ', err);
    return {
      isValid: false
    };
  }
};
