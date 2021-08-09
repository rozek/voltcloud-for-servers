// see https://github.com/rozek/build-configuration-study

import commonjs   from '@rollup/plugin-commonjs'
import resolve    from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser'

export default {
  input: './src/voltcloud-for-servers.ts',
  output: [
    {
/*
      file:     './dist/voltcloud-for-servers.js',
      format:    'umd', // builds for both Node.js and Browser
      name:      'VoltCloud', // required for UMD modules
      noConflict:true,
      sourcemap: true,
      exports:   'auto',
      plugins:   [terser({ format:{ comments:false, safari10:true } })],
    },{
*/
      file:     './dist/voltcloud-for-servers.esm.js',
      format:   'esm',
      sourcemap:true
    }
  ],
  plugins: [
    resolve(), commonjs(), typescript()
  ],
};