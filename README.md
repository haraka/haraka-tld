[![Build Status][ci-img]][ci-url]
[![Windows Build Status][ci-win-img]][ci-win-url]
[![Code Coverage][cov-img]][cov-url]
[![Code Climate][clim-img]][clim-url]
[![Greenkeeper badge][gk-img]][gk-url]
[![NPM][npm-img]][npm-url]

# haraka-tld

Haraka TLD utilities

## Installation

    npm install haraka-tld

## Usage

    var tlds = require('haraka-tld');
    if (tlds.get_organizational_domain('mail.example.com') === 'example.com') {
        // do something
    }
)

## Functions exported

### get_organizational_domain

Reduces a hostname to an Organizational Domain.

The O.D. is the portion of a domain name immediately delegated by a registrar and the portion that is no longer 'Public'

    com               <-- TLD (or Public Suffix)
    example.com       <-- Organizational Domain
    mail.example.com  <-- hostmame

get_organizational_domain('mail.example.com'); // -> example.com

### Haraka usage example:

    var tlds = require('haraka-tld');
    var from_dom = tlds.get_organizational_domain(connection.transaction.mail_from.host);
    var to_dom = tlds.get_organizational_domain(connection.transaction.rcpt_to.host);
    if (from_dom == to_dom) {
        // the envelope sender domain matches the envelope receiver domain
        // eg: root@mail.example.com would match sysadmin@example.com
    }

### split_hostname

Split FQDN to host and domain

    var split = tlds.split_hostname('host.sub1.sub2.domain.com');
    // split[0] = 'host.sub1.sub2';
    // split[1] = 'domain.com';

### is_public_suffix

    if (tlds.is_public_suffix('com')) {
        // true
    }
    if (tlds.is_public_suffix('wikipedia.org')) {
        // false
    }


## Directly access lists

### Check for a TLD

    if (tlds.top_level_tlds['com']) {
        // true
    }


## The following files are included

* public-suffix-list

A list of all Public Suffixes (the parts of a domain name exactly
one level below the registrar). Includes punycoded international domains, is
maintained by the Mozilla project, and accomplishes roughly the same task
as the \*-tlds files.

* top-level-tlds

The list of TLDs valid on the internet. [Update URL](http://data.iana.org/TLD/tlds-alpha-by-domain.txt)

* two-level-tlds

A list of 2nd level TLDs. [Update URL](http://george.surbl.org/two-level-tlds)

* three-level-tlds

A list of 3rd level TLDs. [Update URL](http://www.surbl.org/tld/three-level-tlds)

* extra-tlds

This allows for additional 2nd and 3rd level TLDs from a single file. Used for site customizations or for the URIBL hosters.txt. [Update URL](http://rss.uribl.com/hosters/hosters.txt)


## Updating

* run the update script (see below)
* update Changes.md file
* update version in package.json
* publish to npm

```sh
./update_tld_files
vim Changes.md package.json
npm release
```


[ci-img]: https://travis-ci.org/haraka/haraka-tld.svg
[ci-url]: https://travis-ci.org/haraka/haraka-tld
[ci-win-img]: https://ci.appveyor.com/api/projects/status/j58d7ekpgxgivao8?svg=true
[ci-win-url]: https://ci.appveyor.com/project/msimerson/haraka-tld
[cov-img]: https://codecov.io/github/haraka/haraka-tld/coverage.svg
[cov-url]: https://codecov.io/github/haraka/haraka-tld
[clim-img]: https://codeclimate.com/github/haraka/haraka-tld/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/haraka-tld
[npm-img]: https://nodei.co/npm/haraka-tld.png
[npm-url]: https://www.npmjs.com/package/haraka-tld
[gk-img]: https://badges.greenkeeper.io/haraka/haraka-tld.svg
[gk-url]: https://greenkeeper.io/

