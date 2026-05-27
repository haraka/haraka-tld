'use strict'

const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const readline = require('node:readline')
const { domainToASCII, domainToUnicode } = require('node:url')

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

const normalizeHost = (host) => {
  host = host.toLowerCase()

  if (/^xn--|\.xn--/.test(host)) {
    const unicode = domainToUnicode(host)
    if (unicode) host = unicode
  }

  return host
}

exports.is_public_suffix = (host) => {
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

exports.get_organizational_domain = (host) => {
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

  return labels.slice(0, greatest).reverse().join('.')
}

exports.split_hostname = (host, level) => {
  if (typeof host !== 'string') return []

  if (!level || level < 1 || level > 3) {
    level = 2
  }

  // TLD sets store punycode/ASCII, so normalize Unicode IDN input.
  // domainToASCII returns '' for malformed input; fall back to the original.
  const ascii = (domainToASCII(host) || host).toLowerCase()
  const split = ascii.split('.').reverse()
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

exports.asParts = (host) => {
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

// Refuse a reload if the new container differs in size by more than 10% from
// the old one. Guards against partial/truncated files. Skipped on first load
// (current size 0).
const RELOAD_SIZE_TOLERANCE = 0.1

const within_tolerance = (next_size, current_size, label) => {
  if (current_size === 0) return true
  const drift = Math.abs(next_size - current_size) / current_size
  if (drift > RELOAD_SIZE_TOLERANCE) {
    logger.log(
      `${label} reload size drift ${(drift * 100).toFixed(1)}% exceeds ${RELOAD_SIZE_TOLERANCE * 100}% (${current_size} -> ${next_size}); keeping existing`,
    )
    return false
  }
  return true
}

// Build a fresh PSL map from disk. Caller swaps it into exports atomically;
// if the load fails or yields nothing usable, the existing map is untouched.
const build_psl_map = async () => {
  // Parsing rules: http://publicsuffix.org/list/
  const entries = await load_list_from_file('public-suffix-list')
  const next = new Map()
  for (const entry of entries) {
    const suffix = entry.split(/\s/).shift()
    if (!suffix) continue
    if (suffix.startsWith('//')) continue
    // Exception rules (`!name`) are stored under their literal key;
    // is_public_suffix and get_organizational_domain look them up by that form.
    next.set(suffix, [])
  }
  return next
}

// Best-effort: any failure logs a warning and leaves the existing map intact.
// Initial-load failure is caught by the post-condition check in `exports.ready`.
exports.load_public_suffix_list = async () => {
  let next
  try {
    next = await build_psl_map()
  } catch (err) {
    logger.log(`public-suffix-list reload failed: ${err.message}; keeping existing`)
    return
  }
  if (next.size === 0) {
    logger.log('public-suffix-list reload produced an empty map; keeping existing')
    return
  }
  if (!within_tolerance(next.size, exports.public_suffix_list.size, 'public-suffix-list')) return

  exports.public_suffix_list = next
  logger.log(`loaded ${next.size} Public Suffixes`)
}

const build_tld_sets = async () => {
  const [top, two, three, extra] = await Promise.all([
    load_list_from_file('top-level-tlds'),
    load_list_from_file('two-level-tlds'),
    load_list_from_file('three-level-tlds'),
    load_list_from_file('extra-tlds'),
  ])

  const sets = { top: new Set(top), two: new Set(two), three: new Set(three) }
  for (const tld of extra) {
    const s = tld.split('.')
    if (s.length === 2) sets.two.add(tld)
    else if (s.length === 3) sets.three.add(tld)
  }
  return sets
}

exports.load_tld_files = async () => {
  let next
  try {
    next = await build_tld_sets()
  } catch (err) {
    logger.log(`tld files reload failed: ${err.message}; keeping existing`)
    return
  }
  if (next.top.size === 0 || next.two.size === 0 || next.three.size === 0) {
    logger.log('tld files reload produced an empty set; keeping existing')
    return
  }
  const ok =
    within_tolerance(next.top.size, exports.top_level_tlds.size, 'top-level-tlds') &&
    within_tolerance(next.two.size, exports.two_level_tlds.size, 'two-level-tlds') &&
    within_tolerance(next.three.size, exports.three_level_tlds.size, 'three-level-tlds')
  if (!ok) return

  exports.top_level_tlds = next.top
  exports.two_level_tlds = next.two
  exports.three_level_tlds = next.three
  logger.log(`loaded TLD files:
  1=${next.top.size}
  2=${next.two.size}
  3=${next.three.size}`)
}

const load_list_from_file = async (name) => {
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
// Reloads are best-effort and log on failure, so this is the only place that
// can signal a hard initial-load failure.
exports.ready = (async () => {
  await exports.load_tld_files()
  await exports.load_public_suffix_list()
  if (
    exports.public_suffix_list.size === 0 ||
    exports.top_level_tlds.size === 0 ||
    exports.two_level_tlds.size === 0 ||
    exports.three_level_tlds.size === 0
  ) {
    throw new Error('haraka-tld initial load failed: one or more lists are empty')
  }
})()

// every 15 days, check for an update. If updated, reload the PSL.
// The catch is only for update.updatePSLfile (HTTP/disk); load_public_suffix_list
// is best-effort and never throws.
setInterval(
  async () => {
    try {
      const updated = await update.updatePSLfile()
      if (updated) await exports.load_public_suffix_list()
    } catch (err) {
      logger.log(`PSL update check failed: ${err.message}`)
    }
  },
  15 * 86400 * 1000,
).unref()
