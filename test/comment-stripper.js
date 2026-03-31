const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const { describe, it } = require('node:test')
const { finished } = require('node:stream/promises')

const CommentStripper = require('../lib/comment-stripper')

const rawFile = path.resolve('test', 'fixtures', 'raw')
const outFile = path.resolve('test', 'fixtures', 'out')

describe('comment-stripper', function () {
  it('removes blank lines and comments', async function () {
    const rs = fs.createReadStream(rawFile)
    const ws = fs.createWriteStream(outFile)
    rs.pipe(new CommentStripper()).pipe(ws)
    await finished(ws)
  })

  it('handles buffer input requiring decoding', async function () {
    const stripper = new CommentStripper()
    let output = ''
    stripper.on('data', (chunk) => {
      output += chunk.toString()
    })

    // Write a buffer to trigger the decoding logic in _transform
    stripper.write(Buffer.from('line1\n//comment\n\nline2\n'))
    stripper.end()
    await finished(stripper)

    assert.strictEqual(output, 'line1\nline2\n')
  })
})
