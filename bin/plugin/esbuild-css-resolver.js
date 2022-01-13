const fs = require('fs');
const path = require('path');

const { log, convertMessage } = require('../lib/log');

const cssResolver = (instance) => {
  return {
    name: 'angularCSSProcessor',
    async setup(build) {
      build.onEnd(async () => {
        if (!instance.lastUpdatedFileList.find(f => /src(\\|\/).*(\.css|\.scss|\.less|\.sass)$/.test(f)) && !instance.dryRun) {
          return;
        }

        let cache = '';

        const project = Object.entries(instance.angularSettings.projects)[0][1];
        const baseStylePaths = project.architect.build.options.styles;
        baseStylePaths.forEach((item = '') => {
          const itemPath = item.includes('/')
            ? path.join(instance.workDir, item)
            : path.join(instance.workDir, 'src', item);
          instance.scssProcessor(itemPath);
        });

        const cssOutputPath = path.join(instance.outDir, `main.css`);
        await instance.store.fileWriter(cssOutputPath, instance.cssCache, 'utf8');
      });
    }
  }
};

module.exports = cssResolver;
