#!/usr/bin/env node
'use strict';

module.exports.filterPostData = (postDataObj, whitelist) => {
  return postDataObj.map(post => Object.keys(post).reduce((obj, key) => {
    if (whitelist.indexOf(key) > -1) {
      obj[key] = post[key];
    }
    return obj;
  }, {}));
};
