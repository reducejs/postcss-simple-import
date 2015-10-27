var test = require('tape')
var atImport = require('..')
var postcss = require('postcss')
var path = require('path')
var fs = require('fs')

var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

function run(opts, src, expected, t) {
  var srcFile = fixtures(getFile(src))
  var body = getContents(src)
  body = body === null ? fs.readFileSync(srcFile, 'utf8') : body
  return postcss(atImport(opts || {}))
    .process(body, { from: srcFile })
    .then(function (result) {
      var expectedBody = getContents(expected)
      if (expectedBody === null) {
        var expectedFile = getFile(expected)
        expectedFile = expectedFile && fixtures(expectedFile) || path.join(
          path.dirname(srcFile),
          path.basename(srcFile, '.css') + '.expected.css'
        )
        expectedBody = fs.readFileSync(expectedFile, 'utf8')
      }
      t.equal(result.css.trim(), expectedBody.trim())
    })
}

function getFile(o) {
  if (typeof o === 'string') {
    return o
  }
  return o && o.file
}

function getContents(o) {
  if (o && typeof o === 'object') {
    return o.source
  }
  return null
}

test('resolve', run.bind(
  null,
  null,
  'resolve.css',
  null
))

test('custom resolve', run.bind(
  null,
  {
    resolve: {
      pathFilter: function (pkg, p, relativePath) {
        return relativePath.replace('xxx-', '')
      },
    },
  },
  {
    file: 'custom-resolve.css',
    source: '@import "./xxx-resolve";',
  },
  'resolve.expected.css'
))

test('readFile', run.bind(
  null,
  {
    resolve: function (id) {
      return Promise.resolve(fixtures(id))
    },
    readFile: function (file) {
      var basename = path.basename(file, '.css')
      var src
      if (basename === 'a') {
        src = '@import "b.css";\na {}'
      } else if (basename === 'b') {
        src = '@import "c.css";\nb {}'
      } else if (basename === 'c') {
        src = 'c {}'
      }
      return Promise.resolve(src)
    },
  },
  { file: 'readFile.css', source: '@import "a.css";' },
  { source: 'c {}\nb {}\na {}' }
))

test('cache', run.bind(
  null,
  {
    resolve: function (id) {
      return Promise.resolve(fixtures(id))
    },
    cache: (function () {
      var c = {}
      c[fixtures('a.css')] = '@import "b.css";\na {}'
      c[fixtures('b.css')] = '@import "c.css";\nb {}'
      c[fixtures('c.css')] = 'c {}'
      return c
    })(),
  },
  { file: 'cache.css', source: '@import "a.css";' },
  { source: 'c {}\nb {}\na {}' }
))

test('parse', run.bind(
  null,
  {
    resolve: function (id) {
      return Promise.resolve(fixtures(id))
    },
    cache: (function () {
      var c = {}
      c[fixtures('a.css')] = '@import "b.css";\na {}'
      c[fixtures('b.css')] = '@import "c.css";\nb {}'
      c[fixtures('c.css')] = 'c {}'
      return c
    })(),
    parse: function (row) {
      return Promise.resolve(postcss.parse(row.source, { from: row.file }))
        .then(function (root) {
          if (row.file === fixtures('a.css')) {
            root.append(postcss.comment({ text: 'parse' }))
          }
          return root
        })
    },
  },
  { file: 'parse.css', source: '@import "a.css";' },
  { source: 'c {}\nb {}\na {}\n/* parse */' }
))

test('atRule', run.bind(
  null,
  {
    resolve: function (id) {
      return Promise.resolve(fixtures(id))
    },
    atRule: 'require',
    cache: (function () {
      var c = {}
      c[fixtures('a.css')] = '@require "b.css";\na {}'
      c[fixtures('b.css')] = '@require "c.css";\nb {}'
      c[fixtures('c.css')] = 'c {}'
      return c
    })(),
  },
  { file: 'atRule.css', source: '@require "a.css";' },
  { source: 'c {}\nb {}\na {}' }
))

test('glob', run.bind(
  null,
  { glob: true },
  { file: 'glob_imports/glob.css', source: '@import "*.css";' },
  { source: 'a {}\nb {}\nc {}' }
))

test('importer', run.bind(
  null,
  {
    importer: function (url) {
      var c = {
        a: '@import "b.css";\na {}',
        b: '@import "c.css";\nb {}',
        c: 'c {}',
      }
      var base = path.basename(url, '.css')
      return Promise.resolve({ file: fixtures(url), source: c[base] })
    },
  },
  { file: 'importer.css', source: '@import "a.css";' },
  { source: 'c {}\nb {}\na {}' }
))

test('dedupe', run.bind(
  null,
  {
    resolve: function (id) {
      return Promise.resolve(fixtures(id))
    },
    cache: (function () {
      var c = {}
      c[fixtures('a.css')] = '@import "c.css";\n@import "b.css";\na {}'
      c[fixtures('b.css')] = '@import "c.css";\nb {}'
      c[fixtures('c.css')] = 'c {}'
      return c
    })(),
  },
  { file: 'dedupe.css', source: '@import "a.css";' },
  { source: 'c {}\nb {}\na {}' }
))

