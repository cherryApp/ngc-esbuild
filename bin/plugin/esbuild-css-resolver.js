const fs = require('fs');
const path = require('path');
const sass = require('sass');
const JestWorker = require('jest-worker').Worker;
const scssWorker = new JestWorker(require.resolve('../lib/scss-worker'));

// Public interface of worker for testing purposes.
// const publicWorker = require('../lib/scss-worker');

const scssWorkerList = [];

const externalModuleConfig = { input: '', inject: false, bundleName: '' };
const resolveExternalModule = async (instance, options, item = externalModuleConfig) => {
  const itemPath = !/^\//.test(item.input)
    ? path.join(instance.workDir, item.input)
    : path.join(instance.workDir, 'src', item.input);

  const toCopy = await scssWorker.scssProcessor(JSON.stringify({
    scssPath: itemPath,
    projectDir: instance.workDir,
    outDir: path.join(instance.workDir, options.outputPath)
  }));
  
  const cssOutputPath = path.join(
    options.outputPath, 
    item.bundleName ? `${item.bundleName}.css` : path.basename(item.input) );
  await instance.store.fileWriter(
    cssOutputPath,
    toCopy
  );
};

const cssResolver = (instance) => {
  return {
    name: 'angularCSSProcessor',
    async setup(build) {
      const options = await instance.getAngularOptions();

      (options.styles || []).forEach((item = '') => {
        if (typeof item === 'object' && item.input && item.inject !== true) {
          return resolveExternalModule(instance, options, item);
        }
        const itemPath = !/^\//.test(item.input || item)
          ? path.join(instance.workDir, item.input || item)
          : path.join(instance.workDir, 'src', item.input || item);
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






