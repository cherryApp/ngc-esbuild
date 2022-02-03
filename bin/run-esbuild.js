const path = require('path');
const fs = require('fs');

const chokidar = require('chokidar');
const { build } = require('esbuild');
const sass = require('sass');

const minimalLiveServer = require('./lib/minimal-server');
const { log, convertMessage } = require('./lib/log');
const FileStore = require('./lib/file-store');
const esBuilder = require('./lib/builder');

const { schema, esbuildOptions, parseArgs, parseOptions } = require(
  './lib/options-parser'
);
const zoneJsPlugin = require(
  './plugin/esbuild-plugin-zonejs'
);
const indexFileProcessor = require('./plugin/esbuild-index-file-processor');
const angularComponentDecoratorPlugin = require(
  './plugin/esbuild-component-decorator'
);
const assetsResolver = require('./plugin/esbuild-assets-resolver');
const cssResolver = require('./plugin/esbuild-css-resolver');
const jsResolver = require('./plugin/esbuild-js-resolver');

module.exports = class NgEsbuild {
  constructor(parsedOptions = {}, from = '') {
    this.times = [new Date().getTime(), new Date().getTime()];

    if (from === 'cmd') {
      this.options = parsedOptions.options;
      this.buildOptions = parsedOptions.buildOptions;
    } else {
      parsedOptions = parseOptions(parsedOptions);
      this.options = parsedOptions.options;
      this.buildOptions = parsedOptions.buildOptions;
    }

    this.HOST_ATTR = `_nghost-`;
    this.CONTENT_ATTR = `_ngcontent-`;
    this.componentStore = {};

    this.isWatching = false;

    this.inMemory = false;

    this.timeStamp = new Date().getTime();

    this.dryRun = true;

    this.cssCache = '';

    this.sass = require('sass');

    this.outPath = this.options.outputPath || this.options.outdir || 'dist/esbuild';

    this.workDir = process.cwd();

    this.outDir = path.join(this.workDir, this.outPath);

    this.store = new FileStore(this.inMemory, this.outPath);
    this.inMemoryStore = this.store.inMemoryStore;

    this.componentBuffer = {};

    this.angularOptions = null;


    this.liveServerIsRunning = false;
    this.buildInProgress = false;
    this.minimalServer = null;
    this.lastUpdatedFileList = [];

    this.buildTimeout = 0;

    this.resolver;
    this.rejector;
    this.resolve = new Promise((resolve, reject) => {
      this.resolver = resolve;
      this.rejector = reject;
    });

    this.getAngularOptions();

    this.initOutputDirectory();

    this.onlyBuild = false;
    if (this.options.watch || this.options.open || this.options.serve) {
      this.initWatcher();
    } else {
      this.onlyBuild = true;
      this.startBuild();
    }

  }

  async getAngularOptions() {
    if (!this.angularOptions) {
      const angularSettings = await this.store.getCachedFile(
        path.join(this.workDir, 'angular.json'),
        'json'
      );

      const project = this.options.project
        || Object.keys(angularSettings.projects)[0];

      const mode = this.options.mode || 'build';
      this.angularOptions = angularSettings.projects[project].architect[mode].options;
      // console.log('ANGULAROPTIONS: ', this.angularOptions);

      this.buildOptions.entryPoints = this.buildOptions.entryPoints
        || [this.angularOptions.main];
      this.buildOptions.tsconfig = this.angularOptions.tsConfig
        || this.buildOptions.tsconfig;
      this.buildOptions.outdir = this.options.outpath 
        || this.angularOptions.outputPath 
        || this.buildOptions.outdir;
    }

    return this.angularOptions;
  }

  async initOutputDirectory() {
    return fs.promises.rm(this.outDir, { recursive: true, force: true });
  }

  initWatcher() {
    const watcher = chokidar.watch([
      'src/app/**/*.(css|scss|js|ts|html)',
      'angular.json',
      'src/styles.scss',
      'src/main.ts',
      'src/index.html',
    ], {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      depth: 25,
    });
    watcher
      .on('error', err => console.error(err))
      .on('add', filePath => this.startBuild(filePath))
      .on('change', filePath => this.startBuild(filePath))
      .on('unlink', filePath => this.startBuild(filePath))
      .on('ready', () => this.startBuild('', true));
  }

  /**
   * Wrapper method to use esbuild.
   */
  async builder() {
    this.buildInProgress = true;
    const angularOptions = await this.getAngularOptions();
    this.buildOptions.plugins = [
      assetsResolver(this),
      indexFileProcessor(this),
      zoneJsPlugin(this),
      angularComponentDecoratorPlugin(this),
      cssResolver(this),
      jsResolver(this),
    ];

    esBuilder(this.buildOptions).then(result => {
      if (result.outputFiles) {
        result.outputFiles.forEach(file => {
          const key = path.join(this.outDir, path.basename(file.path));
          this.store.pushToInMemoryStore(key, file.text);
        });
      }

      if (!this.liveServerIsRunning && this.options.serve) {
        this.minimalServer = minimalLiveServer({
          root: `${angularOptions.outputPath}/`,
          fileBuffer: this.inMemory ? this.inMemoryStore : null,
          port: this.options.port 
            ? Number(this.options.port) 
            : this.angularOptions.port || 4200,
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


  startBuild(filePath = '', ready = false) {
    this.isWatching = ready ? ready : this.isWatching;
    if (!this.isWatching && !this.onlyBuild) {
      return;
    }
    
    if (filePath) {
      console.log(`changed: ${filePath}`);
      this.lastUpdatedFileList.push(
        path.join(process.cwd(), filePath)
      );
    }

    if (!this.lastUpdatedFileList.find(f => /.*angular\.json$/.test(f))) {
      this.dryRun = true;
    }

    // Refresh everything.
    // this.dryRun = true;

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
