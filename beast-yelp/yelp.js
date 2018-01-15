const { PNG } = require('pngjs');
const expect = require('expect');
const fs = require('fs');
const path = require('path');
const pify = require('pify');
const pixelmatch = require('pixelmatch');
const puppeteer = require('puppeteer');

async function readImage(filename) {
  return await new Promise((resolve, reject) => {
    const image = new PNG();
    const stream = fs.createReadStream(filename).pipe(image);
    stream.on('parsed', () => resolve(image));
    stream.on('error', error => reject(error));
  });
}

async function writeImage(filename, image) {
  await new Promise((resolve, reject) => {
    const stream = image.pack().pipe(fs.createWriteStream(filename));
    stream.on('finish', () => resolve());
    stream.on('error', error => reject(error));
  });
}

async function diffScreenshots(filename) {
  const width = 800;
  const height = 600;
  const pathObj = path.parse(filename);
  const oldFilename = path.format({
    name: `${pathObj.name}.old`,
    ext: pathObj.ext
  });
  const diffFilename = path.format({
    name: `${pathObj.name}.diff`,
    ext: pathObj.ext
  });
  const [image, oldImage] = await Promise.all([
    readImage(filename),
    readImage(oldFilename)
  ]);
  const diff = new PNG({ width, height });
  const numDiffPixels = pixelmatch(
    image.data,
    oldImage.data,
    diff.data,
    width,
    height
  );
  await writeImage(diffFilename, diff);
  expect(numDiffPixels).toBeLessThan(0.02 * width * height);
}

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath:
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    const page = await browser.newPage();
    await page.goto('https://www.yelp.com');

    const location = await page.waitFor('#dropperText_Mast');
    await location.type('san');

    const suggestion = await page.waitFor(() => {
      const suggestions = document.querySelectorAll('.suggestion-name');
      return Array.from(suggestions).find(suggestion =>
        /^San Mateo/.test(suggestion.textContent)
      );
    });
    await suggestion.click();

    const find = await page.waitFor('#find_desc');
    await find.type('restaurants');
    await find.press('Enter');
    await page.waitForNavigation();
    await page.screenshot({ path: 'restaurants.png' });
    await diffScreenshots('restaurants.png');

    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
