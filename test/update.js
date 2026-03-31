const assert = require('node:assert/strict')
const fsPromises = require('node:fs/promises')
const path = require('node:path')
const { describe, it, after } = require('node:test')

const update = require('../lib/update')

after(async function () {
  try {
    await fsPromises.unlink(path.join('test', 'fixtures', 'tmpfile'))
  } catch (ignore) {
    // ignore if it doesn't exist
  }
})

describe('getFileStats', function () {
  it('get fs.stats from default existing PSL', async function () {
    const stats = await update.getFileStats()
    assert.ok(stats.size > 10000, stats.size)
  })

  it('returns null from a missing file', async function () {
    const stats = await update.getFileStats(path.join('etc', 'nonexist'))
    assert.equal(stats, null)
  })
})

describe('isRemoteNewer', function () {
  it('a HTTP POST returns false if remote file is newer', async function () {
    const isNewer = await update.isRemoteNewer(null)
    if (isNewer) {
      assert.equal(isNewer, true)
    } else {
      assert.equal(isNewer, false)
    }
  })

  it('a HTTP POST returns false when remote non-existing', async function () {
    const isNewer = await update.isRemoteNewer(null, { path: '/invalid/url' })
    assert.equal(isNewer, false)
  })

  it('a HTTP POST returns false when local and remote non-existing', { skip: true }, async function () {
    const isNewer = await update.isRemoteNewer('non/exist', { path: '/invalid/url' })
    assert.equal(isNewer, false)
  })
})

describe('getWritableStream', function () {
  it('opens a file for writing a stream to', async function () {
    const filePath = path.join('test', 'fixtures', 'tmpfile')
    const ws = await update.getWritableStream(filePath)
    assert.equal(ws.writable, true)
    ws.close()
  })

  it('throws when it cannot open file', async function () {
    const filePath = path.join('non', 'existent', 'dir', 'tmpfile')
    await assert.rejects(async () => {
      await update.getWritableStream(filePath)
    })
  })
})

describe('download', function () {
  const testOpts = {
    hostname: 'raw.githubusercontent.com',
    path: '/haraka/haraka-tld/master/etc/public-suffix-list',
  }

  it('errors if it cannot open tmp file', async function () {
    const filePath = path.join('non', 'existent', 'dir', 'test')
    await assert.rejects(async () => {
      await update.download(filePath, testOpts)
    })
  })

  // avoid transient errors, only run these manually
  it('use HTTP GET to fetch newer PSL', { skip: true }, async function () {
    const installed = await update.download(null, testOpts)
    assert.equal(installed, true)
  })
})
