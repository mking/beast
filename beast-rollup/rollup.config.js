import builtinModules from 'builtin-modules';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/takeScreenshot.js',
  output: [{ file: 'dist/takeScreenshot.js', format: 'cjs' }],
  plugins: [
    json(),
    resolve({
      preferBuiltins: true
    }),
    commonjs()
  ],
  external: [...builtinModules, 'aws-sdk']
};
