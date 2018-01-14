import babel from 'rollup-plugin-babel'
import builtins from 'rollup-plugin-node-builtins'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import flow from 'rollup-plugin-flow'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'

export default {
  input: 'lib/miji.js',
  output: [
    {
      file: 'dist/miji.es.js',
      format: 'es'
    },
    {
      file: 'dist/miji.cjs.js',
      format: 'cjs'
    },
    {
      file: 'dist/miji.js',
      format: 'iife',
      name: 'miji'
    }
  ],
  plugins: [builtins(), resolve(), flow(), commonjs(), babel(), uglify({}, minify)],
  external: ['fs'],
  sourceMap: false
}