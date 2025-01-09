const fs = require('node:fs')
const fsp = require('node:fs/promises')
const http = require('node:https')
const path = require('node:path')

const CommentStripper = require('./comment-stripper')

const pslFile = path.resolve(__dirname, '..', 'etc', 'public-suffix-list')
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

exports.updatePSLfile = async function () {
  const isNewer = await exports.isRemoteNewer(pslFile)
  if (!isNewer) return false // no update

  await exports.download(pslFile)
  // console.log('update completed')
  return true
}

exports.atomicWrite = async function (tmp, dest) {
  await fsp.rename(tmp, dest)
  return true
}

exports.getWritableStream = async function (filePath) {
  const ws = fs.createWriteStream(filePath)
  return ws
}

exports.download = function (dest, opts) {
  if (!dest) dest = pslFile // for tests
  const tmpFile = `${dest}.tmp`

  return new Promise((resolve, reject) => {
    // open file before attempting HTTP GET
    this.getWritableStream(tmpFile)
      .then((ws) => {
        ws.on('close', () => {
          this.atomicWrite(tmpFile, dest).then(resolve).catch(reject)
        })

        const request = http
          .get(Object.assign({}, httpOpts, opts), (res) => {
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
      })
      .catch(reject)
  })
}

exports.getFileStats = async function (filePath) {
  if (!filePath) filePath = pslFile

  try {
    await fsp.access(filePath)

    const stats = await fsp.stat(filePath)
    if (stats.isFile()) return stats

    // console.error(`${filePath} is not a file`);
    await fsp.unlink(filePath)
    // console.log(`${filePath} deleted`);
    return null
  } catch (ignore) {
    // console.log(`${filePath} does not exist`);
    return null
  }
}

exports.isRemoteNewer = function (dest, opts) {
  if (!dest) dest = pslFile

  return new Promise((resolve, reject) => {
    this.getFileStats(dest)
      .then((stats) => {
        opts = Object.assign({}, httpOpts, opts, { method: 'HEAD' })
        if (stats) {
          opts.headers['If-Modified-Since'] = stats.mtime.toUTCString()
        }

        const request = http
          .request(opts, (res) => {
            switch (res.statusCode) {
              case 200:
                return resolve(true)
              case 304:
                // console.log(`${path.basename(dest)} is up-to-date`);
                return resolve(false)
              case 403:
                // console.log(`Access Denied for ${dest}`);
                return resolve(false)
              case 404:
                // console.log(`Not Found received for ${dest}`);
                return resolve(false)
              default:
                // console.log(`Unhandled status code: ${res.statusCode}`);
                // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                resolve(false)
            }
          })
          .on('error', reject)

        request.end()
      })
      .catch(reject)
  })
}
