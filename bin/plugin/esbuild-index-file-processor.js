const fs = require('fs');
const path = require('path');

const { log, convertMessage } = require('../lib/log');

let indexFileContent = '';

let elementPostProcessorScript = `
var componentStore = %STORE%;
var ngcEsbuildComponentNames = Object.keys(componentStore || []);
function addNgcEsbuildComponentAttribute(name) {
  if (ngcEsbuildComponentNames.includes(name)) {
    document.querySelectorAll(name).forEach( e => {
      e.setAttribute(componentStore[name], '');
    });
  }
}

ngcEsbuildComponentNames.forEach( name => {
  document.querySelectorAll(name).forEach( e => {
    e.setAttribute(componentStore[name], '');
  });
});

document.createElement = function(create) {
  return function() {
      var ret = create.apply(this, arguments);
      var sto = setTimeout( () => {
        clearTimeout(sto);
        addNgcEsbuildComponentAttribute(ret.tagName.toLowerCase());
      }, 0);
      return ret;
  };
}(document.createElement);
`;

/**
   * Esbuild plugin to process index.html file and place scripts and styles
   * into it.
   * @returns an esbuild plugin to changing the index.html file
   */
const indexFileProcessor = (instance) => {
  return {
    name: 'indexProcessor',
    async setup(build) {
      const options = await instance.getAngularOptions();
      const indexFilePath = options.index || 'src/index.html';

      build.onStart(async () => {
        indexFileContent = await fs.promises.readFile(
          path.join(instance.workDir, indexFilePath),
          'utf8',
        );
      });

      build.onEnd(async () => {
        console.log(instance.componentStore);
        const postProcessor = elementPostProcessorScript.replace(
          /\%STORE\%/,
          JSON.stringify(instance.componentStore)
        );

        indexFileContent = indexFileContent.replace(
          /\<\/body\>/gm,
          `<script data-version="0.2" src="vendor.js"></script>
          <script data-version="0.2" type="module" src="main.js"></script>
          <script>${postProcessor}</script>
          </body>`
        );

        indexFileContent = indexFileContent.replace(
          /\<\/head\>/gm,
          `<link rel="stylesheet" href="main.css">          
        </head>`
        );

        await instance.store.fileWriter(
          path.join(options.outputPath, 'index.html'),
          indexFileContent
        );
      });
    }
  }
};

module.exports = indexFileProcessor;
