const fs = require('fs');
const path = require('path');
const sass = require('sass');

const cache = Object.create(null);
let scssCache = '';

const copyFile = (source, target) => {
    return new Promise((resolve, reject) => {
        var rd = fs.createReadStream(source);
        rd.on("error", function (err) {
            resolve(err);
        });
        var wr = fs.createWriteStream(target);
        wr.on("error", function (err) {
            resolve(err);
        });
        wr.on("close", function (ex) {
            resolve();
        });
        rd.pipe(wr);
    });
};

const importUrlResolvers = (workDir) => {
    return [{
        findFileUrl(url) {
            if (/\./.test(url)) return null;
            return new URL(path.join(
                workDir,
                'node_modules',
                url.replace(/^\~/, ''),
            ).replace(/^[^\:]*\:/, 'file:'));
        }
    }];
};

const urlUnpacker = (outDir = '', workDir = '', content = '',) => {
    if (!/url\(['"]?([^\)'"\?]*)[\"\?\)]?/gm.test(content)) {
        return content;
    }

    const matches = content.matchAll(/url\(['"]?([^\)'"\?]*)[\"\?\)]?/gm);
    const works = [];
    for (let match of matches) {
        if (!/data\:/.test(match[0]) && !/^(?!\.)\/assets/.test(match[1])) {
            try {
                const sourcePath = path.join(workDir, match[1]);
                const fileName = path.basename(sourcePath);
                const targetPath = path.join(outDir, fileName);
                copyFile(
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
};

const scssProcessor = (options = '') => {
    const { scssPath, projectDir, outDir } = JSON.parse(options);
    const workDir = path.dirname(scssPath);

    return (
        /\.css$/.test(scssPath)
            ? fs.promises.readFile(scssPath, 'utf8')
            : sass.compileAsync(scssPath, {
                includePaths: [
                    path.resolve(projectDir, 'node_modules')
                ],
                importers: importUrlResolvers(projectDir),
            })
    ).then( result => {
        const css = typeof result.css !== 'undefined'
            ? result.css.toString()
            : result;
        const content = urlUnpacker(outDir, workDir, css);
        // const content = css;
        return !content ? '' : `\n\n/* file: ${scssPath} */\n${content}`;
    }).catch( err => {
        return `\n\n/* file: ${scssPath} */\n/* ${ JSON.stringify(err) } */`;
    })
};

const getCache = () => {
    return Promise.resolve(scssCache);
};

module.exports = {
    scssProcessor,
    getCache,
};
