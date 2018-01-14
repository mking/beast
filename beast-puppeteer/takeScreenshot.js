const path = require('path');
const puppeteer = require('puppeteer');

puppeteer
  .launch({ executablePath: path.resolve(__dirname, 'headless-chromium') })
  .then(browser => {
    return browser.newPage().then(page => {
      return page
        .goto('https://www.google.com')
        .then(() => {
          return page.screenshot({ path: 'google.png' });
        })
        .then(() => {
          return browser.close();
        });
    });
  })
  .catch(error => {
    console.error(error);
  });
