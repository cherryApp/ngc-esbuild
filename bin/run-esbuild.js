/**
 * Goal: works correctly with loadChildren().
 */
const path = require('path');
const fs = require('fs');

const chokidar = require('chokidar');
const { build } = require('esbuild');
const sass = require('sass');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv;

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

const esbuildOptions = {
  bundle: true,
  main: 'src/main.ts',
  outpath: 'dist/esbuild',
  minify: false,
  sourcemap: false,
  port: 4200,
  open: false,
  serve: true,
  watch: true,
};

module.exports = class NgEsbuild {
  constructor(options = esbuildOptions) {

    this.options = {...options, ...(argv || {})};
    this.options.open = Boolean(this.options.open);

    this.inMemory = false;

    this.timeStamp = new Date().getTime();

    this.dryRun = true;

    this.cssCache = '';

    this.sass = require('sass');

    this.angularSettings = {};

    this.outPath = this.options.outpath;

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

    this.resolver;
    this.rejector;
    this.resolve = new Promise( (resolve, reject) => {
      this.resolver = resolve;
      this.rejector = reject;
    });

    this.initOutputDirectory();

    if (this.options.watch) {
      this.initWatcher();
    } else {
      this.startBuild();
    }

  }

  initOutputDirectory() {
    if (!this.inMemory && !fs.existsSync(this.outDir)) {
      fs.mkdirSync(this.outDir, { recursive: true });
    }
  }

  initWatcher() {
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
      entryPoints: [this.options.main],
      bundle: this.options.bundle,
      // outfile: path.join(this.outDir, 'main.js'),

      outdir: this.outDir,
      splitting: true,
      format: 'esm',
      minify: this.options.minify !== 'false',
      sourcemap: this.options.sourcemap !== 'false',

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

      if (!this.liveServerIsRunning && this.options.serve) {
        this.minimalServer = minimalLiveServer({
          root: `${this.outPath}/`,
          fileBuffer: this.inMemory ? this.inMemoryStore : null,
          port: this.options.port ? Number(this.options.port) : 4200,
          open: this.options.open,
        });
        this.liveServerIsRunning = true;
      }

      if (this.minimalServer) {
        this.minimalServer.broadcast('location:refresh');
      }

      this.buildInProgress = false;
      this.lastUpdatedFileList = [];
      this.cssCache = '';
      this.dryRun = false;

      this.times[1] = new Date().getTime();
      log(`EsBuild complete in ${this.times[1] - this.times[0]}ms`);

      if (!this.options.watch) {
        this.resolver(result);
      }
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

};
