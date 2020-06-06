'use strict';

const blessed = require('neo-blessed');
const colorScheme = require('../helpers/constants');

module.exports.createNotification = (
  screen,
  displayText,
  showButton = true,
) => {
  return new Promise((resolve) => {
    let notification = null;
    notification = blessed.form({
      parent: screen,
      keys: true,
      type: 'overlay',
      top: 'center',
      left: 'center',
      width: 45,
      height: 8,
      bg: 'white',
    });

    let label = blessed.box({
      parent: notification,
      top: 1,
      left: 'center',
      width: 14,
      height: 1,
      content: displayText.label,
      style: { bg: 'white' },
      tags: true
    });

    let hint = blessed.box({
      parent: notification,
      top: 2,
      left: 'center',
      width: 34,
      height: 3,
      shrink: true,
      content: displayText.hint,
      style: { bg: 'white' },
      tags: true
    });

    if (showButton) {
      let okayButton = blessed.button({
        parent: notification,
        mouse: true,
        keys: true,
        shrink: true,
        right: 5,
        bottom: 1,
        padding: { left: 4, right: 4, top: 1, bottom: 1 },
        name: 'okay',
        content: 'okay',
        style: {
          bg: colorScheme.confirmLight,
          fg: 'black',
          focus: { bg: colorScheme.confirmDark, fg: 'black' },
          hover: { bg: colorScheme.confirmDark, fg: 'black' }
        }
      });

      okayButton.on('press', () => resolve(notification.destroy()));
      screen.key(['escape'], (ch, key) => resolve(notification.destroy()));
      okayButton.focus();
    }

    notification.focus();
    screen.render();
  });
};
