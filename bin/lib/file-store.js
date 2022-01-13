const path = require('path');
const fs = require('fs');
const sass = require('sass');

const { log, convertMessage } = require('./log');

module.exports = class FileStore {

  constructor(inMemory = true, outPath = '') {
    this.inMemory = inMemory;
    this.outPath = outPath;
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
      await fs.promises.copyFile(srcPath, destPath);
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

  /**
     * Copy whole directories.
     * @param {String} src path of the source directory
     * @param {String} dest path of the target directory
     */
   async copyDir(src, dest) {
    if (!this.inMemory) {
      await fs.promises.mkdir(dest, { recursive: true });
    }

    let entries = await fs.promises.readdir(src, { withFileTypes: true });

    for (let entry of entries) {
      let srcPath = path.join(src, entry.name);
      let destPath = path.join(dest, entry.name);

      entry.isDirectory() ?
        await this.copyDir(srcPath, destPath) :
        await this.fileCopier(srcPath, destPath);
    }
  }
}
