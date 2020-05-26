import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        name: 'trackedx',
        file: pkg.browser,
        format: 'umd'
      },
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: [
      resolve({
        extensions: ['.js', '.ts'],
      }),
      babel({
        babelHelpers: 'bundled',
        extensions: ['.js', '.ts'],
      }),
    ]
  },
];
