const AWS = require('aws-sdk');
const assign = require('object-assign');
const fetch = require('node-fetch');
const fs = require('fs');
const pify = require('pify');
const launchChrome = require('@serverless-chrome/lambda');
const path = require('path');
const puppeteer = require('puppeteer');
const tar = require('tar');

const TMP = '/tmp';
const CHROME_KEY = 'headless-chromium.tar.gz';
const SCREENSHOT_KEY = 'screenshot.png';

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
      return pify(fs.writeFile)(path.join(TMP, CHROME_KEY), data.Body);
    })
    .then(() => {
      return tar.x({
        file: path.join(TMP, 'headless-chromium.tar.gz'),
        cwd: TMP
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
            chromePath: path.join(TMP, 'headless-chromium')
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
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
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
        .goto('https://s3-us-west-2.amazonaws.com/beast-lambda/index.html')
        .then(() =>
          page.evaluate(() => document.querySelector('h1').textContent)
        )
        .then(text => console.log(text));
      // .then(() => {
      //   console.log('Taking screenshot...');
      //   return page.screenshot({
      //     path: path.join(TMP, SCREENSHOT_KEY)
      //   });
      // })
      // .then(() => {
      //   return pify(fs.readFile)(path.join(TMP, SCREENSHOT_KEY));
      // })
      // .then(data => {
      //   const s3 = new AWS.S3();
      //   return s3
      //     .putObject({
      //       Bucket: 'beast-lambda',
      //       Key: SCREENSHOT_KEY,
      //       Body: data,
      //       ACL: 'public-read',
      //       ContentType: 'image/png'
      //     })
      //     .promise();
      // });
    })
    .then(() => browser.close());
}

exports.handler = function(event, context, callback) {
  fetch('https://s3-us-west-2.amazonaws.com/beast-lambda/index.html')
    .then(response => response.text())
    .then(text => {
      console.log(text);
      callback();
    })
    .catch(error => console.error(error));

  // console.log('Starting lambda...');
  // connectBrowserWithFallback()
  //   .then(browser => testBrowser(browser))
  //   .then(() => {
  //     console.log('Finished lambda');
  //     callback();
  //   })
  // .catch(error => console.error(error));
};
