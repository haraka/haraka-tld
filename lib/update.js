
const fs   = require('fs')
const http = require('https')
const path = require('path')

const CommentStripper = require('./comment-stripper')

const pslFile = path.resolve('etc', 'public-suffix-list')
// console.log(`pslFile: ${pslFile}`)

const httpOpts = {
  hostname: 'publicsuffix.org',
  path: '/list/effective_tld_names.dat',
  port: 443,
  headers: {
    'User-Agent': 'Haraka-TLD',
  },
  agent: false,
}

exports.updatePSLfile = function () {
  return new Promise((resolve, reject) => {
    exports.isRemoteNewer(pslFile).then(isNewer => {
      if (!isNewer) return resolve(false)  // no update

      exports.download(pslFile).then(() => {
        // console.log('update completed')
        resolve(true)
      }).catch(reject)
    }).catch(reject)
  })
}

exports.atomicWrite = function (tmp, dest) {
  return new Promise((resolve, reject) => {
    fs.rename(tmp, dest, (err) => {
      if (err) return reject(err);
      // console.log(`moved ${path.basename(tmp)} to ${dest}`);
      resolve(true);
    })
  })
}

exports.getWritableStream = function (filePath) {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(filePath)
    // ws.on('finish', () => { console.log(`written: ${filePath}`) })
    // ws.on('close',  () => { console.log(`closed : ${filePath}`) })
    ws.on('error', reject)
    ws.on('open', () => resolve(ws))
  })
}

exports.download = function (dest, opts) {
  if (!dest) dest = pslFile; // for tests
  const tmpFile = `${dest}.tmp`

  return new Promise((resolve, reject) => {

    // open file before attempting HTTP GET
    this.getWritableStream(tmpFile).then(ws => {

      ws.on('close', () => {
        this.atomicWrite(tmpFile, dest).then(resolve).catch(reject);
      })

      const request = http.get(Object.assign({}, httpOpts, opts), (res) => {
        if (res.statusCode !== 200) {
          // console.error(`HEADERS: ${JSON.stringify(res.headers)}`);
          reject(new Error(`response code ${res.statusCode} not handled!`))
          return
        }

        res.pipe(new CommentStripper()).pipe(ws)
      })
        .on('error', (e) => {
          // console.error(e)
          fs.unlink(tmpFile, () => {
            // unlikely the file exists. This callback catches the error and ignores it.
            reject(e)
          })
        })

      request.end()

    }).catch(reject)
  })
}

exports.getFileStats = function (filePath) {
  if (!filePath) filePath = pslFile;

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      // console.log(`${filePath} does not exist`);
      return resolve(null);
    }

    fs.stat(filePath, (err, stats) => {
      if (err) return reject(err);

      if (stats.isFile()) return resolve(stats);

      // console.error(`${filePath} is not a file`);
      fs.unlink(filePath, () => {
        // console.log(`${filePath} deleted`);
        resolve(null);
      })
    })
  })
}

exports.isRemoteNewer = function (dest, opts) {
  if (!dest) dest = pslFile;

  return new Promise((resolve, reject) => {

    this.getFileStats(dest).then(stats => {

      opts = Object.assign({}, httpOpts, opts, { method: 'HEAD' });
      if (stats) {
        opts.headers['If-Modified-Since'] = stats.mtime.toUTCString();
      }

      const request = http.request(opts, (res) => {
        switch (res.statusCode) {
          case 200:
            return resolve(true);
          case 304:
            // console.log(`${path.basename(dest)} is up-to-date`);
            return resolve(false);
          case 403:
            // console.log(`Access Denied for ${dest}`);
            return resolve(false);
          case 404:
            // console.log(`Not Found received for ${dest}`);
            return resolve(false);
          default:
            // console.log(`Unhandled status code: ${res.statusCode}`);
            // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            resolve(false);
        }
      }).on('error', reject);

      request.end();

    }).catch(reject);
  })
}
