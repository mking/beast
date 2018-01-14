const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');
const slsw = require('serverless-webpack');
const webpack = require('webpack');

module.exports = {
  entry: slsw.lib.entries,
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'takeScreenshot.js'),
          path.resolve(__dirname, 'node_modules/puppeteer')
        ],
        use: [{ loader: 'babel-loader' }]
      }
    ]
  },
  target: 'node',
  externals: ['aws-sdk'],
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new UglifyJsPlugin(),
    new DuplicatePackageCheckerPlugin({ verbose: true }),
    ...(process.env.ANALYZE_BUNDLE === 'true'
      ? [new BundleAnalyzerPlugin()]
      : [])
  ]
};
