# postcss-simple-import
[![version](https://img.shields.io/npm/v/postcss-simple-import.svg)](https://www.npmjs.org/package/postcss-simple-import)
[![status](https://travis-ci.org/zoubin/postcss-simple-import.svg?branch=master)](https://travis-ci.org/zoubin/postcss-simple-import)
[![coverage](https://img.shields.io/coveralls/zoubin/postcss-simple-import.svg)](https://coveralls.io/github/zoubin/postcss-simple-import)
[![dependencies](https://david-dm.org/zoubin/postcss-simple-import.svg)](https://david-dm.org/zoubin/postcss-simple-import)
[![devDependencies](https://david-dm.org/zoubin/postcss-simple-import/dev-status.svg)](https://david-dm.org/zoubin/postcss-simple-import#info=devDependencies)

Consume `@import` in css recursively.

* `@import` [node](https://nodejs.org/api/modules.html#modules_all_together)-style modules
* Resolve the module entry according to the `style` field of `package.json` rather than `main`
* Files are imported only once

## Options

### atRule
Specify the name of at-rules to be processed.

Type: `String`

Default: `import`

### importer
Specify how to load files when processing `@import`.

Type: `Function`

Signature: `importer(url, from, opts)`

* `url`: `@import "url";`
* `from`: the absolute path of the current css file
* `opts`: the options object

[`opts.postcssOpts`](#postcssopts) is accessible.

Should return an array of objects (or promises) with the following fields:
* `from`: *String* *required* the resolved file path
* `source`: *String* *optional* the contents of the file

If `undefined` returned, the `importer` will be ignored.

### cache
File contents cache.

### readFile
Specify how to read file contents.

Type: `Function`

Signature: `readFile(filename)`

Should return a string (or promise) of contents of the file.

### glob
Specify how to resolve globs.

It should have `glob.hasMagic(url)` to check whether globs exist.

Type: `Function`

Receives the glob string, and an object `{ cwd: dirname_of_the_processed_file }`.

Should return an array (or a promise) of file paths.

Type: `true`
A promisified version of [glob](https://github.com/isaacs/node-glob) is used.

### resolve
Specify how to resolve file paths.

Type: `Function`

Receives the import string, and an object `{ basedir: dirname_of_the_processed_file }`.

Should return an absolute file path (or promise).

Type: `Object`

Passed to [custom-resolve](https://github.com/zoubin/custom-resolve) to create the resolve function.

```javascript
var resolver = require('custom-resolve')
opts.resolve = promisify(resolver(mix({
  packageEntry: 'style',
  extensions: '.css',
  symlinks: true, // resolve all soft links to their real paths
}, opts.resolve)))

```

### parse
Specify how to build an AST from the source.

Type: `Function`

Signature: `parse(source, from)`

Should return the AST object (or promise).

### onImport
**Deprecated**

Use the [imports](#imports) event instead.

Type: `Function`

Signature: `onImport(from, imports, postcssOpts)`

* `from`: the css file
* `imports`: files directly imported by `from`
* `postcssOpts`: [postcssOpts](#postcssopts)

### on
Event listeners.

Type: `Object`

#### import
Fired right after file path resolved, but before compilation.

Listener signature: `fn(importedFile, from, opts)`

[`opts.postcssOpts`](#postcssopts) is accessible.


#### imports
Fired right after compilation.

Listener signature: `fn(imports, from, opts)`

* `imports`: `Array`

[`opts.postcssOpts`](#postcssopts) is accessible.

### postcssOpts

Type: `Object`

Options passed to `process(source, postcssOpts)`

