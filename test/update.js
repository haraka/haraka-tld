'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const fsPromises = require('node:fs/promises')
const path = require('node:path')
const { describe, it, after } = require('node:test')

const update = require('../lib/update')

const mockFetch =
  ({ status = 200, body = '' } = {}) =>
  async () =>
    new Response(body, { status })

after(async () => {
  for (const f of ['tmpfile', 'download-test', 'download-test.tmp']) {
    await fsPromises.unlink(path.join('test', 'fixtures', f)).catch(() => {})
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
  it('returns true on 200', async () => {
    const isNewer = await update.isRemoteNewer(null, { fetch: mockFetch({ status: 200 }) })
    assert.equal(isNewer, true)
  })

  it('returns false on 304', async () => {
    const isNewer = await update.isRemoteNewer(null, { fetch: mockFetch({ status: 304 }) })
    assert.equal(isNewer, false)
  })

  it('returns false on 403', async () => {
    const isNewer = await update.isRemoteNewer(null, { fetch: mockFetch({ status: 403 }) })
    assert.equal(isNewer, false)
  })

  it('returns false on 404', async () => {
    const isNewer = await update.isRemoteNewer(null, { fetch: mockFetch({ status: 404 }) })
    assert.equal(isNewer, false)
  })

  it('returns false on 500', async () => {
    const isNewer = await update.isRemoteNewer(null, { fetch: mockFetch({ status: 500 }) })
    assert.equal(isNewer, false)
  })

  it('returns false when fetch throws (network failure)', async () => {
    const isNewer = await update.isRemoteNewer(null, {
      fetch: async () => {
        throw new Error('synthetic network failure')
      },
    })
    assert.equal(isNewer, false)
  })

  it('sends If-Modified-Since when local file exists', async () => {
    let seenHeaders
    const captureFetch = async (_url, init) => {
      seenHeaders = init.headers
      return new Response('', { status: 304 })
    }
    await update.isRemoteNewer(null, { fetch: captureFetch })
    assert.ok(seenHeaders['If-Modified-Since'], 'header set when file exists')
  })

  it('omits If-Modified-Since when local file is missing', async () => {
    let seenHeaders
    const captureFetch = async (_url, init) => {
      seenHeaders = init.headers
      return new Response('', { status: 200 })
    }
    await update.isRemoteNewer('non/existent/path', { fetch: captureFetch })
    assert.equal(seenHeaders['If-Modified-Since'], undefined)
  })
})

describe('download', () => {
  const dest = path.join('test', 'fixtures', 'download-test')

  it('downloads and writes file via stubbed fetch', async () => {
    const body = 'foo\nbar\nbaz\n'
    const installed = await update.download(dest, { fetch: mockFetch({ status: 200, body }) })
    assert.equal(installed, true)
    const content = await fsPromises.readFile(dest, 'utf8')
    assert.equal(content, body)
  })

  it('strips // comments through CommentStripper', async () => {
    const body = '// header comment\nfoo\n\nbar\n'
    await update.download(dest, { fetch: mockFetch({ status: 200, body }) })
    const content = await fsPromises.readFile(dest, 'utf8')
    assert.equal(content, 'foo\nbar\n')
  })

  it('throws on non-2xx response', async () => {
    await assert.rejects(update.download(dest, { fetch: mockFetch({ status: 500 }) }), /response code 500/)
  })

  it('cleans up tmp file when fetch throws', async () => {
    const failingFetch = async () => {
      throw new Error('synthetic network failure')
    }
    await assert.rejects(update.download(dest, { fetch: failingFetch }), /synthetic network failure/)
    assert.equal(fs.existsSync(`${dest}.tmp`), false, 'tmp file removed on failure')
  })

  it('errors if it cannot open tmp file', async () => {
    const filePath = path.join('non', 'existent', 'dir', 'test')
    await assert.rejects(update.download(filePath, { fetch: mockFetch({ status: 200, body: 'x' }) }))
  })
})

describe('updatePSLfile', () => {
  it('returns false when remote reports not-newer', async () => {
    const res = await update.updatePSLfile({ fetch: mockFetch({ status: 304 }) })
    assert.equal(res, false)
  })

  it('returns true and downloads when remote is newer', async () => {
    // First call (HEAD) returns 200, second call (GET) returns body.
    let nthCall = 0
    const fakeFetch = async () => {
      nthCall += 1
      if (nthCall === 1) return new Response('', { status: 200 })
      return new Response('updated\n', { status: 200 })
    }
    // Point download at a fixture path so we don't clobber the real PSL.
    // updatePSLfile hardcodes pslFile internally, so we exercise isRemoteNewer
    // and download independently above; this test verifies the composition.
    const origDownload = update.download
    let downloadCalled = false
    update.download = async () => {
      downloadCalled = true
    }
    try {
      const res = await update.updatePSLfile({ fetch: fakeFetch })
      assert.equal(res, true)
      assert.equal(downloadCalled, true)
    } finally {
      update.download = origDownload
    }
  })
})
