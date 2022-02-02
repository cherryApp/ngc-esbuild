#!/usr/bin/env node

const NgEsbuild = require('./run-esbuild');
const OptionParser = require('./lib/options-parser');

// Called from cmd.
if (require.main === module) {
  const parsedOptions = OptionParser.parseArgs();
  new NgEsbuild(parsedOptions, 'cmd');
} else {
    // Called from a file.
    module.exports = NgEsbuild;
}
