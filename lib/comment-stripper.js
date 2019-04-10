
const StringDecoder = require('string_decoder').StringDecoder
const Transform = require('stream').Transform

class commentStripper extends Transform {

  constructor (options) {

    if (!options) options = {}
    if (!options.transform) options.transform = { objectMode: true }

    super(options.transform)

    this._encoding  = options.encoding  || 'utf8'
    this._seperator = options.seperator || '\n'
    this._buffer = ''
    this._decoder = new StringDecoder(this._encoding)

    this.bytes = options.bytes || 0
  }

  _transform (chunk, encoding, done) {
    this.bytes += chunk.length

    if (encoding !== this._encoding) {
      // this is likely 'buffer' when the source file is an archive
      this._buffer += this._decoder.write(chunk)
    }
    else {
      // already decoded by fs.createReadStream
      this._buffer += chunk
    }

    const lines = this._buffer.split(this._seperator)
    this._buffer = lines.pop()

    for (const line of lines) {
      if (/^$/.test(line)) continue     // blank lines
      if (/^\/\//.test(line)) continue  // comments
      this.push(`${line}\n`)
    }

    done()
  }

  _flush (done) {
    // trailing text (after last seperator)
    const rem = this._buffer.trim()
    if (rem) this.push(rem)
    this._buffer = ''
    done()
  }
}

module.exports = function (options) {
  return new commentStripper(options)
}