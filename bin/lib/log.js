module.exports = {
  log: (...args) => {
    console.log(...args);
  },
  /**
     * Converts error messages to the esbuild format.
     * @param {Object} param0 object of the error message
     * @returns converted error message for esbuild
     */
  convertMessage({ message, start, end }) {
    let location
    if (start && end) {
      let lineText = source.split(/\r\n|\r|\n/g)[start.line - 1]
      let lineEnd = start.line === end.line ? end.column : lineText.length
      location = {
        file: filename,
        line: start.line,
        column: start.column,
        length: lineEnd - start.column,
        lineText,
      }
    }
    return { text: message, location }
  },
};
