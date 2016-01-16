# haraka-tld

Haraka TLD utilities

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

* run the updater script (see below)
* update package.json version
* npm publish

```sh
./update_tld_files
```

