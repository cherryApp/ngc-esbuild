const fs = require('fs');
const path = require('path');
const sass = require('sass');

const { log, convertMessage } = require('../lib/log');

const urlUnpacker = (instance, workDir = '', content = '',) => {
  if (!/url\(['"]?([^\)'"\?]*)[\"\?\)]?/gm.test(content)) {
    return content;
  }

  const matches = content.matchAll(/url\(['"]?([^\)'"\?]*)[\"\?\)]?/gm);
  for (let match of matches) {
    if (!/data\:/.test(match[0])) {
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

      build.onResolve({ filter: /(\.scss|\.css)$/ }, args => ({
        path: path.resolve(args.resolveDir, args.path),
        namespace: 'sass'
      }));
      build.onLoad({ filter: /.*/, namespace: 'sass' }, async args => {
        const workDir = path.dirname(args.path);

        return (
          /\.css$/.test(args.path)
            ? fs.promises.readFile(args.path, 'utf8')
            : sass.compileAsync(args.path, {
              includePaths: [workDir],
              importers: [{
                findFileUrl(url) {
                  if (!url.startsWith('~')) return null;
                  const importPath = path.join(
                    instance.workDir,
                    'node_modules',
                    url.substring(1)
                  ).replace(/^[^\:]*\:/, 'file:');
                  return new URL(importPath);
                }
              }]
            })
        ).then(async result => {
          const css = typeof result.css !== 'undefined'
            ? result.css.toString()
            : result;
          const content = await urlUnpacker(instance, workDir, css);
          instance.cssCache += !content ? '' : `\n\n${content}`;
          return true;
        }).then( () => ({contents: '', loader: 'text'}) );
      });

      build.onEnd(async () => {
        if (!instance.lastUpdatedFileList.find(f => /src(\\|\/).*(\.css|\.scss|\.less|\.sass)$/.test(f)) && !instance.dryRun) {
          return;
        }

        let cache = '';

        const project = Object.entries(instance.angularSettings.projects)[0][1];
        const baseStylePaths = project.architect.build.options.styles;
        const works = [];
        baseStylePaths.forEach((item = '') => {
          const itemPath = item.includes('/')
            ? path.join(instance.workDir, item)
            : path.join(instance.workDir, 'src', item);
          works.push(instance.scssProcessor(itemPath));
        });

        await Promise.all(works);
        const cssOutputPath = path.join(instance.outDir, `main.css`);
        await instance.store.fileWriter(cssOutputPath, instance.cssCache, 'utf8');
      });
    }
  }
};

module.exports = cssResolver;






