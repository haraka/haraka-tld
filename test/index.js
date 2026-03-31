'use strict'

const assert = require('node:assert/strict')
const { before, describe, it } = require('node:test')

const tlds = require('../index')

before(async () => {
  await tlds.ready
})

describe('haraka-tld', () => {
  it('exports lists with reasonable qty', () => {
    assert.ok(tlds.public_suffix_list.size > 7000)
    assert.ok(tlds.top_level_tlds.size > 1000)
    assert.ok(tlds.two_level_tlds.size > 5000)
    assert.ok(tlds.three_level_tlds.size > 2000)
  })
})

const od_test_cases = {
  null: [null, null],

  // Mixed case.
  COM: ['COM', null],
  'example.COM': ['example.COM', 'example.com'],
  'WwW.example.COM': ['WwW.example.COM', 'example.com'],

  // Leading dot.
  '.com': ['.com', null],
  '.example': ['.example', null],
  '.example.com': ['.example.com', null],
  '.example.example': ['.example.example', null],

  // Unlisted TLD.
  example: ['example', null],
  'example.example': ['example.example', null],

  // Listed, but non-Internet, TLD.
  local: ['local', null],
  'example.local': ['example.local', null],
  'b.example.local': ['b.example.local', null],
  'a.b.example.local': ['a.b.example.local', null],

  // TLD with only 1 rule.
  biz: ['biz', null],
  'domain.biz': ['domain.biz', 'domain.biz'],
  'b.domain.biz': ['b.domain.biz', 'domain.biz'],
  'a.b.domain.biz': ['a.b.domain.biz', 'domain.biz'],

  com: ['com', null],
  'example.com': ['example.com', 'example.com'],
  'b.example.com': ['b.example.com', 'example.com'],
  'a.b.example.com': ['a.b.example.com', 'example.com'],
  'uk.com': ['uk.com', null],
  'example.uk.com': ['example.uk.com', 'example.uk.com'],
  'b.example.uk.com': ['b.example.uk.com', 'example.uk.com'],
  'a.b.example.uk.com': ['a.b.example.uk.com', 'example.uk.com'],
  'test.ac': ['test.ac', 'test.ac'],

  // TLD with some 2-level rules.
  // TLD with only 1 (wildcard) rule.
  cy: ['cy', null],
  'ac.cy': ['ac.cy', null],
  'biz.cy': ['biz.cy', null],
  'com.cy': ['com.cy', null],

  // More complex TLD.
  jp: ['jp', null],
  'test.jp': ['test.jp', 'test.jp'],
  'www.test.jp': ['www.test.jp', 'test.jp'],
  'ac.jp': ['ac.jp', null],
  'test.ac.jp': ['test.ac.jp', 'test.ac.jp'],
  'www.test.ac.jp': ['www.test.ac.jp', 'test.ac.jp'],
  'kyoto.jp': ['kyoto.jp', null],
  'test.kyoto.jp': ['test.kyoto.jp', 'test.kyoto.jp'],
  'ide.kyoto.jp': ['ide.kyoto.jp', null],
  'b.ide.kyoto.jp': ['b.ide.kyoto.jp', 'b.ide.kyoto.jp'],
  'a.b.ide.kyoto.jp': ['a.b.ide.kyoto.jp', 'b.ide.kyoto.jp'],
  'c.kobe.jp': ['c.kobe.jp', null],
  'b.c.kobe.jp': ['b.c.kobe.jp', 'b.c.kobe.jp'],
  'a.b.c.kobe.jp': ['a.b.c.kobe.jp', 'b.c.kobe.jp'],
  'city.kobe.jp': ['city.kobe.jp', 'city.kobe.jp'],
  'www.city.kobe.jp': ['www.city.kobe.jp', 'city.kobe.jp'],

  // TLD with a wildcard rule and exceptions.
  ck: ['ck', null],
  'test.ck': ['test.ck', null],
  'b.test.ck': ['b.test.ck', 'b.test.ck'],
  'a.b.test.ck': ['a.b.test.ck', 'b.test.ck'],
  'www.ck': ['www.ck', 'www.ck'],
  'www.www.ck': ['www.www.ck', 'www.ck'],
  // US K12.
  us: ['us', null],
  'test.us': ['test.us', 'test.us'],
  'www.test.us': ['www.test.us', 'test.us'],
  'ak.us': ['ak.us', null],
  'test.ak.us': ['test.ak.us', 'test.ak.us'],
  'www.test.ak.us': ['www.test.ak.us', 'test.ak.us'],
  'k12.ak.us': ['k12.ak.us', null],
  'test.k12.ak.us': ['test.k12.ak.us', 'test.k12.ak.us'],
  'www.test.k12.ak.us': ['www.test.k12.ak.us', 'test.k12.ak.us'],

  // IDN labels.
  '食狮.com.cn': ['食狮.com.cn', '食狮.com.cn'],
  '食狮.公司.cn': ['食狮.公司.cn', '食狮.公司.cn'],
  'www.食狮.公司.cn': ['www.食狮.公司.cn', '食狮.公司.cn'],
  'shishi.公司.cn': ['shishi.公司.cn', 'shishi.公司.cn'],
  '公司.cn': ['公司.cn', null],
  '食狮.中国': ['食狮.中国', '食狮.中国'],
  'www.食狮.中国': ['www.食狮.中国', '食狮.中国'],
  'shishi.中国': ['shishi.中国', 'shishi.中国'],
  中国: ['中国', null],

  // Same as above, but punycoded.
  'xn--85x722f.com.cn': ['xn--85x722f.com.cn', '食狮.com.cn'],
  'xn--85x722f.xn--55qx5d.cn': ['xn--85x722f.xn--55qx5d.cn', '食狮.公司.cn'],
  'www.xn--85x722f.xn--55qx5d.cn': ['www.xn--85x722f.xn--55qx5d.cn', '食狮.公司.cn'],
  'shishi.xn--55qx5d.cn': ['shishi.xn--55qx5d.cn', 'shishi.公司.cn'],
  'xn--55qx5d.cn': ['xn--55qx5d.cn', null],
  'xn--fiqs8s': ['xn--fiqs8s', null],
  'atweek.xn--90aekg1c8b.xn--p1ai': ['atweek.xn--90aekg1c8b.xn--p1ai', 'зтъбги.рф'],
}

