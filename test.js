#!/usr/bin/env node

const NgEsbuild = require('./bin/run-esbuild');

if (require.main === module) {
  console.log('OUT')
  new NgEsbuild();
}

module.exports = NgEsbuild;
