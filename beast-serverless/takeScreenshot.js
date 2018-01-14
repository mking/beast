const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');

exports.default = function(event, context, callback) {
  fetch('http://127.0.0.1:9222/json/version')
    .then(response => response.json())
    .then(json => json.webSocketDebuggerUrl)
    .then(webSocketDebuggerUrl => puppeteer.connect({ webSocketDebuggerUrl }))
    .then(browser => {
      return browser.newPage().then(page => {
        return page
          .goto('https://www.google.com')
          .then(() => page.waitFor('input[name="q"]'))
          .then(query => {
            return query.type('test').then(() => query.press('Enter'));
          })
          .then(() => page.waitForNavigation())
          .then(() => page.screenshot())
          .then(buffer => {
            const s3 = new AWS.S3();
            return s3
              .putObject({
                Bucket: 'beast-lambda',
                Key: 'screenshot.png',
                Body: buffer,
                ACL: 'public-read'
              })
              .promise();
          });
      });
    })
    .then(() => callback());
};
