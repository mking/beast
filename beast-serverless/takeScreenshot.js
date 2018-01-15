const AWS = require('aws-sdk');
const assign = require('object-assign');
const fetch = require('node-fetch');
const fs = require('fs');
const pify = require('pify');
const launchChrome = require('@serverless-chrome/lambda');
const path = require('path');
const puppeteer = require('puppeteer');
const tar = require('tar');

const CHROME_TMP = '/tmp';
const CHROME_KEY = 'headless-chromium.tar.gz';

function downloadBrowser() {
  if (process.env.IS_LOCAL === 'true') {
    return Promise.resolve();
  }

  console.log('Downloading chrome...');
  const s3 = new AWS.S3();
  return s3
    .getObject({
      Bucket: 'beast-lambda',
      Key: 'headless-chromium.tar.gz'
    })
    .promise()
    .then(data => {
      return pify(fs.writeFile)(path.join(CHROME_TMP, CHROME_KEY), data.Body);
    })
    .then(() => {
      return tar.x({
        file: path.join(CHROME_TMP, 'headless-chromium.tar.gz'),
        cwd: CHROME_TMP
      });
    })
    .then(() => console.log('Downloaded chrome'));
}

function startBrowser() {
  console.log('Starting chrome...');
  return launchChrome(
    assign(
      {},
      process.env.IS_LOCAL === 'true'
        ? {}
        : {
            chromePath: path.join(CHROME_TMP, 'headless-chromium')
          }
    )
  ).then(browser => {
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
        return downloadBrowser()
          .then(() => startBrowser())
          .then(() => connectBrowser());
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
      console.log('Going to the address...');
      return page
        .goto('https://news.ycombinator.com')
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
              ACL: 'public-read',
              ContentType: 'image/png'
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
