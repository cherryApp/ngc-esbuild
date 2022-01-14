/**
 * Goal: works correctly with loadChildren().
 */
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const chokidar = require('chokidar');
const { build } = require('esbuild');
const sass = require('sass');

const minimalLiveServer = require('./lib/minimal-server');
const { log, convertMessage } = require('./lib/log');
const FileStore = require('./lib/file-store');
const esBuilder = require('./lib/builder');

const zoneJsPlugin = require('./plugin/esbuild-plugin-zonejs');
const indexFileProcessor = require('./plugin/esbuild-index-file-processor');
const angularComponentDecoratorPlugin = require('./plugin/esbuild-component-decorator');
const assetsResolver = require('./plugin/esbuild-assets-resolver');
const settingsResolver = require('./plugin/esbuild-settings-resolver');
const cssResolver = require('./plugin/esbuild-css-resolver');
const jsResolver = require('./plugin/esbuild-js-resolver');


module.exports = class NgEsbuild {
  constructor() {

    this.inMemory = false;

    this.timeStamp = new Date().getTime();

    this.dryRun = true;

    this.cssCache = '';

    this.sass = require('sass');

    this.angularSettings = {};

    this.outPath = 'dist/esbuild';

    this.workDir = process.cwd();

    this.outDir = path.join(this.workDir, this.outPath);

    this.store = new FileStore(this.inMemory, this.outPath);
    this.inMemoryStore = this.store.inMemoryStore;

    this.componentBuffer = {};

    this.times = [new Date().getTime(), new Date().getTime()];

    this.liveServerIsRunning = false;
    this.buildInProgress = false;
    this.minimalServer = null;
    this.lastUpdatedFileList = [];

    this.buildTimeout = 0;

    this.initWatcher();

    this.lazyModules = [];
  }

  initWatcher() {
    if (!this.inMemory && !fs.existsSync(this.outDir)) {
      fs.mkdirSync(this.outDir, { recursive: true });
    }

    const watcher = chokidar.watch([
      'src/**/*.(css|scss|less|sass|js|ts|tsx|html)',
      'angular.json'
    ], {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });
    watcher
      .on('add', filePath => this.startBuild(filePath))
      .on('change', filePath => this.startBuild(filePath))
      .on('unlink', filePath => this.startBuild());
  }

  /**
   * Wrapper method to use esbuild.
   */
  builder() {
    this.buildInProgress = true;
    esBuilder({
      entryPoints: ['src/main.ts'],
      bundle: true,
      // outfile: path.join(this.outDir, 'main.js'),

      outdir: this.outDir,
      splitting: true,
      format: 'esm',
      minify: false,
      sourcemap: false,

      write: !this.inMemory,
      treeShaking: true,
      loader: {
        '.html': 'text',
        '.css': 'text',
      },
      plugins: [
        settingsResolver(this),
        indexFileProcessor(this),
        zoneJsPlugin(this),
        angularComponentDecoratorPlugin(this),
        cssResolver(this),
        jsResolver(this),
        assetsResolver(this),
      ],
      preserveSymlinks: true,
    }).then(result => {
      if (result.outputFiles) {
        result.outputFiles.forEach(file => {
          const key = path.join(this.outDir, path.basename(file.path));
          this.store.pushToInMemoryStore(key, file.text);
        });
      }

      if (!this.liveServerIsRunning) {
        this.minimalServer = minimalLiveServer(
          `${this.outPath}/`,
          this.inMemory ? this.inMemoryStore : null
        );
        this.liveServerIsRunning = true;
      }
      this.buildInProgress = false;
      this.minimalServer.broadcast('location:refresh');
      this.lastUpdatedFileList = [];
      this.cssCache = '';
      this.dryRun = false;

      this.times[1] = new Date().getTime();
      log(`EsBuild complete in ${this.times[1] - this.times[0]}ms`);
    });
  }


  startBuild(filePath = '') {
    if (filePath) {
      this.lastUpdatedFileList.push(
        path.join(process.cwd(), filePath)
      );
    }

    if (!this.lastUpdatedFileList.find(f => /.*angular\.json$/.test(f))) {
      this.dryRun = true;
    }

    // Refresh everything.
    this.dryRun = true;

    clearTimeout(this.buildTimeout);

    if (this.buildInProgress) {
      return;
    }

    this.buildTimeout = setTimeout(() => {
      clearTimeout(this.buildTimeout);
      this.times[0] = new Date().getTime();
      this.builder();
    }, 500);
  }

  /**
   * Process .scss and .css files.
   * @param {String} scssPath path of the scss file
   */
  async scssProcessor(scssPath) {
    const workDir = path.dirname(scssPath);

    return (
      /\.css$/.test(scssPath)
      ? fs.promises.readFile(scssPath, 'utf8')
      : sass.compileAsync(scssPath, { includePaths: [workDir] })
    ).then( async result => {
      const css = result.css ? result.css.toString() : result;
      const content = await this.urlUnpacker(workDir, css);
      this.cssCache += this.cssCache += `\n\n${content}`;
      return true;
    });
  }

  async urlReplacer(content = '') {
    await this.urlUnpacker();
    // .+(\/.+)$
    return content.replace(
      /url.+\/([^ '"\)]+)['"\) ]*/gm,
      `url('$1')`
    );
  }

  async urlUnpacker(workDir = '', content = '', ) {
    if (!/url\(['"]?([^\)'"\?]*)[\"\?\)]?/gm.test(content)) {
      return content;
    }

    const matches = content.matchAll(/url\(['"]?([^\)'"\?]*)[\"\?\)]?/gm);
    for (let match of matches) {
      if (!/data\:/.test(match[0])) {
        try {
          const sourcePath = path.join(workDir, match[1]);
          const fileName = path.basename(sourcePath);
          const targetPath = path.join(this.outDir, fileName);
          this.store.fileCopier(
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

  /**
   * Read .css content and add it to the cache.
   * @param {String} cssPath path of the .css file
   */
  async cssProcessor(cssPath) {
    const result = await fs.promises.readFile(cssPath, 'utf8');
    this.cssCache += `\n\n${result}`;
  }

};
