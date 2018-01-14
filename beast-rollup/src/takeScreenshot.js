import AWS from 'aws-sdk';
import decompress from 'decompress';
import fs from 'fs';
import pify from 'pify';

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

export function handler(event, context, callback) {
  console.log('Starting lambda...');
  downloadChrome().then(() => {
    console.log('Exiting lambda...');
    callback();
  });
}
