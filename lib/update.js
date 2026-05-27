const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const { Readable } = require('node:stream')
const { pipeline } = require('node:stream/promises')

const CommentStripper = require('./comment-stripper')

const pslFile = path.resolve(__dirname, '..', 'etc', 'public-suffix-list')
const PSL_URL = 'https://publicsuffix.org/list/effective_tld_names.dat'
const UA_HEADER = { 'User-Agent': 'Haraka-TLD' }

exports.updatePSLfile = async (opts = {}) => {
  const isNewer = await exports.isRemoteNewer(pslFile, opts)
  if (!isNewer) return false
  await exports.download(pslFile, opts)
  return true
}

exports.getFileStats = async (filePath = pslFile) => {
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

exports.isRemoteNewer = async (dest, opts = {}) => {
  if (!dest) dest = pslFile
  const fetchImpl = opts.fetch ?? fetch
  const url = opts.url ?? PSL_URL

  const stats = await exports.getFileStats(dest)
  const headers = { ...UA_HEADER }
  if (stats) headers['If-Modified-Since'] = stats.mtime.toUTCString()

  try {
    const res = await fetchImpl(url, {
      method: 'HEAD',
      headers,
      signal: AbortSignal.timeout(30_000),
    })
    return res.status === 200
  } catch {
    return false
  }
}

exports.download = async (dest, opts = {}) => {
  if (!dest) dest = pslFile
  const fetchImpl = opts.fetch ?? fetch
  const url = opts.url ?? PSL_URL
  const tmpFile = `${dest}.tmp`

  const res = await fetchImpl(url, {
    headers: UA_HEADER,
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`response code ${res.status} not handled!`)

  try {
    await pipeline(Readable.fromWeb(res.body), new CommentStripper(), fs.createWriteStream(tmpFile))
    await fsp.rename(tmpFile, dest)
  } catch (err) {
    await fsp.unlink(tmpFile).catch(() => {})
    throw err
  }
  return true
}
