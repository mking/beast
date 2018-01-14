import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/takeScreenshot.js',
  output: [{ file: 'dist/takeScreenshot.js', format: 'cjs' }],
  plugins: [
    resolve(),
    babel({
      babelrc: false,
      presets: [
        [
          'env',
          {
            modules: false,
            targets: {
              node: '6.10'
            }
          }
        ]
      ]
    })
  ],
  external: ['fs', 'child_process', 'net', 'http', 'path', 'aws-sdk']
};
