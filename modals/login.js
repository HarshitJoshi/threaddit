'use strict';

const blessed = require('neo-blessed');
const colorScheme = require('../helpers/constants');

const spacing = {
  height: 3,
  width: 36,
  left: 4,
  right: 5,
  top: 1,
  password: 8,
  username: 4
};

const loginStrings = {
  username: ' {bold}{blue-fg}Username{/bold}{/blue-fg} ',
  password: ' {bold}{blue-fg}Password{/bold}{/blue-fg} ',
  label: ' Threaddit Login ',
  hint: ' Press tab to start entry. '
};

let enteredCreds = { username: '', password: '' };

function createPromptBox(form, key, censor = false) {
  return blessed.textbox({
    parent: form,
    label: loginStrings[key],
    tags: true,
    keys: true,
    censor,
    inputOnFocus: true,
    left: spacing.left,
    top: spacing[key],
    border: { type: 'line' },
    width: spacing.width,
    height: spacing.height,
    style: {
      focus: { border: { fg: colorScheme.textFieldBorderFocused } },
      border: { fg: colorScheme.textFieldBorderUnfocused }
    }
  });
}

function nonEmptyLoginCreds() {
  for (let key in enteredCreds) {
    if (enteredCreds.hasOwnProperty(key)) {
      if (!enteredCreds[key]) {
        return false;
      }
    }
  }
  return true;
}

module.exports.createLoginScreen = (screen) => {
  return new Promise((resolve) => {
    let loginForm = blessed.form({
      parent: screen,
      keys: true,
      type: 'overlay',
      top: 'center',
      left: 'center',
      width: 45,
      height: 20,
      bg: colorScheme.background,
      color: 'white'
    });

    let label = blessed.box({
      parent: loginForm,
      top: 1,
      left: 'center',
      width: 16,
      height: 1,
      content: loginStrings.label,
      style: { bg: colorScheme.background, fg: 'white', bold: true },
      tags: true
    });

    let hint = blessed.box({
      parent: loginForm,
      top: 2,
      left: 'center',
      width: 27,
      height: 1,
      shrink: true,
      content: loginStrings.hint,
      style: { bg: colorScheme.background, fg: 'white' },
      tags: true
    });

    let usernameEntryBox = createPromptBox(loginForm, 'username');
    let passwordEntryBox = createPromptBox(loginForm, 'password', true);

    function destroyModal() {
      passwordEntryBox.destroy();
      usernameEntryBox.destroy();
      loginForm.destroy();
    }

    let login = blessed.button({
      parent: loginForm,
      mouse: true,
      keys: true,
      shrink: true,
      right: spacing.right,
      bottom: 1,
      padding: { left: 4, right: 4, top: 1, bottom: 1 },
      name: 'login',
      content: 'login',
      style: {
        bg: colorScheme.confirmLight,
        fg: 'black',
        focus: { bg: colorScheme.confirmDark, fg: 'black' },
        hover: { bg: colorScheme.confirmDark, fg: 'black' }
      }
    });

    let cancel = blessed.button({
      parent: loginForm,
      mouse: true,
      keys: true,
      shrink: true,
      left: spacing.left,
      bottom: 1,
      padding: { left: 4, right: 4, top: 1, bottom: 1 },
      name: 'cancel',
      content: 'cancel',
      style: {
        bg: colorScheme.cancelLight,
        fg: 'black',
        focus: { bg: colorScheme.cancelDark, fg: 'black' },
        hover: { bg: colorScheme.cancelDark, fg: 'black' }
      }
    });

    screen.on('tab', () => loginForm.focusNext());

    login.on('press', () => {
      enteredCreds = {
        password: passwordEntryBox.getValue(),
        username: usernameEntryBox.getValue()
      };
      if (nonEmptyLoginCreds()) {
        destroyModal();
        resolve(enteredCreds);
      } else {
        passwordEntryBox.setValue('');
        usernameEntryBox.setValue('');
        passwordEntryBox.style.border.fg = 'red';
        usernameEntryBox.style.border.fg = 'red';
      }
    });

    cancel.on('press', () => destroyModal());
    screen.key(['escape'], () => destroyModal());
    loginForm.focus();
    screen.render();
  });
};
