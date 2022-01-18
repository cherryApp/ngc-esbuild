const fs = require('fs');

const { log, convertMessage } = require('../lib/log');


module.exports = (instance) => {
  return {
    name: "zoneJs",
    setup(build) {
      build.onLoad({ filter: /main\.ts$/ }, async (args) => {
        try {
          if (!instance.lastUpdatedFileList.includes(args.path) && instance.componentBuffer[args.path]) {
            return { contents: instance.componentBuffer[args.path], loader: 'ts' };
          }

          const source = await fs.promises.readFile(args.path, 'utf8');
          const contents = `import 'zone.js';\n${source}`;
          instance.componentBuffer[args.path] = contents;
          return { contents, loader: 'ts' };
        } catch (e) {
          return { errors: [NgEsbuild.convertMessage(e)] }
        }
      });

      // Include test.ts for testing.
      build.onLoad({ filter: /\.spec\.ts$/ }, async (args) => {
        try {
          const source = await fs.promises.readFile(args.path, 'utf8');
          const contents = `
          import 'zone.js';
          import 'zone.js/testing';
          import { getTestBed } from '@angular/core/testing';
          import {
            BrowserDynamicTestingModule,
            platformBrowserDynamicTesting
          } from '@angular/platform-browser-dynamic/testing';
          
          getTestBed().initTestEnvironment(
            BrowserDynamicTestingModule,
            platformBrowserDynamicTesting(),
          );
          \n${source}`;
          instance.componentBuffer[args.path] = contents;
          return { contents, loader: 'ts' };
        } catch (e) {
          return { errors: [NgEsbuild.convertMessage(e)] }
        }
      });
    },
  }
};
