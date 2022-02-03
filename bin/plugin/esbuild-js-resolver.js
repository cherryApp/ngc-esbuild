const fs = require('fs');
const path = require('path');

const { log, convertMessage } = require('../lib/log');

let vendorFileCache = '';

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

const externalModuleConfig = { input: '', inject: false, bundleName: '' };
const resolveExternalModule = async (instance, options, item = externalModuleConfig) => {
  const itemPath = !/^\//.test(item.input)
    ? path.join(instance.workDir, item.input)
    : path.join(instance.workDir, 'src', item.input);

  const toCopy = await fs.promises.readFile(itemPath, 'utf8');
  
  const jsOutputPath = path.join(
    options.outputPath, 
    item.bundleName ? `${item.bundleName}.js` : path.basename(item.input) );
  await instance.store.fileWriter(
    jsOutputPath,
    toCopy
  );
};

const jsResolver = (instance) => {
  return {
    name: 'angularVendorJSResolver',
    async setup(build) {
      const options = await instance.getAngularOptions();
      
      build.onStart(async () => {
        if (!instance.dryRun) {
          return;
        }      

        const works = [];
        (options.scripts || []).forEach((item = '') => {
          if (typeof item === 'object' && item.input && item.inject !== true) {
            return resolveExternalModule(instance, options, item);
          }

          const itemPath = !/^\//.test(item.input || item)
            ? path.join(instance.workDir, item.input || item)
            : path.join(instance.workDir, 'src', item.input || item);
          
          works.push(fs.promises.readFile(itemPath, 'utf8'));
        });

        await Promise.all(works).then( files => {
          vendorFileCache = files.join(`\n\n`);
          return true;
        });
      });
      
      build.onEnd(async () => {
        const postProcessor = elementPostProcessorScript.replace(
          /\%STORE\%/,
          JSON.stringify(instance.componentStore)
        );

        vendorFileCache += `;\n\n${postProcessor}`;

        const jsOutputPath = path.join(options.outputPath, `vendor.js`);
        await instance.store.fileWriter(jsOutputPath, vendorFileCache, 'utf8');
      });
    }
  }
};

module.exports = jsResolver;
