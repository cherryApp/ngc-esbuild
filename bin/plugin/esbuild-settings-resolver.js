const fs = require('fs');
const path = require('path');

const { log, convertMessage } = require('../lib/log');

const settingsResolver = (instance) => {
  return {
    name: 'angularSettingsResolver',
    async setup(build) {
      if (!instance.dryRun) {
        return;
      }

      instance.angularSettings = JSON.parse(await fs.promises.readFile(
        path.join(instance.workDir, 'angular.json'),
        'utf8',
      ));
    }
  }
};

module.exports = settingsResolver;
