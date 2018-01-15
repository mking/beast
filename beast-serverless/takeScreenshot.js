const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const fs = require('fs');
const pify = require('pify');
const launchChrome = require('@serverless-chrome/lambda');
const path = require('path');
const puppeteer = require('puppeteer');
const tar = require('tar');

function downloadChrome() {
  console.log('Downloading chrome...');
  const s3 = new AWS.S3();
  return s3
    .getObject({
      Bucket: 'beast-lambda',
      Key: 'headless-chromium.tar.gz'
    })
    .promise()
    .then(data => {
      return pify(fs.writeFile)('/tmp/headless-chromium.tar.gz', data.Body);
    })
    .then(() => {
      return tar.x({ file: '/tmp/headless-chromium.tar.gz', cwd: '/tmp' });
    })
    .then(() => {
      console.log('Downloaded chrome');
      console.log('Starting chrome...');
      return launchChrome({ chromePath: '/tmp/headless-chromium' });
    })
    .then(browser => {
      console.log('Started chrome');
      return browser;
    });
}

function connectBrowser() {
  return fetch('http://127.0.0.1:9222/json/version')
    .then(response => response.json())
    .then(json => {
      return puppeteer.connect({
        browserWSEndpoint: json.webSocketDebuggerUrl
      });
    });
}

function connectBrowserWithFallback() {
  console.log('Trying to connect to chrome...');
  return connectBrowser()
    .catch(error => {
      if (error.code === 'ECONNREFUSED') {
        return downloadChrome().then(() => connectBrowser());
      }
      throw error;
    })
    .then(browser => {
      console.log('Connected to chrome');
      return browser;
    });
}

function testBrowser(browser) {
  return browser
    .newPage()
    .then(page => {
      console.log('Going to google...');
      return page
        .goto('https://www.google.com')
        .then(() => page.waitFor('input[name="q"]'))
        .then(query => {
          console.log('Entering search query...');
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
    })
    .then(() => browser.close());
}

exports.handler = function(event, context, callback) {
  console.log('Starting lambda...');
  connectBrowserWithFallback()
    .then(browser => testBrowser(browser))
    .then(() => {
      console.log('Finished lambda');
      callback();
    })
    .catch(error => console.error(error));
};
