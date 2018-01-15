const { getCategoryLinkURL } = require('./urls');

module.exports = async function testCategory({ page, id }) {
  await page.goto(getCategoryLinkURL({ id }));
  await page.waitFor('.regular-search-result');
};
