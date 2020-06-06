'use strict';

const blessed = require('neo-blessed');
const { colorScheme } = require('../helpers/constants');
const logger = require('../helpers/logger');
const numeral = require('numeral');
const colors = require('colors');
const { getSubredditList, retrieveData } = require('../services/retrieveData');

function createListTable(
  screen,
  alignment,
  isInteractive = false,
) {
  return {
    parent: screen,
    keys: true,
    vi: true,
    align: alignment,
    interactive: isInteractive,
    style: {
      fg: colorScheme.tableText,
      border: {
        fg: colorScheme.border
      },
      cell: {
        selected: {
          fg: 'black',
          bg: 'light-yellow'
        }
      },
      header: {
        fg: 'red',
        bold: true
      },
    }
  };
}

function createList(
  screen,
  alignment
) {
  return blessed.list({
    parent: screen,
    align: alignment,
    top: 'center',
    left: 'center',
    keys: true,
    padding: 1,
    vi: true,
    border: {
      type: 'line',
      fg: colorScheme.border
    },
    style: {
      selected: {
        fg: 'black',
        bg: 'light-yellow'
      },
      fg: colorScheme.tableText,
    }
  });
}

module.exports.createPostsScreen = async (screen, grid, dataObj, config) => {
  console.log(dataObj.subReddit);
  let subRedditObj = {
    currentSubReddit: dataObj.subReddit,
    currentSortOption: dataObj.sortOption
  };
  return new Promise((resolve) => {
    let postsList = createListTable(screen, 'left', true);
    let postsTable = grid.set(
      0,
      0,
      35,
      36,
      blessed.listtable,
      postsList
    );

    postsTable.setLabel({
      text: `/r/${subRedditObj.currentSubReddit}`.bold.green +
        ` postings (sort:` +
        ` ${subRedditObj.currentSortOption}`.cyan +
        `)`,
      side: 'right'
    });

    postsTable.setData(dataObj.data);

    postsTable.key(['space'], async () => {
      const selectedPostIdx = postsTable.selected - 1;
      const selectedPost = dataObj.posts[selectedPostIdx];
      const selectedPostUrl = dataObj.posts[selectedPostIdx].url;
      const author = dataObj.posts[selectedPostIdx].author.name;
      const score = numeral(dataObj.posts[selectedPostIdx].score)
        .format('0.00a')
        .toString();
      const title = dataObj.posts[selectedPostIdx].title;
      const createdAt = new Date((dataObj.posts[selectedPostIdx].created_utc * 1000));
      let postBody = dataObj.posts[selectedPostIdx].selftext;
      if (postBody.length > 500) {
        postBody = `${postBody.substr(0, 500)}...{yellow-fg}[truncated]{/yellow-fg}`;
      }
      const postPreviewDetails = `{red-fg}{bold}${title}{/bold}{/red-fg}\n` +
        `by {yellow-fg}${author}{/yellow-fg} on ${createdAt.toDateString()}\n` +
        `Score: {blue-fg}${score}{/blue-fg}\n` +
        `URL: {green-fg}${selectedPostUrl}{/green-fg}\n\n` +
        `${postBody}`;
      await this.previewPost(screen, postPreviewDetails, selectedPost);
    });

    postsTable.key(['a'], async () => {
      await this.switchSubReddit(screen, grid, config);
    });

    postsTable.key(['b'], async () => {
      logger.info('Currently as subreddit: ', subRedditObj.currentSubReddit)
      logger.info(subRedditObj.currentSortOption)
      await this.switchSort(screen, grid, config, subRedditObj.currentSubReddit);
    });

    postsTable.key(['escape'], () => resolve(postsTable.destroy()));
    screen.key(['tab'], () => postsTable.focus());
    screen.on('resize', () => {
      postsTable.emit('attach');
    });
    postsTable.focus();
  });
};

module.exports.switchSubReddit = async (screen, grid, config) => {
  let data = await getSubredditList(config);
  data.unshift('r/all');
  return new Promise((resolve) => {
    let subRedditList = createList(screen, 'left', true);

    subRedditList.setLabel({
      text: `Popular Subreddits`.bold.red,
      side: 'left'
    });

    subRedditList.setItems(data);

    subRedditList.key(['backspace'], () => {
      resolve(subRedditList.destroy());
    });

    subRedditList.on('select', async () => {
      const selectedItemIdx = subRedditList.selected;
      const selectedSubReddit = data[selectedItemIdx].replace('r/', '');
      let dataObj = await retrieveData(config, selectedSubReddit);
      await this.createPostsScreen(screen, grid, dataObj, config);
    });

    screen.key(['tab'], () => subRedditList.focus());

    screen.on('resize', () => {
      subRedditList.emit('attach');
    });

    subRedditList.focus();
  });
};

module.exports.switchSort = async (screen, grid, config, currentSubReddit) => {
  const options = [
    'hot',
    'new',
    'controversial',
    'rising',
    'default',
  ];
  return new Promise((resolve) => {
    let sortOptionList = createList(screen, 'left', true);

    sortOptionList.setLabel({
      text: `Sort`.bold.red,
      side: 'left'
    });

    sortOptionList.setItems(options);

    sortOptionList.key(['backspace'], () => {
      resolve(sortOptionList.destroy());
    });

    sortOptionList.on('select', async () => {
      const selectedItemIdx = sortOptionList.selected;
      const selectedSortOption = options[selectedItemIdx];
      let dataObj = await retrieveData(config, currentSubReddit, selectedSortOption);
      await this.createPostsScreen(screen, grid, dataObj, config);
    });

    screen.key(['tab'], () => sortOptionList.focus());

    screen.on('resize', () => {
      sortOptionList.emit('attach');
    });

    sortOptionList.focus();
  });
};

module.exports.previewPost = (screen, previewDetails) => {
  return new Promise((resolve) => {
    let preview = blessed.message({
      parent: screen,
      border: 'line',
      height: 'shrink',
      width: 'half',
      top: 'center',
      left: 'center',
      padding: 1,
      label: ' {blue-fg}Preview{/blue-fg} ',
      tags: true,
      keys: true,
      hidden: true,
      grabKeys: true
    });

    preview.key(['backspace'], () => resolve(preview.destroy()));

    screen.on('resize', () => {
      preview.emit('attach');
    });

    resolve(preview.display(previewDetails, 0));
  });
};
