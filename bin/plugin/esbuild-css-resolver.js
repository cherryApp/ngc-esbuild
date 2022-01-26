const fs = require('fs');
const path = require('path');
const sass = require('sass');
const JestWorker = require('jest-worker').Worker;
const scssWorker = new JestWorker(require.resolve('../lib/scss-worker'));

const { log, convertMessage } = require('../lib/log');

const globalCSSCache = [];

const cssResolver = (instance) => {
  return {
    name: 'angularCSSProcessor',
    async setup(build) {
      const options = await instance.getAngularOptions();

      build.onResolve({ filter: /(\.scss|\.css)$/ }, args => ({
        path: path.resolve(args.resolveDir, args.path),
        namespace: 'sass'
      }));

      build.onLoad({ filter: /.*/, namespace: 'sass' }, async args => {
        // scssProcessor(instance, args.path);
        const css = await scssWorker.scssProcessor(JSON.stringify({
          scssPath: args.path, 
          projectDir: instance.workDir, 
          outDir: path.join(instance.workDir, options.outputPath)
        }));
        console.log('CSS: ', css);
        globalCSSCache.push(css);
        return { contents: '', loader: 'text' };
      });

      build.onEnd(async () => {
        if (!instance.lastUpdatedFileList.find(f => /src(\\|\/).*(\.css|\.scss|\.less|\.sass)$/.test(f)) && !instance.dryRun) {
          return;
        }

        let cache = '';

        const works = [];
        (options.styles || []).forEach((item = '') => {
          const itemPath = item.includes('/')
            ? path.join(instance.workDir, item)
            : path.join(instance.workDir, 'src', item);
          works.push(scssWorker.scssProcessor(JSON.stringify({
            scssPath: itemPath, 
            projectDir: instance.workDir, 
            outDir: path.join(instance.workDir, options.outputPath)
          })));
        });

        const results = await Promise.all(works);
        const cssOutputPath = path.join(options.outputPath, `main.css`);
        await instance.store.fileWriter(
          cssOutputPath, 
          [...globalCSSCache, ...results].join('')
        );
        await scssWorker.end();
      });
    }
  }
};

module.exports = cssResolver;






