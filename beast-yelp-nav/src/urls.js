const url = require('url');

const HOST = 'www.yelp.com';
exports.HOST = HOST;

const LOCATION = 'San Mateo, CA';
exports.LOCATION = LOCATION;

function getCategoryLinkURL({ id }) {
  return url.format({
    protocol: 'https',
    host: HOST,
    pathname: 'search',
    query: {
      cflt: id,
      find_loc: LOCATION
    }
  });
}
exports.getCategoryLinkURL = getCategoryLinkURL;
