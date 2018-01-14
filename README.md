- [Lambda node/AMI version](https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html)
- [Puppeteer](https://github.com/GoogleChrome/puppeteer)
- [Puppeteer on lambda](https://github.com/sambaiz/puppeteer-lambda-starter-kit)
- [Chrome builds for lambda](https://github.com/adieuadieu/serverless-chrome/releases)
- [Installing node v6 on the lambda AMI](https://nodejs.org/en/download/package-manager/#enterprise-linux-and-fedora)
- [Determine which chrome version to use with puppeteer](https://github.com/GoogleChrome/puppeteer/issues/1507)
- [Bug specifying chrome channel](https://github.com/adieuadieu/serverless-chrome/issues/100)

```
beast-serverless
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true NPM_CONFIG_SERVERLESS_CHROME_SKIP_DOWNLOAD=true yarn
./node_modules/.bin/serverless package
du -h .serverless/beast.zip
2.6M	.serverless/beast.zip

beast-serverless-webpack
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true NPM_CONFIG_SERVERLESS_CHROME_SKIP_DOWNLOAD=true ./node_modules/.bin/serverless package
without uglify:
$ du -h .serverless/beast.zip 
112K	.serverless/beast.zip
with uglify:
$ du -h .serverless/beast.zip 
 64K	.serverless/beast.zip

webpack-node-externals? Only if we're including node_modules.

which packages are taking up the most space?
ANALYZE_BUNDLE=true ./node_modules/.bin/serverless package

why is this package included?
npm ls --prod

./node_modules/.bin/serverless deploy
./node_modules/.bin/serverless remove
./node_modules/.bin/serverless invoke -f takeScreenshot -l
./node_modules/.bin/serverless package
```
