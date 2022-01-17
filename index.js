#!/usr/bin/env node

const NgEsbuild = require('./bin/run-esbuild');

if (require.main === module) {
  new NgEsbuild();
}

module.exports = NgEsbuild;
