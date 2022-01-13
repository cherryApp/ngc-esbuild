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

        let cache = `const __esbuild_require__ = (url) => {
          return import(url);
        }`;

        const project = Object.entries(instance.angularSettings.projects)[0][1];
        const baseStylePaths = project.architect.build.options.scripts;
        baseStylePaths.forEach((item = '') => {
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
