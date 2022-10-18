const { WebSocketServer } = require('ws');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const { log } = require('./log');

const serverOptions = {
  root: process.cwd(), // root of the file-server
  fileBuffer: {}, // a buffer to loading files from the memory
  port: 4200, // http port
  open: false, // open in the default browser
  certDir: '', // directory of certificates
};

/**
   * Minimal live-server for developing purposes.
   * @param {serverOptions} options
   * @returns an object with the server and websocket-server instances
   */
module.exports = (
  options = serverOptions
) => {

  options = {...serverOptions, ...options};

  const wssPort = Number(options.port) - 4200 + 8800;
  const wss = new WebSocketServer({ port: wssPort });
  wss.on('connection', function connection(ws) {
    ws.on('message', function message(data) {
      log('received: %s', data);
    });

    ws.send('Esbuild live server started');
  });

  const broadcast = message => {
    wss.clients.forEach(function each(client) {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  };

  const clientScript = `<script>
    const ws = new WebSocket('ws://127.0.0.1:${wssPort}');
    ws.onmessage = m => {
      if (m.data === 'location:refresh') {
        location.reload();
      }
    }
  </script>`;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET, PUT, PATCH, DELETE",
    "Access-Control-Max-Age": 0, // No Cache
  };

  const resolveIndexPage = async (options, response) => {
    let content = await fs.promises.readFile(
      path.join(options.root, 'index.html'),
      'utf8'
    );
    content = content.replace(/\<\/body\>/g, `${clientScript}\n</body>`);
    response.writeHead(200, ({ ...headers, 'Content-Type': 'text/html' }));
    response.end(content);
  };

  // Request handler function.
  const requestHandler = async (request, response) => {

    let filePath = '.' + request.url;
    if (filePath == './') {
      return resolveIndexPage(options, response);
    } else {
      filePath = path.join(options.root, request.url);
      isIndexPage = false;
    }
    filePath = filePath.split('?')[0];

    const absPath = path.resolve(filePath);
    let inMemoryFile = null;
    if (options.fileBuffer && options.fileBuffer[absPath]) {
      inMemoryFile = options.fileBuffer[absPath];
    }

    var extname = String(path.extname(filePath)).toLowerCase();
    var mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';
    const encoding = ['.html', '.js', '.css'].includes(extname)
      ? 'utf8'
      : null;

    try {
      let content = inMemoryFile || await fs.promises.readFile(filePath, encoding);
      response.writeHead(200, ({ ...headers, 'Content-Type': contentType }));
      response.end(content);
    } catch (e) {
      if (e.code == 'ENOENT') {
        resolveIndexPage(options, response);
        // log('ENOENT: ', fileBuffer ? Object.keys(fileBuffer) : e);
        // response.writeHead(404, ({ ...headers, 'Content-Type': 'text/html' }));
        // response.end('Page Not Found!', 'utf8');
      } else {
        response.writeHead(500);
        response.end('Sorry, check with the site admin for error: ' + e.code + ', ' + e);
      }
    }

  };

  // Start ssl or non-ssl server.
  if (options.certDir) {
    const ssl = {
      key: fs.readFileSync( path.join(options.certDir, '/privkey.pem'), 'utf8'),
      cert: fs.readFileSync( path.join(options.certDir, '/cert.pem'), 'utf8'),
      ca: fs.readFileSync( path.join(options.certDir, '/chain.pem'), 'utf8'),
    };
    const server = https.createServer(ssl, requestHandler).listen(options.port);
  } else {
    const server = http.createServer(requestHandler).listen(options.port);    
  }

  log(`Angular dev-server is running at http://localhost:${options.port}/`);

  const start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');

  if (options.open === true) {
    exec(start + ` http://localhost:${options.port}/`);
  }

  return {
    server,
    wss,
    broadcast,
  };
}
