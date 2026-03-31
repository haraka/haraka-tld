const fs = require('node:fs')
const fsp = require('node:fs/promises')
const http = require('node:https')
const path = require('node:path')

const CommentStripper = require('./comment-stripper')

const pslFile = path.resolve(__dirname, '..', 'etc', 'public-suffix-list')

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
  return true
}

exports.atomicWrite = async function (tmp, dest) {
  await fsp.rename(tmp, dest)
  return true
}

exports.getWritableStream = function (filePath) {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(filePath)
    ws.on('open', () => resolve(ws))
    ws.on('error', reject)
  })
}

exports.download = async function (dest, opts) {
  if (!dest) dest = pslFile
  const tmpFile = `${dest}.tmp`

  const ws = await exports.getWritableStream(tmpFile)

  return new Promise((resolve, reject) => {
    ws.on('close', () => {
      exports.atomicWrite(tmpFile, dest).then(resolve).catch(reject)
    })

    http
      .get({ ...httpOpts, ...opts }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`response code ${res.statusCode} not handled!`))
          return
        }
        res.pipe(new CommentStripper()).pipe(ws)
      })
      .on('error', (e) => {
        fsp
          .unlink(tmpFile)
          .catch(() => {})
          .then(() => reject(e))
      })
  })
}

exports.getFileStats = async function (filePath) {
  if (!filePath) filePath = pslFile

  try {
    const stats = await fsp.stat(filePath)
    if (stats.isFile()) return stats

    if (stats.isDirectory()) {
      await fsp.rmdir(filePath)
    } else {
      await fsp.unlink(filePath)
    }
    return null
  } catch {
    return null
  }
}

exports.isRemoteNewer = async function (dest, opts) {
  if (!dest) dest = pslFile

  const stats = await exports.getFileStats(dest)
  const reqOpts = { ...httpOpts, ...opts, method: 'HEAD' }
  if (stats) {
    reqOpts.headers = { ...reqOpts.headers, 'If-Modified-Since': stats.mtime.toUTCString() }
  }

  return new Promise((resolve, reject) => {
    http
      .request(reqOpts, (res) => {
        switch (res.statusCode) {
          case 200:
            return resolve(true)
          case 304:
          case 403:
          case 404:
            return resolve(false)
          default:
            resolve(false)
        }
      })
      .on('error', reject)
      .end()
  })
}
