const { StringDecoder } = require('node:string_decoder')
const { Transform } = require('node:stream')

class CommentStripper extends Transform {
  constructor(options = {}) {
    super(options)

    this._encoding = options.encoding ?? 'utf8'
    this._separator = options.separator ?? '\n'
    this._buffer = ''
    this._decoder = new StringDecoder(this._encoding)

    this.bytes = options.bytes ?? 0
  }

  _transform(chunk, encoding, done) {
    this.bytes += chunk.length

    if (encoding !== this._encoding) {
      // this is likely 'buffer' when the source is a binary stream
      this._buffer += this._decoder.write(chunk)
    } else {
      // already decoded
      this._buffer += chunk
    }

    const lines = this._buffer.split(this._separator)
    this._buffer = lines.pop()

    for (const line of lines) {
      if (/^$/.test(line)) continue // blank lines
      if (/^\/\//.test(line)) continue // comments
      this.push(`${line}\n`)
    }

    done()
  }

  _flush(done) {
    // trailing text (after last separator)
    const rem = this._buffer.trim()
    if (rem) this.push(rem)
    this._buffer = ''
    done()
  }
}

module.exports = CommentStripper
