const fs = require('fs');
const path = require('path');

const { log, convertMessage } = require('../lib/log');
const publicWorker = require('../lib/scss-worker');

const componentBuffer = {
  num: 1,
};

/**
   * Check the file is an scss file.
   * @param {String} cssPath path of a file
   * @returns true when the file extension is scss, otherwise false
   */
const isScss = (cssPath) => {
  return /\.scss$/.test(cssPath);
};

/**
   *
   * @param {RegExp} regex regular expression for read a value from a string
   * @param {String} str base string
   * @returns a string value by the regex.
   */
const getValueByPattern = (regex = new RegExp(''), str = '') => {
  let m;
  let results = [];

  let array1 = null;

  while ((array1 = regex.exec(str)) !== null) {
    results.push(array1[1]);
  }

  return results.pop();
};

const injectStyle = async (options, instance, args, contents = '') => {
  const styleUrls = getValueByPattern(
    /^ *styleUrls *\: *\[['"]([^'"\]]*)/gm,
    contents
  );

  let fileContent = '';
  if (styleUrls) {
    fileContent = await publicWorker.scssProcessor(JSON.stringify({
      scssPath: path.join(
        path.dirname(args.path),
        styleUrls,
      ),
      projectDir: instance.workDir,
      outDir: path.join(instance.workDir, options.outputPath),
    }));
  }

  return contents.replace(
    /^ *styleUrls *\: *\[['"]([^'"\]]*)['"]\]\,*/gm,
    `    styles: [\`${fileContent}\`],`
  );
};

/**
* Place @Inject statements
* @param {String} contents content of the target .ts file
* @returns the new conent that changed
*/
const addInjects = (contents) => {

  if (/constructor *\(([^\)]*)/gm.test(contents)) {
    let requireInjectImport = false;
    const matches = contents.matchAll(/constructor *\(([^\)]*)/gm);
    for (let match of matches) {
      if (match[1] && /\:/gm.test(match[1])) {
        requireInjectImport = true;
        let flat = match[1].replace(/[\n\r]/gm, '');
        const flatArray = flat.split(',').map(inject => {
          const parts = inject.split(':');
          return parts.length === 2 && !/\@Inject/.test(inject)
            ? `@Inject(${parts[1]}) ${inject}`
            : inject;
        });

        contents = contents.replace(
          /constructor *\([^\)]*\)/gm,
          `constructor(${flatArray.join(',')})`
        );
      }
    }

    if (requireInjectImport && !/Inject[ ,\}\n\r].*'@angular\/core.*\;/.test(contents)) {
      contents = `import { Inject } from '@angular/core';\n\r${contents}`;
    }

  }

  return contents;
}

/**
 * Esbuild plugin to changing special angular components.
 * @returns an esbuild plugin object
   */
const angularComponentDecoratorPlugin = (instance) => {
  return {
    name: 'angularComponentProcessor',
    async setup(build) {
      const options = await instance.getAngularOptions();

      build.onLoad({ filter: /src.*\.(component|pipe|service|directive|guard|module)\.ts$/ }, async (args) => {
        // Check the cache.
        const instanceName = path.basename(args.path).replace(/\.[a-zA-Z]*$/, '');
        if (!instance.lastUpdatedFileList.find( n => n.includes(instanceName) ) && instance.componentBuffer[args.path]) {
          return { contents: instance.componentBuffer[args.path], loader: 'ts' };
        }

        // Load the file from the file system
        let source = await fs.promises.readFile(args.path, 'utf8');

        // Changes.
        try {

          let contents = source;
          let componentName = '';
          let componentID = '';

          // Import compiler.
          if (/module\.ts$/.test(args.path)) {
            contents = `import '@angular/compiler';\n${contents}`;
          }

          if (/^ *templateUrl *\: *['"]*([^'"]*)/gm.test(contents)) {
            const templateUrl =
              getValueByPattern(/^ *templateUrl *\: *['"]*([^'"]*)/gm, source);
            contents = `import templateSource from '${templateUrl}';
              ${contents}`
              .replace(
                /^ *templateUrl *\: *['"]*([^'"]*)['"]/gm,
                `template: templateSource || ''`
              );
          }

          if (/^ *styleUrls *\: *\[['"]([^'"\]]*)/gm.test(contents)) {
            contents = await injectStyle(options, instance, args, contents);
          }

          contents = addInjects(contents);

          instance.componentBuffer[args.path] = contents;

          return { contents, loader: 'ts' };
        } catch (e) {
          return { errors: [convertMessage(e)] }
        }
      });
    },
  }
};

module.exports = angularComponentDecoratorPlugin;
