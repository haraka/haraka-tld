[![Build Status][ci-img]][ci-url]
[![Windows Build Status][ci-win-img]][ci-win-url]
[![Code Coverage][cov-img]][cov-url]
[![Code Climate][clim-img]][clim-url]
[![NPM][npm-img]][npm-url]

# haraka-tld

Haraka TLD utilities

## Installation

    npm install haraka-tld

## Usage

    const tlds = require('haraka-tld');
    if (tlds.get_organizational_domain('mail.example.com') === 'example.com') {
        // do something
    }


## Functions exported

### get_organizational_domain

Reduces a hostname to an Organizational Domain.

The O.D. is the portion of a domain name immediately delegated by a registrar and the portion that is no longer 'Public'

    com               <-- TLD (or Public Suffix)
    example.com       <-- Organizational Domain
    mail.example.com  <-- hostmame

get_organizational_domain('mail.example.com'); // -> example.com

### Haraka usage example:

    const tlds = require('haraka-tld');
    const from_dom = tlds.get_organizational_domain(connection.transaction.mail_from.host);
    const to_dom = tlds.get_organizational_domain(connection.transaction.rcpt_to.host);
    if (from_dom == to_dom) {
        // the envelope sender domain matches the envelope receiver domain
        // eg: root@mail.example.com would match sysadmin@example.com
    }

### split_hostname

Split FQDN to host and domain

    const split = tlds.split_hostname('host.sub1.sub2.domain.com');
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

* update the TLD files with `./update_tld_files`
* use the .release scripts to roll a new release. If the .release dir is empty (first time), populate it with `git submodule update --init --recursive`.

```sh
.release/start.sh patch
$edit CHANGELOG.md
git add . && git commit
.release/submit.sh
```


[ci-img]: https://github.com/haraka/haraka-tld/workflows/Module%20Tests/badge.svg
[ci-url]: https://github.com/haraka/haraka-tld/actions?query=workflow%3A%22Module+Tests%22
[ci-win-img]: https://github.com/haraka/haraka-tld/workflows/Module%20Tests%20-%20Windows/badge.svg
[ci-win-url]: https://github.com/haraka/haraka-tld/actions?query=workflow%3A%22Module+Tests+-+Windows%22
[cov-img]: https://codecov.io/github/haraka/haraka-tld/coverage.svg
[cov-url]: https://codecov.io/github/haraka/haraka-tld
[clim-img]: https://codeclimate.com/github/haraka/haraka-tld/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/haraka-tld
[npm-img]: https://nodei.co/npm/haraka-tld.png
[npm-url]: https://www.npmjs.com/package/haraka-tld

