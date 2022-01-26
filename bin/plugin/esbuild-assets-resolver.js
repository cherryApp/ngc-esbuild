const path = require('path');
const globToRegExp = require('glob-to-regexp');

const assetsResolver = (instance) => {
  return {
    name: 'angularAssetsResolver',
    async setup(build) {
      if (!instance.lastUpdatedFileList.find(f => /src\\assets|src\/assets/.test(f)) && !instance.dryRun) {
        return;
      }

      const options = await instance.getAngularOptions();

      if (Array.isArray(options.assets)) {
        options.assets.forEach(assetOrObject => {
          if (typeof assetOrObject === 'string') {
            instance.store.copyFromList(
              [path.join(instance.workDir, assetOrObject)],
              path.join(instance.workDir, options.outputPath, 'assets'),
            );
          } else if (assetOrObject.input && assetOrObject.output) {
            instance.store.copyFromList(
              [path.join(instance.workDir, assetOrObject.input)],
              path.join(instance.workDir, options.outputPath, assetOrObject.output),
              assetOrObject.glob ? globToRegExp(assetOrObject.glob.replace(/\//g, path.sep)) : /.*/,
            );
          }
        });
      }

    }
  }
};

module.exports = assetsResolver;
