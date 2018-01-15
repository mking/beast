const Promise = require('bluebird');
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const testCategory = require('./testCategory');

function generateTests() {
  return [
    'restaurants',
    'nightlife',
    'hvac',
    'contractors',
    'electricians',
    'homecleaning',
    'landscapers',
    'locksmiths',
    'movers',
    'painters',
    'plumbers'
  ].map(id => {
    return async page => {
      await testCategory({ page, id });
    };
  });
}

async function connectBrowser() {
  const response = await fetch('http://127.0.0.1:9222/json/version');
  const json = await response.json();
  const browser = await puppeteer.connect({
    browserWSEndpoint: json.webSocketDebuggerUrl
  });
  await Promise.map(
    generateTests(),
    async test => {
      try {
        const page = await browser.newPage();
        await test(page);
        await page.close();
      } catch (e) {
        console.error(e);
      }
    },
    { concurrency: 5 }
  );
  await browser.disconnect();
}

(async () => {
  try {
    await connectBrowser();
  } catch (e) {
    console.error(e);
  }
})();
