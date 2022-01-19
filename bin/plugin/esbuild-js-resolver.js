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

        const options = await instance.getBuilderOptions();
        options.scripts.forEach((item = '') => {
          const itemPath = item.includes('/')
            ? path.join(instance.workDir, item)
            : path.join(instance.workDir, 'src', item);
          const content = fs.readFileSync(itemPath, 'utf8');
          cache += `\n\n${content}`;
        });

        const jsOutputPath = path.join(instance.outDir, `vendor.js`);
        await instance.store.fileWriter(jsOutputPath, cache, 'utf8');
      });
    }
  }
};

module.exports = jsResolver;
