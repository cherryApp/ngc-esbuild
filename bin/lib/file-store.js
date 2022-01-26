const path = require('path');
const fs = require('fs');
const sass = require('sass');

const { log, convertMessage } = require('./log');

module.exports = class FileStore {

  constructor(inMemory = true, outPath = '') {
    this.inMemory = inMemory;
    this.outPath = outPath;
    this.fileCache = {};
    this.inMemoryStore = {
      urlList: {},
    };
  }

  pushToInMemoryStore(filePath, content) {
    this.inMemoryStore[filePath] = content;
    this.inMemoryStore.urlList[filePath] =
      filePath.replace(/\\/g, '/').split(this.outPath).pop();
  }

  async fileWriter(filePath, content, encoding = 'utf8') {
    if (!this.inMemory) {
      await fs.promises.writeFile(filePath, content, encoding);
    } else {
      this.pushToInMemoryStore(filePath, content);
    }

    return filePath;
  }

  fileWriterSync(filePath, content, encoding = 'utf8') {
    if (!this.inMemory) {
      fs.writeFileSync(filePath, content, encoding);
    } else {
      this.pushToInMemoryStore(filePath, content);
    }

    return filePath;
  }

  async fileCopier(srcPath, destPath) {
    if (!this.inMemory) {
      return this.copyFile(srcPath, destPath);
    } else {
      const content = await fs.promises.readFile(srcPath);
      this.pushToInMemoryStore(destPath, content);
    }
  }

  async fileCopierSync(srcPath, destPath) {
    if (!this.inMemory) {
      fs.copyFileSync(srcPath, destPath);
    } else {
      const content = fs.readFileSync(srcPath);
      this.pushToInMemoryStore(destPath, content);
    }
  }

  copyFile(source, target) {
    return new Promise( (resolve, reject) => {
      var rd = fs.createReadStream(source);
      rd.on("error", function(err) {
        resolve(err);
      });
      var wr = fs.createWriteStream(target);
      wr.on("error", function(err) {
        resolve(err);
      });
      wr.on("close", function(ex) {
        resolve();
      });
      rd.pipe(wr);
    });
  }

  getCachedFile(srcPath = '', coding = 'utf8') {
    if (!this.fileCache[srcPath]) {
      return new Promise( async (resolve, reject) => {
        this.fileCache[srcPath] = await fs.promises.readFile(
          srcPath,
          coding === 'json' ? 'utf8' : coding,
        );

        if (coding === 'json') {
          this.fileCache[srcPath] = JSON.parse(this.fileCache[srcPath]);
        }
        resolve(this.fileCache[srcPath]);
      });
    }
    
    return Promise.resolve(this.fileCache[srcPath]);
  }

  async copyFromList(list = [], dest = '', filter = /.*/) {
    const processes = [];
    for (const file of list) {
      if (/^.*\.[a-zA-Z]{1,5}$/.test(file) && filter.test(file)) {
        processes.push(this.copyFile(
          file,
          path.join(dest, path.basename(file)),
        ));
      } else {
        processes.push(this.copyDir(file, dest, filter));
      }
    }

    await Promise.all(processes);

    return true;
  }

  /**
     * Copy whole directories.
     * @param {String} src path of the source directory
     * @param {String} dest path of the target directory
     */
   async copyDir(src = '', dest = '', filter = /.*/) {
    if (!this.inMemory) {
      await fs.promises.mkdir(dest, { recursive: true });
    }

    let entries = await fs.promises.readdir(src, { withFileTypes: true });

    const processes = [];

    for (let entry of entries) {
      let srcPath = path.join(src, entry.name);
      let destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory() && filter.test(srcPath)) {
        processes.push(this.copyDir(srcPath, destPath, filter));
      } else if (filter.test(srcPath)) {
        processes.push(this.copyFile(srcPath, destPath));
      }
    }

    await Promise.all(processes);

    return true;
  }
}
