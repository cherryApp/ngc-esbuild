const path = require('path');

const assetsResolver = (instance) => {
  return {
    name: 'angularAssetsResolver',
    async setup(build) {
      if (!instance.lastUpdatedFileList.find(f => /src\\assets|src\/assets/.test(f)) && !instance.dryRun) {
        return;
      }

      const options = await instance.getAngularOptions();

      instance.store.copyFromList(
        options.assets.map( asset => path.join(instance.workDir, asset) ),
        path.join(options.outputPath, 'assets'),
      );



      // await instance.store.copyDir(
      //   path.join(instance.workDir, 'src/assets'),
      //   path.join(instance.outDir, 'assets'),
      // );
      // await instance.store.fileCopier(
      //   path.join(instance.workDir, 'src/favicon.ico'),
      //   path.join(instance.outDir, 'favicon.ico'),
      // );
    }
  }
};

module.exports = assetsResolver;
