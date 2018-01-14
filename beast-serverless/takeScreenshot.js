const AWS = require('aws-sdk');
const decompress = require('decompress');
const fetch = require('node-fetch');
const fs = require('fs');
const pify = require('pify');
const launchChrome = require('@serverless-chrome/lambda');
const path = require('path');
const puppeteer = require('puppeteer');

const s3 = new AWS.S3();

function downloadChrome() {
  return new Promise(resolve => {
    fs.access('/tmp/headless-chromium', error => {
      resolve(error);
    });
  }).then(error => {
    if (error) {
      console.log('Fetching chrome from s3...');
      return s3
        .getObject({
          Bucket: 'beast-lambda',
          Key: 'headless-chromium.tar.gz'
        })
        .promise()
        .then(data => {
          return pify(fs.writeFile)(data.Body);
        })
        .then(() => {
          return decompress('/tmp/headless-chromium.tar.gz', '/tmp');
        });
    }
    return Promise.resolve();
  });
}

function connectBrowser() {
  console.log('Launching chrome...');
  return launchChrome({ chromePath: '/tmp/headless-chromium' })
    .then(() => fetch('http://127.0.0.1:9222/json/version'))
    .then(response => response.json())
    .then(json => json.webSocketDebuggerUrl)
    .then(webSocketDebuggerUrl => puppeteer.connect({ webSocketDebuggerUrl }));
}

function testBrowser(browser) {
  return browser
    .newPage()
    .then(page => {
      console.log('Opening google...');
      return page
        .goto('https://www.google.com')
        .then(() => page.waitFor('input[name="q"]'))
        .then(query => {
          console.log('Typing query...');
          return query.type('test').then(() => query.press('Enter'));
        })
        .then(() => {
          console.log('Waiting for search results...');
          return page.waitForNavigation();
        })
        .then(() => {
          console.log('Taking screenshot...');
          return page.screenshot();
        })
        .then(buffer => {
          return s3
            .putObject({
              Bucket: 'beast-lambda',
              Key: 'screenshot.png',
              Body: buffer,
              ACL: 'public-read'
            })
            .promise();
        });
    })
    .then(() => browser.close());
}

exports.default = function(event, context, callback) {
  console.log('Starting lambda...');
  downloadChrome()
    .then(() => connectBrowser())
    .then(browser => testBrowser(browser))
    .then(() => {
      console.log('Exiting lambda...');
      callback();
    });
};
