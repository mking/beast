- [Lambda node/AMI version](https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html)
- [Puppeteer](https://github.com/GoogleChrome/puppeteer)
- [Puppeteer on lambda](https://github.com/sambaiz/puppeteer-lambda-starter-kit)
- [Chrome builds for lambda](https://github.com/adieuadieu/serverless-chrome/releases)
- [Installing node v6 on the lambda AMI](https://nodejs.org/en/download/package-manager/#enterprise-linux-and-fedora)
- [Determine which chrome version to use with puppeteer](https://github.com/GoogleChrome/puppeteer/issues/1507)
- [Bug specifying chrome channel](https://github.com/adieuadieu/serverless-chrome/issues/100)

```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true NPM_CONFIG_SERVERLESS_CHROME_SKIP_DOWNLOAD=true yarn

./node_modules/.bin/serverless deploy
./node_modules/.bin/serverless remove
./node_modules/.bin/serverless invoke -f hello -l
./node_modules/.bin/serverless package
```
