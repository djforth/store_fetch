// rollup.config.js
import { terser } from 'rollup-plugin-terser';
import alias from '@rollup/plugin-alias';
import analyse from 'rollup-plugin-analyzer';
// import auto from '@rollup/plugin-auto-install';
import autoExternal from 'rollup-plugin-auto-external';
import babel from 'rollup-plugin-babel';
import banner from 'rollup-plugin-banner';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from 'rollup-plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import strip from '@rollup/plugin-strip';

export default {
  input: 'src/index.js',

  plugins: [
    alias({
      entries: [{ find: 'src', replacement: './src' }],
    }),
    // auto(),

    autoExternal(),
    resolve({
      mainFields: ['module', 'main', 'jsnext:main'],
      browser: true,
      extensions: ['.js'],
    }),
    commonjs({
      namedExports: {
        // left-hand side can be an absolute path, a path
        // relative to the current directory, or the name
        // of a module in node_modules
        '@djforth/utilities': ['checkElements', 'curry'],
        'date-fns/isWithinInterval': 'isWithinInterval',
        'date-fns/subDays': 'subDays',
        'date-fns/subHours': 'subHours',
        'date-fns/subMinutes': 'subMinutes',
        'date-fns/subMonths': 'subMonths',
        'date-fns/subSeconds': 'subSeconds',
        'date-fns/parseJSON': 'parseJSON',
        'date-fns/parseISO': 'parseISO',
        idb: 'idb',
      },
    }),
    babel({
      exclude: 'node_modules/**', // only transpile our source code
      // , externalHelpers: true
      // , plugins: ['external-helpers']
      // , runtimeHelpers: true
    }),
    json(),
    replace({
      exclude: 'node_modules/**',
      ENVIRONMENT: JSON.stringify(process.env.NODE_ENV),
    }),
    strip({
      // defaults to `[ 'console.*', 'assert.*' ]`
      functions: ['console.*', 'assert.*', 'debug', 'alert'],
    }),
    terser(),
    banner('Store Fetch v<%= pkg.version %> by <%= pkg.author %>'),
    analyse(),
  ],
  external: [
    '@djforth/utilities',
    'idb',
    'date-fns/isWithinInterval',
    'date-fns/subDays',
    'date-fns/subHours',
    'date-fns/subMinutes',
    'date-fns/subMonths',
    'date-fns/subSeconds',
    'date-fns/parseJSON',
    'date-fns/parseISO',
  ],

  output: {
    name: 'StoreFetch',
    sourcemap: true,
    file: 'index.js',
    format: 'umd',
    globals: {
      // map 'some-npm-,pack,age' to 'SomeNPMPackage' global variable
      '@djforth/utilities': 'utilities',
      'date-fns/isWithinInterval': 'isWithinInterval',
      'date-fns/subDays': 'subDays',
      'date-fns/subHours': 'subHours',
      'date-fns/subMinutes': 'subMinutes',
      'date-fns/subMonths': 'subMonths',
      'date-fns/subSeconds': 'subSeconds',
      'date-fns/parseJSON': 'parseJSON',
      'date-fns/parseISO': 'parseISO',
      idb: 'idb',
    },
  },
};
