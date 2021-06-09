
const assert = require('assert')
const fs     = require('fs')
const path   = require('path')

const update = require('../lib/update')

after(function (done) {
  fs.unlink(path.join('test', 'fixtures', 'tmpfile'), () => {
    done()
  })
})

describe('getFileStats', function () {
  it('get fs.stats from default existing PSL', function (done) {
    update.getFileStats().then((stats) => {
      // console.log(stats);
      assert.ok(stats.size > 10000, stats.size)
      done()
    }).catch(done);
  })

  it('returns null from a missing file', function (done) {
    update.getFileStats('etc/nonexist').then((stats) => {
      assert.equal(stats, null)
      done();
    }).catch(done);
  })
})

describe('isRemoteNewer', function () {
  this.slow(500);
  it('a HTTP POST returns false if remote file is newer', function (done) {
    update.isRemoteNewer(null).then(isNewer => {
      if (isNewer) {
        assert.equal(isNewer, true)
      }
      else {
        assert.equal(isNewer, false)
      }
      done()
    }).catch(done)
  })

  it('a HTTP POST returns false when remote non-existing', function (done) {
    update.isRemoteNewer(null, { path: '/invalid/url' }).then(isNewer => {
      assert.equal(isNewer, false)
      done()
    })
  })

  it.skip('a HTTP POST returns false when local and remote non-existing', function (done) {
    update.isRemoteNewer('non/exist', { path: '/invalid/url' }).then(isNewer => {
      assert.equal(isNewer, false)
      done()
    }).catch(done)
  })
})

describe('getWritableStream', function () {
  it('opens a file for writing a stream to', function (done) {
    update.getWritableStream('test/fixtures/tmpfile').then(ws => {
      // console.log(ws);
      assert.equal(ws.writable, true);
      ws.close();
      done();
    }).catch(done)
  })

  it('throws when it cannot open file', function (done) {
    update.getWritableStream('test/fixtures/unwritable/tmpfile')
      .then(ws => {
        assert.ok(!ws);  // shouldn't ever get here
        done();
      })
      .catch((err) => {
        // console.log(err.message);
        assert.ok(err.message);
        done();
      })
  })
})

describe('download', function () {

  const testOpts = {
    hostname: 'raw.githubusercontent.com',
    path: '/haraka/haraka-tld/master/etc/public-suffix-list',
  }

  it('errors if it cannot open tmp file', function (done) {
    update.download('test/fixtures/unwritable/test', testOpts)
      .then((installed) => {
        assert.equal(installed, false); // should never get here
        done()
      })
      .catch((err) => {
        console.error(err.message)
        assert.ok(err);
        done()
      })
  })

  // avoid transient errors, only run these manually
  it.skip('use HTTP GET to fetch newer PSL', function (done) {
    this.slow(1000);
    this.timeout(3000);
    update.download(null, testOpts).then((installed) => {
      assert.equal(installed, true);
      done()
    }).catch(done)
  })
})