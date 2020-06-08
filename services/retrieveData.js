#!/usr/bin/env node
'use strict';

const logger = require('../helpers/logger');
const snoowrap = require('snoowrap');
const numeral = require('numeral');
const { filterPostData } = require('../helpers/filterData');

const REQUIRED_POST_DETAILS = [
  'title', 'id', 'downs', 'ups', 'thumbnail_height',
  'thumbnail_width', 'score', 'thumbnail', 'media_only', 'author',
  'num_comments', 'permalink', 'url', 'is_video', 'comments', 'selftext',
  'subreddit', 'created_utc', 'over_18'
];

module.exports.retrieveData = async (config, subReddit = 'all', sortOption = 'default') => {
  if (!config) {
    logger.error('config not found');
    return null;
  }
  const sortObj = {
    hot: 'getHot',
    new: 'getNew',
    controversial: 'getControversial',
    rising: 'getRising',
    default: 'getTop',
  };
  try {
    let data = [
      [
        'Score',
        'Author',
        'Subreddit',
        'Title'
      ]
    ];
    const reddit = new snoowrap(config);
    logger.info(`attempting to fetch subreddit: r/${subReddit} data with sort as ${sortOption}`);
    let postsObj = await reddit.getSubreddit(`${subReddit}`)[sortObj[sortOption]]({ limit: 100 });
    const posts = filterPostData(postsObj, REQUIRED_POST_DETAILS);
    logger.info(`r/${subReddit}, sort: ${sortOption} data loading complete`);

    posts.forEach(element => {
      data.push([
        element.score > 1000 ? numeral(element.score).format('0.00a').toString() : element.score.toString(),
        element.author.name,
        `/r/${element.subreddit.display_name}`,
        (element.title.length > 85) ? `${element.title.substr(0, 85)}...` : element.title
      ]);
    });
    return {
      data,
      posts,
      subReddit,
      sortOption
    };
  } catch (err) {
    logger.error('something went wrong while fetching data ', err);
    return null;
  }
};

module.exports.getSubredditList = async (config) => {
  if (!config) {
    throw new Error('no config found');
  }
  try {
    const reddit = new snoowrap(config);
    logger.info('loading subreddits list');
    let subRedditListObj = await reddit.getPopularSubreddits({ limit: 100 });
    let subRedditList = subRedditListObj.map((data) => data.display_name_prefixed);
    logger.info('loading completed for subreddits list');
    return subRedditList;
  } catch (err) {
    logger.error('couldn\'t load subreddit list');
  }
};
