const pify = require('pify');
const prompt = require('prompt');
const puppeteer = require('puppeteer');

async function startBrowser() {
  const browser = await puppeteer.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--remote-debugging-port=9222'],
    headless: false
  });

  prompt.start();
  await pify(prompt.get)(['line']);

  await browser.close();
}

(async () => {
  try {
    await startBrowser();
  } catch (e) {
    console.error(e);
  }
})();
