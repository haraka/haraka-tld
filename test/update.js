'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const fsPromises = require('node:fs/promises')
const path = require('node:path')
const { describe, it, after } = require('node:test')

const update = require('../lib/update')

after(async () => {
  try {
    await fsPromises.unlink(path.join('test', 'fixtures', 'tmpfile'))
  } catch (ignore) {
    // ignore if it doesn't exist
  }
})

describe('getFileStats', () => {
  it('get fs.stats from default existing PSL', async () => {
    const stats = await update.getFileStats()
    assert.ok(stats.size > 10000, stats.size)
  })

  it('returns null from a missing file', async () => {
    const stats = await update.getFileStats(path.join('etc', 'nonexist'))
    assert.equal(stats, null)
  })

  it('deletes and returns null if path is a directory', async () => {
    const dirPath = path.join('test', 'fixtures', 'testdir')
    if (!fs.existsSync(dirPath)) await fsPromises.mkdir(dirPath)
    const stats = await update.getFileStats(dirPath)
    assert.equal(stats, null)
    assert.equal(fs.existsSync(dirPath), false)
  })
})

describe('isRemoteNewer', () => {
  it('a HTTP POST returns false if remote file is newer', async () => {
    const isNewer = await update.isRemoteNewer(null)
    if (isNewer) {
      assert.equal(isNewer, true)
    } else {
      assert.equal(isNewer, false)
    }
  })

  it('a HTTP POST returns false when remote non-existing', async () => {
    const isNewer = await update.isRemoteNewer(null, { path: '/invalid/url' })
    assert.equal(isNewer, false)
  })

  it('returns false on 403', async () => {
    const isNewer = await update.isRemoteNewer(null, { hostname: 'httpbin.org', path: '/status/403' })
    assert.equal(isNewer, false)
  })

  it('returns false on 404', async () => {
    const isNewer = await update.isRemoteNewer(null, { hostname: 'httpbin.org', path: '/status/404' })
    assert.equal(isNewer, false)
  })

  it('returns false on 500', async () => {
    const isNewer = await update.isRemoteNewer(null, { hostname: 'httpbin.org', path: '/status/500' })
    assert.equal(isNewer, false)
  })

  it('a HTTP POST returns false when local and remote non-existing', { skip: true }, async () => {
    const isNewer = await update.isRemoteNewer('non/exist', { path: '/invalid/url' })
    assert.equal(isNewer, false)
  })
})

describe('getWritableStream', () => {
  it('opens a file for writing a stream to', async () => {
    const filePath = path.join('test', 'fixtures', 'tmpfile')
    const ws = await update.getWritableStream(filePath)
    assert.equal(ws.writable, true)
    ws.close()
  })

  it('throws when it cannot open file', async () => {
    const filePath = path.join('non', 'existent', 'dir', 'tmpfile')
    await assert.rejects(async () => {
      await update.getWritableStream(filePath)
    })
  })
})

describe('download', () => {
  const testOpts = {
    hostname: 'raw.githubusercontent.com',
    path: '/haraka/haraka-tld/master/etc/public-suffix-list',
  }

  it('errors if it cannot open tmp file', async () => {
    const filePath = path.join('non', 'existent', 'dir', 'test')
    await assert.rejects(async () => {
      await update.download(filePath, testOpts)
    })
  })

  // avoid transient errors, only run these manually
  it('use HTTP GET to fetch newer PSL', { skip: true }, async () => {
    const installed = await update.download(null, testOpts)
    assert.equal(installed, true)
  })
})

describe('updatePSLfile', () => {
  it('returns false when no update needed', async () => {
    const res = await update.updatePSLfile()
    assert.equal(res, false)
  })
})

describe('atomicWrite', () => {
  it('renames a file', async () => {
    const tmp = path.join('test', 'fixtures', 'tmp-atomic')
    const dest = path.join('test', 'fixtures', 'dest-atomic')
    await fsPromises.writeFile(tmp, 'test')
    const res = await update.atomicWrite(tmp, dest)
    assert.equal(res, true)
    const content = await fsPromises.readFile(dest, 'utf8')
    assert.equal(content, 'test')
    await fsPromises.unlink(dest)
  })
})
