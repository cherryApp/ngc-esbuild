const fs = require('fs');
const path = require('path');
const sass = require('sass');

const { log, convertMessage } = require('../lib/log');

const importUrlResolvers = (instance) => {
  return [{
    findFileUrl(url) {
      if (/\./.test(url)) return null;
      return new URL(path.join(
        instance.workDir,
        'node_modules',
        url.replace(/^\~/, ''),
      ).replace(/^[^\:]*\:/, 'file:'));
    }
  }];
};

const urlUnpacker = (instance, workDir = '', content = '',) => {
  if (!/url\(['"]?([^\)'"\?]*)[\"\?\)]?/gm.test(content)) {
    return content;
  }

  const matches = content.matchAll(/url\(['"]?([^\)'"\?]*)[\"\?\)]?/gm);
  for (let match of matches) {
    if (!/data\:/.test(match[0]) && !/^(?!\.)\/assets/.test(match[1])) {
      try {
        const sourcePath = path.join(workDir, match[1]);
        const fileName = path.basename(sourcePath);
        const targetPath = path.join(instance.outDir, fileName);
        instance.store.fileCopier(
          sourcePath,
          targetPath,
        );
        content = content.replace(match[1], fileName);
      } catch (e) {
        console.error('ERROR: ', e);
      }
    }
  }

  return content;
}

const cssResolver = (instance) => {
  return {
    name: 'angularCSSProcessor',
    async setup(build) {

      const scssProcessor = (scssPath) => {
        const workDir = path.dirname(scssPath);

        return (
          /\.css$/.test(scssPath)
            ? fs.promises.readFile(scssPath, 'utf8')
            : sass.compileAsync(scssPath, {
              includePaths: [
                path.resolve(instance.workDir, 'node_modules')
              ],
              importers: importUrlResolvers(instance),
            })
        ).then(async result => {
          const css = typeof result.css !== 'undefined'
            ? result.css.toString()
            : result;
          const content = urlUnpacker(instance, workDir, css);
          instance.cssCache += !content ? '' : `\n\n${content}`;
          return true;
        })
      };

      build.onResolve({ filter: /(\.scss|\.css)$/ }, args => ({
        path: path.resolve(args.resolveDir, args.path),
        namespace: 'sass'
      }));
      build.onLoad({ filter: /.*/, namespace: 'sass' }, async args => {
        return scssProcessor(args.path).then( () => ({contents: '', loader: 'text'}) );
      });

      build.onEnd(async () => {
        if (!instance.lastUpdatedFileList.find(f => /src(\\|\/).*(\.css|\.scss|\.less|\.sass)$/.test(f)) && !instance.dryRun) {
          return;
        }

        let cache = '';

        const options = await instance.getAngularOptions();

        const works = [];
        (options.styles || []).forEach((item = '') => {
          const itemPath = item.includes('/')
            ? path.join(instance.workDir, item)
            : path.join(instance.workDir, 'src', item);
          works.push(scssProcessor(itemPath));
        });

        await Promise.all(works);
        const cssOutputPath = path.join(options.outputPath, `main.css`);
        await instance.store.fileWriter(cssOutputPath, instance.cssCache, 'utf8');
      });
    }
  }
};

module.exports = cssResolver;






