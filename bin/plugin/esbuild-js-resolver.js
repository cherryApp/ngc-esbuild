const fs = require('fs');
const path = require('path');

const { log, convertMessage } = require('../lib/log');

const jsResolver = (instance) => {
  return {
    name: 'angularVendorJSResolver',
    async setup(build) {
      build.onEnd(async () => {
        if (!instance.dryRun) {
          return;
        }

        let cache = '';

        const options = await instance.getAngularOptions();
        const works = [];
        options.scripts.forEach((item = '') => {
          const itemPath = item.includes('/')
            ? path.join(instance.workDir, item)
            : path.join(instance.workDir, 'src', item);
          works.push(fs.promises.readFile(itemPath, 'utf8'));
        });

        await Promise.all(works).then( files => {
          cache = files.join(`\n\n`);
          return true;
        });

        const jsOutputPath = path.join(options.outputPath, `vendor.js`);
        await instance.store.fileWriter(jsOutputPath, cache, 'utf8');
      });
    }
  }
};

module.exports = jsResolver;
