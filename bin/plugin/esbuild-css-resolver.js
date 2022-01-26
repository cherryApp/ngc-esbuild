const fs = require('fs');
const path = require('path');
const sass = require('sass');
const JestWorker = require('jest-worker').Worker;
const scssWorker = new JestWorker(require.resolve('../lib/scss-worker'));

// Public interface of worker for testing purposes.
// const publicWorker = require('../lib/scss-worker');

const scssWorkerList = [];

const cssResolver = (instance) => {
  return {
    name: 'angularCSSProcessor',
    async setup(build) {
      const options = await instance.getAngularOptions();

      (options.styles || []).forEach((item = '') => {
        const itemPath = item.includes('/')
          ? path.join(instance.workDir, item)
          : path.join(instance.workDir, 'src', item);
        scssWorkerList.push(scssWorker.scssProcessor(JSON.stringify({
          scssPath: itemPath,
          projectDir: instance.workDir,
          outDir: path.join(instance.workDir, options.outputPath)
        })));
      });

      build.onResolve({ filter: /(\.scss|\.css)$/ }, args => ({
        path: path.resolve(args.resolveDir, args.path),
        namespace: 'sass'
      }));

      build.onLoad({ filter: /.*/, namespace: 'sass' }, args => {
        scssWorkerList.push(scssWorker.scssProcessor(JSON.stringify({
          scssPath: args.path,
          projectDir: instance.workDir,
          outDir: path.join(instance.workDir, options.outputPath)
        })));
        return { contents: '', loader: 'text' };
      });

      build.onEnd(async () => {
        const results = await Promise.all(scssWorkerList);
        const cssOutputPath = path.join(options.outputPath, `main.css`);
        await instance.store.fileWriter(
          cssOutputPath,
          results.join('')
        );
        // scssWorker.end();
        scssWorkerList.length = 0;
      });
    }
  }
};

module.exports = cssResolver;






