const path = require('path');

const { build } = require('esbuild');

/**
   * Wrapper method to use esbuild.
   */
module.exports = (options = {}) => {

  const defaultOptions = {
    entryPoints: ['src/main.ts'],
    bundle: true,
    // outfile: path.join(process.cwd(), 'dist/esbuild/main.js'),
    write: true,
    treeShaking: true,
    loader: {
      '.html': 'text',
      '.css': 'text',
    },
    sourcemap: true,
    minify: true,
    plugins: [],
  };

  return build(({...defaultOptions, ...options}));
}
