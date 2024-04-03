
### Unreleased


### [1.2.1] - 2024-04-03

- dep(punycode): specify as punycode.js
  - which always avoid name conflict with stale node.js built-in
- doc(README): update ci badge URLs (#82)
- dep(mocha & eslint): remove from devDeps (install with npx)
- pkg: add ./test to .npmignore


### [1.2.0] - 2023-12-12

- dep(punycode): correctly specify (with trailing /)
    - to override built-in, which emits warnings


### [1.1.2] - 2023-12-11

- updated TLD files
- Update README.md (#78)


### [1.1.1] - 2023-06-16

- updated TLD files
- fix: update_tld_files and update installed copies (#76)


### [1.1.0] - 2022-09-29

- updated TLD files
- switch http -> https for extra-tlds URL
- for PSL updater, use project root, #74


### [1.0.34] - 2022-06-05
 
- ci: reusable workflows from haraka/.github
- ci: fix publish workflow (#66)
- ci: workflow tweaks (#64)
- ci: add codeql.yml (#65)
- ci: update codeclimate config
- chore: replace some promises with async/await


#### 1.0.30 - 2022-05-23

- update TLD files
- dep(\*): pin major versions


#### 1.0.29 - 2021-10-10

- update TLD files
- upon merge to master, automatically publish new version


#### 1.0.28 - 2021-06-09

- update TLD files & bump version
- allow disabling logging with env.HARAKA_LOGS_SUPPRESS


### 1.0.27 - 2021-01-05

- update TLD files & bump version


### 1.0.26 - 2020-10-23

- bump version
- replace travis & AppVeyor with GH workflow


### 2019-08-19

- unref interval, so node.js process exits normally (#52)


### 1.0.24 - 2019-04-09

- add an automatic PSL updater, updates the PSL each 15 days
- assuming no ill effects, after some release validation, extend to the other TLD files
- and say goodbye to `update TLD files` releases


### 1.0.23 - 2019-03-30

* update TLD files


### 1.0.22 - 2018-11-14

* update TLD files


### 1.0.21 - 2018-07-20

* update TLD files


### 1.0.20 - 2018-06-15

* update TLD files


### 1.0.19 - 2018-03-07

* update TLD files


### 1.0.18 - 2017-12-30

* update TLD files


### 1.0.17 - 2017-09-10

* update TLD files


### 1.0.16 - 2017-07-30

* update TLD files
* dev/CI updates


### 1.0.15 - 2017-06-16

* update TLD files
* update for eslint4 compat


### 1.0.14 - 2017-05-22

* update TLD files


### 1.0.13 - Feb 01, 2017

* update TLD files
* added INSTALL section to README
* inherit lint rules from eslint-plugin-haraka
* remove grunt-version-check (replaced by greenkeeper)
* remove Grunt entirely


### 1.0.12 - Dec 28, 2016

* update TLD files


### 1.0.11 - Nov 13, 2016

* update TLD files


### 1.0.10 - Oct 06, 2016

* update TLD files
* update lint / code coverage meta


### 1.0.9 - Aug 22, 2016

* update TLD files


### 1.0.7 - Jul 20, 2016

* update TLD files
* update dep version numbers


### 1.0.6 - Jun 20, 2016

* update TLD files
* added curl -S (report errors) and -f (don't save files when HTTP errors encountered)


### 1.0.5 - May 16, 2016

* updated TLD files


### 1.0.4 - Feb 22, 2016

* use `__dirname` for installed base path


### 1.0.2 - Feb 05, 2016

* updated lists
* added Gruntfile.js


### 1.0.1 - Feb 05, 2016

* update path to etc dir


[1.0.32]: https://github.com/haraka/haraka-tld/releases/tag/1.0.31
[1.0.34]: https://github.com/haraka/haraka-tld/releases/tag/1.0.33
[1.1.0]: https://github.com/haraka/haraka-tld/releases/tag/1.1.0
[1.1.1]: https://github.com/haraka/haraka-tld/releases/tag/1.1.1
[1.1.2]: https://github.com/haraka/haraka-tld/releases/tag/1.1.2
[1.2.0]: https://github.com/haraka/haraka-tld/releases/tag/1.2.0
[1.2.1]: https://github.com/haraka/haraka-tld/releases/tag/1.2.1
