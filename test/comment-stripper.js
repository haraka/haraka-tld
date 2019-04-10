
const fs   = require('fs')
const path = require('path')

const CommentStripper = require('../lib/comment-stripper')

const rawFile = path.resolve('test', 'fixtures', 'raw')
const outFile = path.resolve('test', 'fixtures', 'out')

describe('comment-stripper', function () {
  it('removes blank lines and comments', function (done) {
    const rs = fs.createReadStream(rawFile)
    const ws = fs.createWriteStream(outFile)
    // console.log(ws);
    rs.pipe(new CommentStripper()).pipe(ws)
    ws.on('close', () => {
      done()
    })
  })
})