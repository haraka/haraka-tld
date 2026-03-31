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
})