describe('get_organizational_domain, test suite', () => {
  for (const [descr, [input, expected]] of Object.entries(od_test_cases)) {
    it(descr, () => {
      assert.equal(tlds.get_organizational_domain(input), expected)
    })
  }
})

const ps_test_cases = {
  com: ['com', true],
  'COM (uc)': ['COM', true],
  net: ['net', true],
  'co.uk': ['co.uk', true],
  org: ['org', true],
  edu: ['edu', true],
  gov: ['gov', true],
  empty: ['', false],
  null: ['', false],
}

describe('is_public_suffix', () => {
  for (const [descr, [input, expected]] of Object.entries(ps_test_cases)) {
    it(descr, () => {
      assert.equal(tlds.is_public_suffix(input), expected)
    })
  }
})

describe('split_hostname', () => {
  it('splits on domain boundary', () => {
    const foo = tlds.split_hostname('host.sub1.sub2.domain.com')
    assert.equal(foo[0], 'host.sub1.sub2')
    assert.equal(foo[1], 'domain.com')
  })

  for (const level of [1, 2, 3]) {
    it(`splits on domain boundary, level ${level}`, () => {
      const foo = tlds.split_hostname('host.sub1.sub2.domain.com', level)
      assert.equal(foo[0], 'host.sub1.sub2')
      assert.equal(foo[1], 'domain.com')
    })
  }

  it('splits empty host on TLD only', () => {
    assert.deepEqual(tlds.split_hostname('com'), ['', 'com'])
  })

  it('splits a 3-level TLD', () => {
    assert.deepEqual(tlds.split_hostname('host.b.topica.com', 4), ['host', 'b.topica.com'])
  })
})

describe('asParts', () => {
  const testCases = [
    {
      host: 'host.sub1.sub2.domain.com',
      part: { tld: 'com', org: 'domain', host: 'host.sub1.sub2' },
    },
    {
      host: 'bbc.co.uk',
      part: { tld: 'co.uk', org: 'bbc', host: '' },
    },
    {
      host: 'www.bbc.co.uk',
      part: { tld: 'co.uk', org: 'bbc', host: 'www' },
    },
    {
      host: 'com',
      part: { tld: 'com', org: '', host: '' },
    },
  ]

  for (const { host, part } of testCases) {
    it(`returns ${host} as parts`, () => {
      assert.deepEqual(tlds.asParts(host), part)
    })
  }
})
