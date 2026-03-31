'use strict'

const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const readline = require('node:readline')

const punycode = require('punycode.js')

const update = require('./lib/update')

const regex = {
  comment: /^\s*[;#].*$/,
}

const logger = {
  log: (message) => {
    switch (process.env.HARAKA_LOGS_SUPPRESS) {
      case undefined:
      case 'false':
      case '0':
        console.log(message)
    }
  },
}

exports.public_suffix_list = new Map()
exports.top_level_tlds = new Set()
exports.two_level_tlds = new Set()
exports.three_level_tlds = new Set()

function normalizeHost(host) {
  host = host.toLowerCase()

  if (/^xn--|\.xn--/.test(host)) {
    try {
      host = punycode.toUnicode(host)
    } catch {}
  }

  return host
}

exports.is_public_suffix = function (host) {
  if (!host) return false
  host = normalizeHost(host)

  if (exports.public_suffix_list.has(host)) return true

  const up_one_level = host.split('.').slice(1).join('.') // co.uk -> uk
  if (!up_one_level) return false // no dot?

  const wildHost = `*.${up_one_level}`
  if (exports.public_suffix_list.has(wildHost)) {
    // check exception list
    if (exports.public_suffix_list.has(`!${host}`)) return false
    return true // matched a wildcard, ex: *.uk
  }

  return false
}

exports.get_organizational_domain = function (host) {
  // the domain that was registered with a domain name registrar. See
  // https://datatracker.ietf.org/doc/draft-kucherawy-dmarc-base/?include_text=1
  //   section 3.2

  if (!host) return null
  host = normalizeHost(host)

  // www.example.com -> [ com, example, www ]
  const labels = host.split('.').reverse()

  // 4.3 Search the public suffix list for the name that matches the
  //     largest number of labels found in the subject DNS domain.
  let greatest = 0
  for (let i = 1; i <= labels.length; i++) {
    if (!labels[i - 1]) return null // dot w/o label
    const tld = labels.slice(0, i).reverse().join('.')
    if (exports.is_public_suffix(tld)) {
      greatest = i + 1
    } else if (exports.public_suffix_list.has(`!${tld}`)) {
      greatest = i
    }
  }

  // 4.4 Construct a new DNS domain name using the name that matched
  //     from the public suffix list and prefixing to it the "x+1"th
  //     label from the subject domain.
  if (greatest === 0) return null // no valid TLD
  if (greatest > labels.length) return null // not enough labels
  if (greatest === labels.length) return host // same

  const orgName = labels.slice(0, greatest).reverse().join('.')
  return orgName
}

exports.split_hostname = function (host, level) {
  if (typeof host !== 'string') return []

  if (!level || level < 1 || level > 3) {
    level = 2
  }

  const split = host.toLowerCase().split(/\./).reverse()
  let domain = ''
  // TLD
  if (level >= 1 && split[0] && exports.top_level_tlds.has(split[0])) {
    domain = split.shift() + domain
  }
  // 2nd TLD
  if (level >= 2 && split[0] && exports.two_level_tlds.has(`${split[0]}.${domain}`)) {
    domain = `${split.shift()}.${domain}`
  }
  // 3rd TLD
  if (level >= 3 && split[0] && exports.three_level_tlds.has(`${split[0]}.${domain}`)) {
    domain = `${split.shift()}.${domain}`
  }
  // Domain
  if (split[0]) {
    domain = `${split.shift()}.${domain}`
  }
  return [split.reverse().join('.'), domain]
}

exports.asParts = function (host) {
  const r = { tld: '', org: '', host: '' }

  host = normalizeHost(host)
  if (!host) return r

  const labels = host.split('.').reverse()

  let greatest = 0
  for (let i = 1; i <= labels.length; i++) {
    if (!labels[i - 1]) return r // dot w/o label
    const tld = labels.slice(0, i).reverse().join('.')
    if (exports.is_public_suffix(tld)) {
      greatest = i + 1
    } else if (exports.public_suffix_list.has(`!${tld}`)) {
      greatest = i
    }
  }

  if (greatest === 0) return r // no valid TLD
  r.tld = labels
    .slice(0, greatest - 1)
    .reverse()
    .join('.')
  r.org = labels
    .slice(greatest - 1, greatest)
    .reverse()
    .join('.')
  r.host = labels.slice(greatest).reverse().join('.')
  return r
}

async function load_public_suffix_list() {
  const entries = await load_list_from_file('public-suffix-list')
  for (const entry of entries) {
    // Parsing rules: http://publicsuffix.org/list/
    // Each line is only read up to the first whitespace
    const suffix = entry.split(/\s/).shift()

    // Each line which is not entirely whitespace or begins with a comment
    // contains a rule.
    if (!suffix) continue // empty string
    if (suffix.startsWith('/')) continue // comment

    // A rule may begin with a "!" (exclamation mark). If it does, it is
    // labelled as a "exception rule" and then treated as if the exclamation
    // mark is not present.
    if (suffix.startsWith('!')) {
      const eName = suffix.substring(1) // remove ! prefix
      // bbc.co.uk -> co.uk
      const up_one = eName.split('.').slice(1).join('.')
      if (exports.public_suffix_list.has(up_one)) {
        exports.public_suffix_list.get(up_one).push(eName)
      } else if (exports.public_suffix_list.has(`*.${up_one}`)) {
        exports.public_suffix_list.get(`*.${up_one}`).push(eName)
      } else {
        console.error(`unable to find parent for exception: ${eName}`)
      }
    }

    exports.public_suffix_list.set(suffix, [])
  }

  logger.log(`loaded ${exports.public_suffix_list.size} Public Suffixes`)
}

async function load_tld_files() {
  const [top, two, three, extra] = await Promise.all([
    load_list_from_file('top-level-tlds'),
    load_list_from_file('two-level-tlds'),
    load_list_from_file('three-level-tlds'),
    load_list_from_file('extra-tlds'),
  ])

  for (const tld of top) exports.top_level_tlds.add(tld)
  for (const tld of two) exports.two_level_tlds.add(tld)
  for (const tld of three) exports.three_level_tlds.add(tld)
  for (const tld of extra) {
    const s = tld.split('.')
    if (s.length === 2) exports.two_level_tlds.add(tld)
    else if (s.length === 3) exports.three_level_tlds.add(tld)
  }

  logger.log(`loaded TLD files:
  1=${exports.top_level_tlds.size}
  2=${exports.two_level_tlds.size}
  3=${exports.three_level_tlds.size}`)
}

async function load_list_from_file(name) {
  let filePath = path.resolve(__dirname, 'etc', name)
  try {
    await fsp.access(filePath)
  } catch {
    // not loaded by Haraka, use local path
    filePath = path.resolve('etc', name)
  }

  const result = []
  const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity })

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed || regex.comment.test(trimmed)) continue
    result.push(trimmed.toLowerCase())
  }

  return result
}

// Populate all lists on load. Callers can await exports.ready before use.
exports.ready = (async () => {
  await load_tld_files()
  await load_public_suffix_list()
})()

// every 15 days, check for an update. If updated, download, install,
// and then read it into the exported object
setInterval(
  async () => {
    try {
      const updated = await update.updatePSLfile()
      if (updated) await load_public_suffix_list()
    } catch (err) {
      console.error(err.message)
    }
  },
  15 * 86400 * 1000,
).unref() // each 15 days

// the .unref() on the interval tells node to ignore this
// timer when deciding whether the process is done.
